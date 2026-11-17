import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "AI Interview Preparation Platform API",
    version: "2.0.0",
    description: "REST API for AI-assisted mock interviews, coding challenges, and reporting.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1 Endpoint",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Check service health",
        responses: {
          "200": {
            description: "Service health state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                        db: { type: "string", example: "up" },
                        redis: { type: "string", example: "up" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/meta/options": {
      get: {
        summary: "Retrieve predefined option lists",
        responses: {
          "200": {
            description: "Option metadata for interview setup and coding filters",
          },
        },
      },
    },
  },
};

const router = Router();
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
