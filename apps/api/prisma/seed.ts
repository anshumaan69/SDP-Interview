import { PrismaClient, Role, UserStatus, ExperienceLevel } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database skeleton...");

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
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
