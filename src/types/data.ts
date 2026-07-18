export type YearLevel = "Freshman" | "Sophomore" | "Junior" | "Senior";

export type EventItem = {
  id: string;
  title: string;
  topics: string[];
  date: string; // ISO
  yearLevels: YearLevel[];
  speaker: string;
  speakerRole: string;
  venue: string;
  capacity: number;
  rsvps: number;
};

export type NoteItem = {
  id: string;
  title: string;
  subject: string;
  yearLevel: YearLevel;
  uploader: string;
  uploadedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  fileType: "PDF" | "DOCX" | "PPTX" | "PNG";
  downloads: number;
  stars?: number;
  description?: string;
};

export type LeaderEntry = {
  id: string;
  name: string;
  yearLevel: YearLevel;
  points: number;
};

export const currentUser = {
  id: "stu-042",
  name: "Aria Mendoza",
  studentId: "2024-00421",
  yearLevel: "Junior" as YearLevel,
  email: "aria.m@school.edu",
  points: 340,
  role: "student" as const,
};

export const events: EventItem[] = [
  {
    id: "evt-1",
    title: "Conquering Recursion",
    topics: ["Recursion", "Stack frames", "Base cases"],
    date: "2026-06-25T15:00:00",
    yearLevels: ["Freshman", "Sophomore"],
    speaker: "Liam Park",
    speakerRole: "Senior Student",
    venue: "Room CS-204",
    capacity: 30,
    rsvps: 18,
  },
  {
    id: "evt-2",
    title: "Intro to Big-O",
    topics: ["Complexity", "Asymptotics"],
    date: "2026-06-27T10:30:00",
    yearLevels: ["Freshman"],
    speaker: "Prof. Tanaka",
    speakerRole: "Teacher",
    venue: "Online — Zoom A",
    capacity: 80,
    rsvps: 41,
  },
  {
    id: "evt-3",
    title: "Operating Systems Office Hour",
    topics: ["Scheduling", "Concurrency"],
    date: "2026-06-29T16:00:00",
    yearLevels: ["Junior", "Senior"],
    speaker: "Nadia Cruz",
    speakerRole: "Senior Student",
    venue: "Room CS-301",
    capacity: 20,
    rsvps: 12,
  },
  {
    id: "evt-4",
    title: "Database Design Clinic",
    topics: ["ER models", "Normalization"],
    date: "2026-07-02T14:00:00",
    yearLevels: ["Sophomore", "Junior"],
    speaker: "Marco Lin",
    speakerRole: "Senior Student",
    venue: "Room CS-110",
    capacity: 25,
    rsvps: 7,
  },
];

export const notes: NoteItem[] = [
  { id: "n1", title: "Recursion patterns cheat sheet", subject: "CS101 — Programming I", yearLevel: "Freshman", uploader: "Liam Park", uploadedAt: "2026-06-10", status: "Approved", fileType: "PDF", downloads: 132, stars: 54, description: "Common base cases, stack-frame tricks, and a worked example per pattern." },
  { id: "n2", title: "Big-O reference card", subject: "CS150 — Algorithms", yearLevel: "Sophomore", uploader: "Nadia Cruz", uploadedAt: "2026-06-12", status: "Approved", fileType: "PDF", downloads: 98, stars: 41, description: "One-page asymptotic complexity cheat sheet covering the common families." },
  { id: "n3", title: "OS scheduling worked examples", subject: "CS301 — Operating Systems", yearLevel: "Junior", uploader: "Marco Lin", uploadedAt: "2026-06-18", status: "Approved", fileType: "DOCX", downloads: 41, stars: 17, description: "Round-robin, MLFQ, and lottery scheduling, all with timing diagrams." },
  { id: "n4", title: "ER diagram practice set", subject: "CS220 — Databases", yearLevel: "Sophomore", uploader: "Aria Mendoza", uploadedAt: "2026-06-20", status: "Pending", fileType: "PDF", downloads: 0, stars: 0, description: "Ten ER modelling drills with annotated solutions." },
  { id: "n5", title: "Compilers lecture summary", subject: "CS401 — Compilers", yearLevel: "Senior", uploader: "Hana Yi", uploadedAt: "2026-06-15", status: "Approved", fileType: "PPTX", downloads: 22, stars: 12, description: "Lex / parse / IR / codegen walkthrough condensed from the lecture deck." },
];

export const leaderboard: LeaderEntry[] = [
  { id: "u1", name: "Nadia Cruz", yearLevel: "Senior", points: 980 },
  { id: "u2", name: "Liam Park", yearLevel: "Senior", points: 870 },
  { id: "u3", name: "Marco Lin", yearLevel: "Junior", points: 612 },
  { id: "u4", name: "Hana Yi", yearLevel: "Senior", points: 540 },
  { id: "u5", name: "Aria Mendoza", yearLevel: "Junior", points: 340 },
  { id: "u6", name: "Devon Reyes", yearLevel: "Sophomore", points: 290 },
  { id: "u7", name: "Priya Shah", yearLevel: "Sophomore", points: 240 },
  { id: "u8", name: "Sam Okafor", yearLevel: "Freshman", points: 180 },
  { id: "u9", name: "Ines Roy", yearLevel: "Freshman", points: 140 },
  { id: "u10", name: "Jules Tan", yearLevel: "Junior", points: 120 },
  { id: "u11", name: "Quinn Adler", yearLevel: "Freshman", points: 90 },
  { id: "u12", name: "Rio Salim", yearLevel: "Sophomore", points: 60 },
];

export const pointRules = [
  { action: "Attending a Tutorial Clinic session (QR scan confirmed)", points: "+40" },
  { action: "Uploading approved study notes", points: "+60" },
  { action: "First-time profile completion", points: "+20" },
  { action: "High-demand subject note bonus", points: "+20" },
];
