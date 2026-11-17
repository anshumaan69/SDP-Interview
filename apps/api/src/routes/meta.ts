import { Router, Request, Response, NextFunction } from "express";
import {
  Difficulty,
  ExperienceLevel,
  InterviewType,
} from "@sdp/shared";
import { redis } from "../lib/redis";

const router = Router();

export const META_ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Product Manager",
  "Software Engineer",
];

export const CODING_TOPICS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
];

const META_CACHE_KEY = "cache:meta:options";
const META_CACHE_TTL = 86400; // 24 hours

router.get("/meta/options", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cached = await redis.get(META_CACHE_KEY);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const payload = {
      data: {
        roles: META_ROLES,
        types: Object.values(InterviewType),
        difficulties: Object.values(Difficulty),
        experienceLevels: Object.values(ExperienceLevel),
        codingTopics: CODING_TOPICS,
      },
    };

    await redis.set(META_CACHE_KEY, JSON.stringify(payload), "EX", META_CACHE_TTL);
    return res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
