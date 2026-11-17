import { PrismaClient, Role, UserStatus, ExperienceLevel } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateSeedQuestions } from "./seedQuestions";
import { curatedProblems } from "./seedProblems";

const prisma = new PrismaClient();

function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("Seeding database skeleton and question bank...");

  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 12);
  const candidatePasswordHash = await bcrypt.hash("CandidatePass123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sdp.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@sdp.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      targetRole: "Platform Lead",
      experienceLevel: ExperienceLevel.ONE_TO_THREE,
      emailVerified: true,
      skills: ["System Design", "Architecture"],
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: "candidate@sdp.com" },
    update: {},
    create: {
      name: "Demo Candidate",
      email: "candidate@sdp.com",
      passwordHash: candidatePasswordHash,
      role: Role.CANDIDATE,
      status: UserStatus.ACTIVE,
      targetRole: "Software Engineer",
      experienceLevel: ExperienceLevel.FRESHER,
      emailVerified: true,
      skills: ["TypeScript", "React", "Node.js"],
    },
  });

  console.log(`Seeded admin: ${admin.email} and candidate: ${candidate.email}`);

  // Seed 200+ Questions
  const seedQuestions = generateSeedQuestions();
  console.log(`Seeding ${seedQuestions.length} curated questions across roles and types...`);

  let count = 0;
  for (const q of seedQuestions) {
    const normalized = normalizeQuestionText(q.text);
    const existing = await prisma.question.findFirst({
      where: { normalizedText: normalized },
    });

    if (!existing) {
      await prisma.question.create({
        data: {
          text: q.text,
          normalizedText: normalized,
          type: q.type,
          role: q.role,
          difficulty: q.difficulty,
          idealAnswer: q.idealAnswer,
          isSeeded: true,
        },
      });
      count++;
    }
  }

  console.log(`Successfully seeded ${count} new questions. Total in DB: ${await prisma.question.count()}`);

  // Seed Curated Coding Problems (30+ problems with test cases)
  console.log(`Seeding ${curatedProblems.length} curated coding problems and test cases...`);
  let probCount = 0;
  for (const p of curatedProblems) {
    const existing = await prisma.codingProblem.findUnique({
      where: { slug: p.slug },
    });

    if (!existing) {
      const problem = await prisma.codingProblem.create({
        data: {
          title: p.title,
          slug: p.slug,
          topic: p.topic,
          difficulty: p.difficulty,
          statement: p.statement,
          constraints: p.constraints,
          sampleCases: p.sampleCases,
          starterCode: p.starterCode,
        },
      });

      for (let i = 0; i < p.testCases.length; i++) {
        const tc = p.testCases[i];
        await prisma.testCase.create({
          data: {
            problemId: problem.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            orderIndex: i,
          },
        });
      }
      probCount++;
    }
  }

  console.log(`Successfully seeded ${probCount} new coding problems with test cases! Total in DB: ${await prisma.codingProblem.count()}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
