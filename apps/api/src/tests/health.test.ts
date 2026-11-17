import request from "supertest";
import { app } from "../app";

describe("Health Check API", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("status", "ok");
    expect(res.body.data).toHaveProperty("db");
    expect(res.body.data).toHaveProperty("redis");
  });

  it("GET /api/v1/health returns 200 with status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("GET /meta/options returns option lists", async () => {
    const res = await request(app).get("/api/v1/meta/options");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("roles");
    expect(res.body.data).toHaveProperty("types");
    expect(res.body.data).toHaveProperty("difficulties");
    expect(res.body.data).toHaveProperty("experienceLevels");
    expect(res.body.data).toHaveProperty("codingTopics");
  });
});
