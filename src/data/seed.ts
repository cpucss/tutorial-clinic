import type { DemoState, Preferences } from "../types/app";

export const DEMO_STATE_VERSION = 1;
export const DEMO_STORAGE_KEY = "tutorial-clinic:demo:v1";

export const defaultPreferences: Preferences = {
  reducedMotion: false,
  highContrast: false,
  compactNavigation: false,
  sessionReminders: true,
  noteUpdates: true,
  leaderboardUpdates: false,
};

function atDay(offset: number, hour = 14, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function createSeedState(): DemoState {
  const now = new Date().toISOString();
  const students = [
    {
      id: "stu-042", name: "Aria Mendoza", studentId: "2024-00421", yearLevel: "Junior" as const,
      email: "aria.m@school.edu", program: "BS Computer Science", section: "CS-3A", role: "student" as const,
      active: true, accountSetup: { completed: false },
    },
    {
      id: "stu-117", name: "Devon Reyes", studentId: "2023-00117", yearLevel: "Senior" as const,
      email: "devon.r@school.edu", program: "BS Computer Science", section: "CS-4B", role: "contributor" as const,
      active: true, accountSetup: { completed: true, backupEmail: "devon.backup@example.com", demoPassword: "DemoPass1", completedAt: atDay(-35) },
    },
    {
      id: "stu-208", name: "Sam Okafor", studentId: "2025-00208", yearLevel: "Sophomore" as const,
      email: "sam.o@school.edu", program: "BS Computer Science", section: "CS-2A", role: "student" as const,
      active: true, accountSetup: { completed: true, backupEmail: "sam.backup@example.com", demoPassword: "DemoPass1", completedAt: atDay(-18) },
    },
    {
      id: "stu-311", name: "Liam Park", studentId: "2022-00311", yearLevel: "Senior" as const,
      email: "liam.p@school.edu", program: "BS Computer Science", section: "CS-4A", role: "contributor" as const,
      active: true, accountSetup: { completed: true, backupEmail: "liam.backup@example.com", demoPassword: "DemoPass1", completedAt: atDay(-70) },
    },
    {
      id: "adm-001", name: "Nadia Cruz", studentId: "ADMIN-001", yearLevel: "Senior" as const,
      email: "admin@tutorialclinic.edu", program: "Computer Science Society", section: "Administration", role: "admin" as const,
      active: true, accountSetup: { completed: true, completedAt: atDay(-100) },
    },
  ];

  const subjects = [
    // ── First Year – Semester 1 ───────────────────────────────────────────
    { id: "sub-f1-01", code: "CCS 1001", name: "Introduction to Computing",                       yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-101",   code: "CCS 1400", name: "Fundamentals of Programming",                     yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-03", code: "GEMath 1", name: "Mathematics in the Modern World",                 yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-04", code: "GESocSci 5", name: "Ethics",                                        yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-05", code: "CETech 1",   name: "Living in the IT Era",                          yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-06", code: "GESocSci 2", name: "Readings in Philippine History",                yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-07", code: "SEAL 1",     name: "Student Enhancement Activities for Life I",     yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-08", code: "RE 1",       name: "Christianity in a Changing Society",            yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-09", code: "PATHFit1 W", name: "PATHFit – Movement Competency Training (W)",   yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-10", code: "PATHFit1 M", name: "PATHFit – Movement Competency Training (M)",   yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-11", code: "NSTP 1 - CWTS", name: "Civic Welfare Training Service",            yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-12", code: "NSTP 1 - LTS",  name: "Literacy Training Service",                 yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f1-13", code: "NSTP 1 - ROTC", name: "Reserve Officers' Training Corps",          yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    // ── First Year – Semester 2 ───────────────────────────────────────────
    { id: "sub-f2-01", code: "CCS 1500",    name: "Intermediate Programming",                     yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-150",   code: "CCS 1301",    name: "Data Structures and Algorithms",               yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-03", code: "GESocSci 4",  name: "The Contemporary World",                      yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-04", code: "SEAL 2",      name: "Student Enhancement Activities for Life II",  yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-05", code: "GEEng 1",     name: "Purposive Communication",                     yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-06", code: "GESocSci 1",  name: "Understanding the Self",                      yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-07", code: "CESocSci 4",  name: "The Entrepreneurial Mind",                    yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-08", code: "RE 2",        name: "Christian Ethics in a Changing World",        yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-09", code: "PATHFit2 W",  name: "PATHFit – Exercise Based Fitness Activities (W)", yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-10", code: "PATHFit2 M",  name: "PATHFit – Exercise Based Fitness Activities (M)", yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-11", code: "NSTP 2 - CWTS", name: "Civic Welfare Training Service",           yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-12", code: "NSTP 2 - LTS",  name: "Literacy Training Service",                yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    { id: "sub-f2-13", code: "NSTP 2 - ROTC", name: "Reserve Officers' Training Corps",         yearLevel: "Freshman" as const, coordinator: "TBD", active: true },
    // ── Second Year – Semester 1 ──────────────────────────────────────────
    { id: "sub-220",   code: "CCS 2100",    name: "Fundamentals of Database Design",             yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-02", code: "CS 2111",     name: "Structure of Programming Languages",          yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-03", code: "CCS 2110",    name: "Application Development and Emerging Technologies", yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-04", code: "CCS 2200",    name: "Basic Electrical and Electronic Concepts",   yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-05", code: "Math 2110",   name: "Calculus",                                   yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-06", code: "CS 2120",     name: "Discrete Structures I",                      yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-07", code: "CCS 2801",    name: "Mobile Application Development I",           yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-08", code: "GEHum 1",     name: "Art Appreciation",                           yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-09", code: "PATHFit3 W",  name: "PATHFit – Dance and Swimming (W)",           yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s1-10", code: "PATHFit3 M",  name: "PATHFit – Dance and Swimming (M)",           yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    // ── Second Year – Semester 2 ──────────────────────────────────────────
    { id: "sub-s2-01", code: "CCS 2300",    name: "Logic Design",                               yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-02", code: "CCS 2401",    name: "Network Engineering I: Introduction to Networks", yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-03", code: "CCS 2501",    name: "System Analysis and Design",                 yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-04", code: "CCS 2601",    name: "Programming with Databases",                 yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-05", code: "IT 3110",     name: "Computer Hardware Repair and Maintenance",   yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-06", code: "CS 2210",     name: "Discrete Structures II",                     yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-07", code: "CCS 3801",    name: "Mobile Application Development II",          yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-08", code: "CEArts 3",    name: "Reading Visual Art",                         yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-09", code: "PATHFit4 W",  name: "PATHFit – Volleyball and Basketball (W)",   yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    { id: "sub-s2-10", code: "PATHFit4 M",  name: "PATHFit – Volleyball and Basketball (M)",   yearLevel: "Sophomore" as const, coordinator: "TBD", active: true },
    // ── Third Year – Semester 1 ───────────────────────────────────────────
    { id: "sub-t1-01", code: "CCS 3002",    name: "Computer Organization & Assembly Language",  yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-02", code: "CCS 3010",    name: "Fundamentals of Human Computer Interaction", yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-03", code: "CCS 3020",    name: "Information Assurance and Security I",       yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-04", code: "CCS 3031",    name: "Web Systems and Technologies",               yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-05", code: "CCS 3100",    name: "Methods of Research in IT",                  yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-06", code: "CSPE 3110",   name: "Desktop Application Development (ASD 1)",   yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-07", code: "CSPE 3120",   name: "Introduction to Data Science and Statistics (DS 1)", yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-08", code: "CSPE 3130",   name: "Ethical Hacking (CYS 1)",                   yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-09", code: "CS 3120",     name: "Algorithms and Complexities",                yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-10", code: "GESocSci 3",  name: "Life and Works of Rizal",                   yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t1-11", code: "GESocSci 6",  name: "Science, Technology and Society",           yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    // ── Third Year – Semester 2 ───────────────────────────────────────────
    { id: "sub-t2-01", code: "CCS 3300",    name: "Software Engineering",                       yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-301",   code: "CCS 3501",    name: "Operating Systems",                          yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t2-03", code: "CCS 3600",    name: "CCS Thesis I",                               yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t2-04", code: "CS 3110",     name: "Automata Theory & Computability",            yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t2-05", code: "CS 3210",     name: "Computer Graphics and Visual Computing",    yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t2-06", code: "CSPE 3211",   name: "Rich Internet Application Development (ASD 2)", yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t2-07", code: "CSPE 3221",   name: "Data and Network Security (DS 2)",          yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    { id: "sub-t2-08", code: "CSPE 3231",   name: "Ethics and Cyber Warfare (CYS 2)",          yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    // ── Third Year – Summer ───────────────────────────────────────────────
    { id: "sub-ts-01", code: "CCS 4001",    name: "Seminars",                                   yearLevel: "Junior" as const, coordinator: "TBD", active: true },
    // ── Fourth Year – Semester 1 ──────────────────────────────────────────
    { id: "sub-fo-01", code: "CCS 4100",    name: "CCS Thesis II",                              yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-401",   code: "CS 4110",     name: "Artificial Intelligence",                    yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-fo-03", code: "CCS 4300",    name: "Social Issues and Professional Practices",  yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-fo-04", code: "CSPE 4112",   name: "Software Development Security (ASD 3)",     yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-fo-05", code: "CSPE 4122",   name: "Data Mining (DS 3)",                        yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-fo-06", code: "CSPE 4132",   name: "Digital Forensics and Cybercrime (CYS 3)", yearLevel: "Senior" as const, coordinator: "TBD", active: true },
  ];

  const events = [
    {
      id: "evt-1", title: "Conquering Recursion", subjectId: "sub-101", description: "A guided problem-solving clinic focused on recursive thinking, stack frames, and reliable base cases.",
      topics: ["Recursion", "Stack frames", "Base cases"], date: atDay(1, 15), endDate: atDay(1, 16, 30), yearLevels: ["Freshman", "Sophomore"] as const,
      instructor: "Liam Park", instructorRole: "Senior student", venue: "Room CS-204", capacity: 30, status: "Upcoming" as const, attendanceCode: "TC-R101", createdAt: atDay(-20),
    },
    {
      id: "evt-2", title: "Introduction to Big-O", subjectId: "sub-150", description: "Build intuition for runtime growth and compare common algorithmic complexity classes.",
      topics: ["Complexity", "Asymptotics"], date: atDay(3, 10, 30), endDate: atDay(3, 12), yearLevels: ["Freshman", "Sophomore"] as const,
      instructor: "Prof. Tanaka", instructorRole: "Faculty adviser", venue: "Online - Zoom A", capacity: 40, status: "Upcoming" as const, attendanceCode: "TC-BIGO", createdAt: atDay(-16),
    },
    {
      id: "evt-3", title: "Operating Systems Office Hour", subjectId: "sub-301", description: "Review scheduling, concurrency, and synchronization through worked examples.",
      topics: ["Scheduling", "Concurrency"], date: atDay(-5, 16), endDate: atDay(-5, 17, 30), yearLevels: ["Junior", "Senior"] as const,
      instructor: "Nadia Cruz", instructorRole: "Senior student", venue: "Room CS-301", capacity: 20, status: "Completed" as const, attendanceCode: "TC-OS31", createdAt: atDay(-30),
    },
    {
      id: "evt-4", title: "Database Design Clinic", subjectId: "sub-220", description: "Turn requirements into clear ER diagrams and normalized relational schemas.",
      topics: ["ER models", "Normalization"], date: atDay(7, 14), endDate: atDay(7, 15, 30), yearLevels: ["Sophomore", "Junior"] as const,
      instructor: "Marco Lin", instructorRole: "Peer facilitator", venue: "Room CS-110", capacity: 25, status: "Upcoming" as const, attendanceCode: "TC-DB22", createdAt: atDay(-10),
    },
  ].map((event) => ({ ...event, yearLevels: [...event.yearLevels] }));

  const points = [
    { id: "pt-1", userId: "stu-042", points: 300, reason: "Starting point balance", createdAt: atDay(-45), relatedType: "Adjustment" as const },
    { id: "pt-2", userId: "stu-042", points: 40, reason: "Attendance approved: Operating Systems Office Hour", createdAt: atDay(-5, 17), relatedType: "Attendance" as const, relatedId: "att-1" },
    { id: "pt-3", userId: "stu-117", points: 870, reason: "Starting point balance", createdAt: atDay(-45), relatedType: "Adjustment" as const },
    { id: "pt-4", userId: "stu-208", points: 180, reason: "Starting point balance", createdAt: atDay(-45), relatedType: "Adjustment" as const },
    { id: "pt-5", userId: "stu-311", points: 930, reason: "Starting point balance", createdAt: atDay(-45), relatedType: "Adjustment" as const },
  ];

  return {
    version: DEMO_STATE_VERSION,
    currentUserId: null,
    users: students,
    subjects,
    events,
    rsvps: [
      { id: "rsvp-1", eventId: "evt-1", userId: "stu-042", createdAt: atDay(-2) },
      { id: "rsvp-2", eventId: "evt-2", userId: "stu-208", createdAt: atDay(-1) },
      { id: "rsvp-3", eventId: "evt-1", userId: "stu-117", createdAt: atDay(-3) },
    ],
    attendance: [
      { id: "att-1", eventId: "evt-3", userId: "stu-042", checkedInAt: atDay(-5, 15, 58), method: "Code", arrival: "On time", status: "Approved", reviewedAt: atDay(-5, 17), reviewedBy: "adm-001" },
    ],
    notes: [
      { id: "n1", title: "Recursion Patterns Cheat Sheet", subjectId: "sub-101", description: "Common base cases, stack-frame patterns, and worked examples.", tags: ["recursion", "review"], uploaderId: "stu-311", createdAt: atDay(-25), updatedAt: atDay(-25), status: "Approved", fileName: "recursion-patterns.pdf", fileType: "application/pdf", downloads: 132, moderatedAt: atDay(-24), moderatedBy: "adm-001" },
      { id: "n2", title: "Big-O Reference Card", subjectId: "sub-150", description: "A one-page asymptotic complexity guide.", tags: ["algorithms", "complexity"], uploaderId: "stu-117", createdAt: atDay(-18), updatedAt: atDay(-18), status: "Approved", fileName: "big-o-card.pdf", fileType: "application/pdf", downloads: 98, moderatedAt: atDay(-17), moderatedBy: "adm-001" },
      { id: "n3", title: "ER Diagram Practice Set", subjectId: "sub-220", description: "Ten ER modelling drills with annotated solutions.", tags: ["database", "practice"], uploaderId: "stu-042", createdAt: atDay(-3), updatedAt: atDay(-3), status: "Pending", fileName: "er-practice.pdf", fileType: "application/pdf", downloads: 0 },
      { id: "n4", title: "Compilers Lecture Summary", subjectId: "sub-401", description: "A concise summary that needs clearer sources before publication.", tags: ["summary"], uploaderId: "stu-117", createdAt: atDay(-9), updatedAt: atDay(-8), status: "Rejected", fileName: "lecture-summary.pptx", fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", downloads: 0, rejectionReason: "Please add source references and correct the subject selection before resubmitting.", moderatedAt: atDay(-8), moderatedBy: "adm-001" },
    ],
    favouriteNoteIds: { "stu-042": ["n1"], "stu-117": ["n2"], "stu-208": [] },
    scheduleEventIds: { "stu-042": ["evt-1"], "stu-117": ["evt-1"], "stu-208": ["evt-2"] },
    points,
    notifications: [
      { id: "notif-1", userId: "stu-042", title: "Session reminder", message: "Conquering Recursion starts tomorrow at 3:00 PM.", type: "Event", createdAt: atDay(0, 9), relatedTab: "events" },
      { id: "notif-2", userId: "stu-042", title: "Attendance approved", message: "Your Operating Systems Office Hour attendance earned 40 points.", type: "Attendance", createdAt: atDay(-5, 17), readAt: atDay(-4), relatedTab: "attendance-history" },
      { id: "notif-3", userId: "stu-042", title: "Notes awaiting review", message: "ER Diagram Practice Set is in the moderation queue.", type: "Notes", createdAt: atDay(-3), relatedTab: "my-notes" },
      { id: "notif-admin-1", userId: "adm-001", title: "Note ready for review", message: "A new student note is waiting in the moderation queue.", type: "Notes", createdAt: atDay(-3), relatedTab: "admin-notes" },
    ],
    announcements: [
      { id: "ann-1", title: "Finals review clinics are open", body: "RSVP early for the expanded finals review schedule. Capacity is limited for on-campus rooms.", publishedAt: atDay(-1, 8), pinned: true, audience: "All", readBy: [] },
      { id: "ann-2", title: "Bring your student ID", body: "Present your student ID when checking in to an on-campus Tutorial Clinic session.", publishedAt: atDay(-7, 9), pinned: false, audience: "All", readBy: ["stu-117"] },
    ],
    preferences: Object.fromEntries(students.map((user) => [user.id, { ...defaultPreferences }])),
  };
}
