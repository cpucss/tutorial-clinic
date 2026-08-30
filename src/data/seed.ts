import type { DemoEvent, DemoNote, DemoNotification, DemoState, Preferences } from "../types/app";

export const DEMO_STATE_VERSION = 2;
export const DEMO_STORAGE_KEY = "tutorial-clinic:demo:v2";

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
      id: "adm-001", name: "Nadia Cruz", studentId: "ADMIN-001", yearLevel: "Senior" as const,
      email: "admin@tutorialclinic.edu", program: "Computer Science Society", section: "Administration", role: "admin" as const,
      active: true, accountSetup: { completed: true, completedAt: atDay(-100) },
    },
    {
      id: "stu-042", name: "Aria Cruz", studentId: "2024-00421", yearLevel: "Freshman" as const,
      email: "aria.cruz@cpu.edu.ph", program: "BS Computer Science", section: "A", role: "student" as const,
      active: true, accountSetup: { completed: false },
    },
    {
      id: "stu-117", name: "Beatriz Santos", studentId: "2023-00117", yearLevel: "Sophomore" as const,
      email: "beatriz.santos@cpu.edu.ph", program: "BS Information Technology", section: "B", role: "student" as const,
      active: true, accountSetup: { completed: true, completedAt: atDay(-80) },
    },
    {
      id: "stu-208", name: "Carlos Reyes", studentId: "2022-00208", yearLevel: "Junior" as const,
      email: "carlos.reyes@cpu.edu.ph", program: "BS Computer Science", section: "A", role: "student" as const,
      active: true, accountSetup: { completed: true, completedAt: atDay(-70) },
    },
    {
      id: "stu-315", name: "Diana Lopez", studentId: "2021-00315", yearLevel: "Senior" as const,
      email: "diana.lopez@cpu.edu.ph", program: "BS Information Technology", section: "A", role: "student" as const,
      active: true, accountSetup: { completed: true, completedAt: atDay(-60) },
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
    // ── Fourth Year – Semester 2 ──────────────────────────────────────────
    { id: "sub-ft-02", code: "CSPE 4213",   name: "Capstone Project (ASD 4)",                  yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-ft-03", code: "CSPE 4223",   name: "Big Data Analytics (DS 4)",                 yearLevel: "Senior" as const, coordinator: "TBD", active: true },
    { id: "sub-ft-04", code: "CSPE 4233",   name: "Network Defense and Countermeasures (CYS 4)", yearLevel: "Senior" as const, coordinator: "TBD", active: true },
  ];

  const events: DemoEvent[] = [
    {
      id: "evt-1",
      title: "Fundamentals of Programming Review",
      subjectId: "sub-101",
      description: "Review core programming concepts including syntax, control structures, and methods.",
      topics: ["Loops", "Methods", "Arrays"],
      date: atDay(1, 14, 0),
      endDate: atDay(1, 16, 0),
      venue: "Computer Lab 1",
      capacity: 30,
      status: "Upcoming",
      attendanceCode: "PROG101",
      yearLevels: ["Freshman"],
      instructor: "Prof. Alan Turing",
      instructorRole: "Faculty",
      createdAt: now,
    },
    {
      id: "evt-3",
      title: "Data Structures Clinic",
      subjectId: "sub-150",
      description: "Hands-on clinic covering linked lists, trees, and hash maps.",
      topics: ["Trees", "Hash Tables", "Linked Lists"],
      date: atDay(2, 10, 0),
      endDate: atDay(2, 12, 0),
      venue: "Online",
      capacity: 25,
      status: "Upcoming",
      attendanceCode: "DATA150",
      yearLevels: ["Freshman", "Sophomore"],
      instructor: "Prof. Ada Lovelace",
      instructorRole: "Faculty",
      createdAt: now,
    },
  ];

  const notes: DemoNote[] = [
    {
      id: "n1",
      title: "Java Control Structures Summary",
      subjectId: "sub-101",
      description: "Summary of if-else and switch-case syntax in Java.",
      tags: ["Java", "Syntax"],
      uploaderId: "stu-117",
      status: "Approved",
      createdAt: atDay(-10),
      updatedAt: atDay(-10),
      downloads: 14,
    },
    {
      id: "n3",
      title: "Data Structures Complexity Cheat Sheet",
      subjectId: "sub-150",
      description: "Big-O runtime reference for common operations.",
      tags: ["Big-O", "Complexity"],
      uploaderId: "stu-042",
      status: "Pending",
      createdAt: atDay(-1),
      updatedAt: atDay(-1),
      downloads: 0,
    },
  ];

  const notifications: DemoNotification[] = [
    {
      id: "notif-1",
      userId: "stu-042",
      title: "Welcome to Tutorial Clinic",
      message: "Your student portal is ready.",
      type: "Account",
      createdAt: atDay(-5),
    },
  ];

  const points = [
    {
      id: "pt-seed-1",
      userId: "stu-042",
      points: 40,
      reason: "Attended tutorial clinic",
      createdAt: atDay(-3),
      relatedType: "Attendance" as const,
    },
  ];

  const attendance = [
    {
      id: "att-seed-1",
      eventId: "evt-3",
      userId: "stu-042",
      checkedInAt: atDay(-3),
      method: "QR" as const,
      arrival: "On time" as const,
      status: "Approved" as const,
    },
  ];

  return {
    version: DEMO_STATE_VERSION,
    currentUserId: null,
    users: students,
    subjects,
    events,
    rsvps: [],
    attendance,
    notes,
    favouriteNoteIds: {},
    scheduleEventIds: {},
    points,
    notifications,
    announcements: [],
    preferences: Object.fromEntries(students.map((user) => [user.id, { ...defaultPreferences }])),
  };
}
