"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, KeyRound, Trash2, Save, X, Plus } from "lucide-react";
import { apiClient, setAccessToken } from "../../../lib/api";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { useToast } from "../../../components/ui/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const { success } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    targetRole: string;
    experienceLevel: string;
    skills: string[];
    createdAt: string;
  } | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    targetRole: "",
    experienceLevel: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient<{ data: any }>("/me");
        setProfile(res.data);
        setProfileForm({
          name: res.data.name,
          targetRole: res.data.targetRole,
          experienceLevel: res.data.experienceLevel,
        });
        setSkills(res.data.skills || []);
      } catch (err: any) {
        setError("Failed to load profile. Please log in.");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveLoading(true);

    try {
      const res = await apiClient<{ data: any }>("/me", {
        method: "PATCH",
        body: JSON.stringify({
          ...profileForm,
          skills,
        }),
      });
      setProfile(res.data);
      success("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await apiClient("/me/password", {
        method: "POST",
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm({ oldPassword: "", newPassword: "" });
      success("Password changed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    try {
      await apiClient("/me", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      setAccessToken(null);
      success("Account scheduled for deletion. You have 30 days to log back in.");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account information, target role, and credentials.
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* Main Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-brand-600" />
          Candidate Information
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={profileForm.targetRole}
                onChange={(e) => setProfileForm({ ...profileForm, targetRole: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Experience Level
              </label>
              <select
                value={profileForm.experienceLevel}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, experienceLevel: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="FRESHER">Fresher</option>
                <option value="0_1_YEARS">0 - 1 Years</option>
                <option value="1_3_YEARS">1 - 3 Years</option>
              </select>
            </div>
          </div>

          {/* Skills tags */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Skills & Tech Stack
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-brand-500 hover:text-brand-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Docker, TypeScript"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="mt-4 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-sm text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.oldPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Account Deletion */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2 mb-1">
          <Trash2 className="w-5 h-5 text-rose-600" />
          Danger Zone: Delete Account
        </h2>
        <p className="text-xs text-rose-700 mb-4">
          Deleting your account will revoke all active sessions. In accordance with data retention
          policy §3.4, your account will be marked for deletion and permanently purged after 30
          days.
        </p>

        {showDeleteModal ? (
          <div className="space-y-3 max-w-md bg-white p-4 rounded-xl border border-rose-300">
            <label className="block text-xs font-semibold text-slate-700 uppercase">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg"
              >
                Confirm Account Deletion
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-lg"
          >
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}
