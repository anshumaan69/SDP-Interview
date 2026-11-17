import { Router, Request, Response } from "express";
import {
  Difficulty,
  ExperienceLevel,
  InterviewType,
} from "@sdp/shared";

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

router.get("/meta/options", (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      roles: META_ROLES,
      types: Object.values(InterviewType),
      difficulties: Object.values(Difficulty),
      experienceLevels: Object.values(ExperienceLevel),
      codingTopics: CODING_TOPICS,
    },
  });
});

export default router;
