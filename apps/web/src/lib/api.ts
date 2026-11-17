import { ApiErrorResponse } from "@sdp/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("sdp_access_token", token);
    } else {
      localStorage.removeItem("sdp_access_token");
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("sdp_access_token");
  }
  return accessToken;
}

interface RequestOptions extends RequestInit {
  retryOn401?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { retryOn401 = true, headers = {}, ...rest } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = getAccessToken();
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  const response = await fetch(url, {
    credentials: "include", // send httpOnly cookies (refresh token)
    headers: requestHeaders,
    ...rest,
  });

  if (response.status === 401 && retryOn401 && !endpoint.includes("/auth/refresh")) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          return apiClient<T>(endpoint, {
            ...options,
            retryOn401: false,
          });
        }
      }
    } catch (e) {
      // Refresh failed
      setAccessToken(null);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorResponse = data as ApiErrorResponse;
    const error = new Error(
      errorResponse.error?.message || `Request failed with status ${response.status}`
    ) as Error & { code?: string; details?: unknown; status: number };
    error.code = errorResponse.error?.code || "UNKNOWN_ERROR";
    error.details = errorResponse.error?.details;
    error.status = response.status;
    throw error;
  }

  return data as T;
}
