import { Difficulty, InterviewType } from "@sdp/shared";

export interface SeedQuestion {
  text: string;
  type: InterviewType;
  role: string;
  difficulty: Difficulty;
  idealAnswer: string;
}

const roles = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Product Manager",
];

const questionTemplates: Array<{
  textTemplate: (role: string) => string;
  type: InterviewType;
  difficulty: Difficulty;
  idealAnswer: string;
}> = [
  // 1. Technical - Core
  {
    textTemplate: (r) => `Explain how the event loop operates in Node.js or JavaScript runtime, and how microtasks differ from macrotasks in the context of a ${r}.`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "The event loop manages execution of synchronous code, microtasks (Promise callbacks, process.nextTick), and macrotasks (setTimeout, setInterval, I/O callbacks). Microtask queues are cleared between each macrotask execution.",
  },
  {
    textTemplate: (r) => `What is the difference between TCP and UDP, and when would you choose one over the other in a modern ${r} system?`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.EASY,
    idealAnswer: "TCP is connection-oriented, reliable with ordered packet delivery and retransmission, ideal for web APIs. UDP is connectionless and lightweight, used in real-time gaming and audio/video streaming.",
  },
  {
    textTemplate: (r) => `How would you design a distributed caching layer using Redis for high-throughput ${r} architectures, handling cache penetration, breakdown, and avalanche?`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.HARD,
    idealAnswer: "Use bloom filters to prevent cache penetration, mutex locks for cache breakdown (hot spot keys), and randomized jitter TTLs to prevent simultaneous cache avalanche.",
  },
  {
    textTemplate: (r) => `As a ${r}, explain the ACID properties in relational databases and how PostgreSQL implements MVCC for concurrent transactions.`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "ACID stands for Atomicity, Consistency, Isolation, and Durability. MVCC creates snapshot versions of rows with xmin/xmax transaction IDs, allowing readers not to block writers and vice versa.",
  },
  {
    textTemplate: (r) => `Explain the difference between optimistic locking and pessimistic locking with a real-world scenario relevant to a ${r}.`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "Optimistic locking checks version/timestamp columns before committing, best for read-heavy low contention. Pessimistic locking acquires SELECT FOR UPDATE database locks, best for high-contention financial transfers.",
  },
  {
    textTemplate: (r) => `How do you identify and resolve memory leaks in a production service as a ${r}?`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.HARD,
    idealAnswer: "Profile heap allocations with heap snapshots, monitor GC pause durations, analyze object retention paths, check for dangling event listeners or unbounded caching maps.",
  },
  {
    textTemplate: (r) => `Explain the CAP theorem to a teammate and describe how you navigate consistency versus availability trade-offs as a ${r}.`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.HARD,
    idealAnswer: "In a network partition, a distributed system must choose between Consistency (all nodes return latest data or error) and Availability (every request gets a non-error response, possibly stale).",
  },
  {
    textTemplate: (r) => `From a ${r} security perspective, what is SQL injection, how does it occur, and how do parameterized queries mitigate it completely?`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.EASY,
    idealAnswer: "SQL injection occurs when unescaped user input is concatenated into query strings. Parameterized queries pre-compile query structure and treat inputs as literal data values rather than executable SQL tokens.",
  },

  // 2. Technical - Specific to Web / Architecture
  {
    textTemplate: (r) => `As a ${r}, what are the trade-offs between Server-Side Rendering (SSR), Client-Side Rendering (CSR), and Static Site Generation (SSG)?`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "SSR improves first contentful paint and SEO at higher server CPU cost. SSG offers maximum CDN speed for static content. CSR offloads rendering to the browser but degrades initial load time.",
  },
  {
    textTemplate: (r) => `Explain horizontal versus vertical scaling for a ${r}, and how stateful sessions affect horizontal scalability.`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.EASY,
    idealAnswer: "Vertical scaling increases CPU/RAM of a single machine. Horizontal scaling adds multiple nodes behind a load balancer. Stateful sessions require sticky sessions or external distributed session stores like Redis.",
  },
  {
    textTemplate: (r) => `How does Database Indexing work under the hood with B-Trees, and how do you optimize index selection as a ${r}?`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "B-Trees keep data sorted and allow logarithmic search, insertion, and deletion. Because every INSERT/UPDATE/DELETE requires updating index tree nodes, excessive indexing slows write operations.",
  },
  {
    textTemplate: (r) => `Explain how idempotency is achieved in RESTful and messaging APIs designed by a ${r}, particularly for critical operations.`,
    type: InterviewType.TECHNICAL,
    difficulty: Difficulty.HARD,
    idealAnswer: "Idempotency keys passed in request headers are stored with transaction state in a database or Redis cache with atomic SETNX, returning the cached response if a duplicate request arrives.",
  },

  // 3. Behavioural
  {
    textTemplate: (r) => `As a ${r}, tell me about a time when you disagreed with a technical design decision made by a senior colleague or team lead. How did you handle it?`,
    type: InterviewType.BEHAVIOURAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "I collected benchmark data and concrete trade-off comparisons, scheduled a private respectful discussion, focused on project objectives, and ultimately committed to the team consensus.",
  },
  {
    textTemplate: (r) => `Describe a situation in your role as a ${r} where a project deadline was at risk. What steps did you take to manage stakeholder expectations and deliver?`,
    type: InterviewType.BEHAVIOURAL,
    difficulty: Difficulty.EASY,
    idealAnswer: "I audited remaining features, negotiated a reduced MVP scope with product managers, established daily syncs, and delivered the core value on time without compromising reliability.",
  },
  {
    textTemplate: (r) => `Give an example of a production incident or bug you encountered as a ${r}. How did you mitigate it, communicate with stakeholders, and prevent recurrence?`,
    type: InterviewType.BEHAVIOURAL,
    difficulty: Difficulty.HARD,
    idealAnswer: "I rolled back immediately to restore service, communicated proactively with team members, authored a blameless post-mortem, and added automated regression tests and pre-deployment safeguards.",
  },
  {
    textTemplate: (r) => `Tell me about a time you mentored an engineer or helped an onboarding teammate ramp up quickly in their ${r} responsibilities.`,
    type: InterviewType.BEHAVIOURAL,
    difficulty: Difficulty.EASY,
    idealAnswer: "I established pair-programming sessions, created starter documentation with common pitfalls, and conducted constructive code reviews focusing on architectural patterns and growth.",
  },
  {
    textTemplate: (r) => `Describe a time as a ${r} when you received harsh or critical feedback on your work. How did you react and what changes did you make?`,
    type: InterviewType.BEHAVIOURAL,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "I listened without defensiveness, separated emotion from technical critique, asked clarifying questions, and created an actionable improvement checklist to address the gaps.",
  },

  // 4. HR & Culture
  {
    textTemplate: (r) => `Why are you interested in pursuing a career as a ${r}, and what motivates you to excel in this field?`,
    type: InterviewType.HR,
    difficulty: Difficulty.EASY,
    idealAnswer: "I am passionate about solving complex system challenges and building scalable user-centric software. I stay motivated through continuous learning and seeing measurable real-world user impact.",
  },
  {
    textTemplate: (r) => `Where do you see yourself in three years as a ${r}, both technically and professionally?`,
    type: InterviewType.HR,
    difficulty: Difficulty.EASY,
    idealAnswer: "I aim to deepen my expertise in distributed architectures, lead high-impact system initiatives, and mentor emerging engineers while contributing to cross-functional product direction.",
  },
  {
    textTemplate: (r) => `In your day-to-day role as a ${r}, how do you prioritize competing tasks when multiple stakeholders demand urgent delivery?`,
    type: InterviewType.HR,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "I evaluate business impact versus engineering effort using an impact matrix, clarify dependencies with managers, and establish transparent progress roadmaps.",
  },
  {
    textTemplate: (r) => `How do you maintain a healthy work-life balance while working in high-pace environments as a ${r}?`,
    type: InterviewType.HR,
    difficulty: Difficulty.EASY,
    idealAnswer: "I set clear focus boundaries, practice deep work during core hours, automate repetitive tasks, and disconnect intentionally after work to avoid burnout.",
  },

  // 5. Mixed / Situational
  {
    textTemplate: (r) => `Imagine your team is migrating a legacy monolith to microservices. As a ${r}, how do you evaluate whether microservices are genuinely warranted?`,
    type: InterviewType.MIXED,
    difficulty: Difficulty.HARD,
    idealAnswer: "Analyze team organizational boundaries (Conway's Law), deployment bottleneck frequencies, domain isolation, and operational overhead costs (distributed tracing, network latency).",
  },
  {
    textTemplate: (r) => `As a ${r}, how do you balance technical debt against urgent feature delivery requirements in a fast-growing product?`,
    type: InterviewType.MIXED,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "I categorize debt into critical risk vs manageable friction, allocate dedicated sprint capacity (e.g. 15-20%) for maintenance, and tie refactoring directly to stability and developer velocity.",
  },
  {
    textTemplate: (r) => `If you discover a security vulnerability in production on a Friday afternoon as a ${r}, what is your step-by-step response plan?`,
    type: InterviewType.MIXED,
    difficulty: Difficulty.HARD,
    idealAnswer: "Assess exploitability and data exposure risk, notify the incident response team, apply hotfix or WAF mitigation rule, test in staging, deploy to production, and monitor telemetry.",
  },
  {
    textTemplate: (r) => `What criteria do you use as a ${r} to evaluate whether to build an in-house tool versus adopting a third-party managed service?`,
    type: InterviewType.MIXED,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "Assess core business competency, long-term maintenance costs, total cost of ownership, compliance constraints, and developer time diverted from user-facing features.",
  },
  {
    textTemplate: (r) => `Describe how you test your code end-to-end as a ${r}: what ratio of unit, integration, and e2e tests do you strive for?`,
    type: InterviewType.MIXED,
    difficulty: Difficulty.MEDIUM,
    idealAnswer: "Follow the testing pyramid: a broad foundation of fast unit tests for business logic, integration tests for DB and API contracts, and a targeted suite of end-to-end smoke tests for critical user journeys.",
  },
];

export function generateSeedQuestions(): SeedQuestion[] {
  const result: SeedQuestion[] = [];

  for (const role of roles) {
    for (const t of questionTemplates) {
      result.push({
        text: t.textTemplate(role),
        type: t.type,
        role: role,
        difficulty: t.difficulty,
        idealAnswer: t.idealAnswer,
      });
    }
  }

  return result;
}
