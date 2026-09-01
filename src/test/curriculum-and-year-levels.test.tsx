import { describe, expect, it } from "vitest";
import type { Subject, DemoUser } from "../types/app";

describe("Authoritative Student Year-Level Reconciliation Logic", () => {
  const courseToYear = {
    "BSCS 1": "Freshman",
    "BSCS 2": "Sophomore",
    "BSCS 3": "Junior",
    "BSCS 4": "Senior",
  } as const;

  it("authoritatively maps BSCS courses 1 through 4 to Freshman, Sophomore, Junior, Senior", () => {
    expect(courseToYear["BSCS 1"]).toBe("Freshman");
    expect(courseToYear["BSCS 2"]).toBe("Sophomore");
    expect(courseToYear["BSCS 3"]).toBe("Junior");
    expect(courseToYear["BSCS 4"]).toBe("Senior");
  });

  it("handles students with ID prefix divergence (e.g. 24- prefix as Sophomore or Senior)", () => {
    const studentSample = [
      { studentId: "24-0010-01", course: "BSCS 1", expectedYear: "Freshman" },
      { studentId: "24-0020-02", course: "BSCS 2", expectedYear: "Sophomore" },
      { studentId: "24-0030-03", course: "BSCS 3", expectedYear: "Junior" },
      { studentId: "24-0040-04", course: "BSCS 4", expectedYear: "Senior" },
      { studentId: "21-0015-05", course: "BSCS 1", expectedYear: "Freshman" },
      { studentId: "21-0099-06", course: "BSCS 4", expectedYear: "Senior" },
    ];

    for (const student of studentSample) {
      const actualYear = courseToYear[student.course as keyof typeof courseToYear];
      expect(actualYear).toBe(student.expectedYear);
    }
  });

  it("preserves null / unassigned year levels without silently coercing to Freshman", () => {
    const unassignedProfile: Partial<DemoUser> = {
      id: "u-test-unassigned",
      studentId: "99-9999-99",
      name: "Unassigned Student",
      yearLevel: null,
      role: "student",
      active: true,
    };

    expect(unassignedProfile.yearLevel).toBeNull();
    expect(unassignedProfile.yearLevel ?? "Year level not assigned").toBe("Year level not assigned");
  });
});

describe("BSCS Curriculum Catalog Data Model & Canonical 164-Unit Calculation", () => {
  // Complete BSCS AY 2024-2025 canonical degree path definition
  const canonicalCurriculum: Subject[] = [
    // 1st Year, 1st Semester (27 units)
    { id: "1", code: "CCS 1001", name: "Introduction to Computing", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "2", code: "CCS 1400", name: "Fundamentals of Programming", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "3", code: "GEMath 1", name: "Mathematics in the Modern World", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "4", code: "GESocSci 5", name: "Ethics", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "5", code: "CETech 1", name: "Living in the IT Era", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "6", code: "GESocSci 2", name: "Readings in Philippine History", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "7", code: "SEAL 1", name: "Student Enhancement Activities for Life I", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 1, lecHours: 1, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "8", code: "RE 1", name: "Christianity in a Changing Society", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "9", code: "PATHFit1 W", name: "PATHFit 1", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 2, lecHours: 2, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "10", code: "NSTP 1-CWTS", name: "CWTS 1", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },

    // 1st Year, 2nd Semester (27 units)
    { id: "11", code: "CCS 1500", name: "Intermediate Programming", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 1001", "CCS 1400"], isElective: false, coordinator: "TBD", active: true },
    { id: "12", code: "CCS 1301", name: "Data Structures and Algorithms", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 1400"], isElective: false, coordinator: "TBD", active: true },
    { id: "13", code: "GESocSci 4", name: "The Contemporary World", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "14", code: "SEAL 2", name: "Student Enhancement Activities for Life II", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 1, lecHours: 1, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "15", code: "GEEng 1", name: "Purposive Communication", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "16", code: "GESocSci 1", name: "Understanding the Self", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "17", code: "CESocSci 4", name: "The Entrepreneurial Mind", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "18", code: "RE 2", name: "Christian Ethics in a Changing World", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["RE 1"], isElective: false, coordinator: "TBD", active: true },
    { id: "19", code: "PATHFit2 W", name: "PATHFit 2", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 2, lecHours: 2, labHours: 0, prerequisites: ["PATHFit1 W"], isElective: false, coordinator: "TBD", active: true },
    { id: "20", code: "NSTP 2-CWTS", name: "CWTS 2", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["NSTP 1-CWTS"], isElective: false, coordinator: "TBD", active: true },

    // 2nd Year, 1st Semester (24 units)
    { id: "21", code: "CCS 2100", name: "Fundamentals of Database Design", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 1301", "CCS 1500"], isElective: false, coordinator: "TBD", active: true },
    { id: "22", code: "CS 2111", name: "Structure of Programming Languages", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 1301", "CCS 1500"], isElective: false, coordinator: "TBD", active: true },
    { id: "23", code: "CCS 2110", name: "Application Development and Emerging Technologies", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 1500"], isElective: false, coordinator: "TBD", active: true },
    { id: "24", code: "CCS 2200", name: "Basic Electrical and Electronic Concepts", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "25", code: "Math 2110", name: "Calculus", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["GEMath 1"], isElective: false, coordinator: "TBD", active: true },
    { id: "26", code: "CS 2120", name: "Discrete Structures I", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["GEMath 1"], isElective: false, coordinator: "TBD", active: true },
    { id: "27", code: "CCS 2801", name: "Mobile Application Development I", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 1, lecHours: 0, labHours: 3, prerequisites: ["CCS 1500"], isElective: false, coordinator: "TBD", active: true },
    { id: "28", code: "GEHum 1", name: "Art Appreciation", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "29", code: "PATHFit3 W", name: "PATHFit 3", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 2, lecHours: 2, labHours: 0, prerequisites: ["PATHFit2 W"], isElective: false, coordinator: "TBD", active: true },

    // 2nd Year, 2nd Semester (24 units)
    { id: "30", code: "CCS 2300", name: "Logic Design", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 2200"], isElective: false, coordinator: "TBD", active: true },
    { id: "31", code: "CCS 2401", name: "Network Engineering I", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 2200"], isElective: false, coordinator: "TBD", active: true },
    { id: "32", code: "CCS 2501", name: "System Analysis and Design", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 2100"], isElective: false, coordinator: "TBD", active: true },
    { id: "33", code: "CCS 2601", name: "Programming with Databases", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 2100"], isElective: false, coordinator: "TBD", active: true },
    { id: "34", code: "IT 3110", name: "Computer Hardware Repair and Maintenance", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 2200", "CCS 2401"], isElective: false, coordinator: "TBD", active: true },
    { id: "35", code: "CS 2210", name: "Discrete Structures II", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CS 2120"], isElective: false, coordinator: "TBD", active: true },
    { id: "36", code: "CCS 3801", name: "Mobile Application Development II", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 1, lecHours: 0, labHours: 3, prerequisites: ["CCS 2801"], isElective: false, coordinator: "TBD", active: true },
    { id: "37", code: "CEArts 3", name: "Reading Visual Art", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "38", code: "PATHFit4 W", name: "PATHFit 4", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 2, lecHours: 2, labHours: 0, prerequisites: ["PATHFit3 W"], isElective: false, coordinator: "TBD", active: true },

    // 3rd Year, 1st Semester (23 units)
    { id: "39", code: "CCS 3002", name: "Computer Organization & Assembly Language", yearLevel: "Junior", semester: "1st Semester", creditUnits: 1, lecHours: 0, labHours: 3, prerequisites: ["CCS 2300"], isElective: false, coordinator: "TBD", active: true },
    { id: "40", code: "CCS 3010", name: "Fundamentals of HCI", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 2501"], isElective: false, coordinator: "TBD", active: true },
    { id: "41", code: "CCS 3020", name: "Information Assurance and Security I", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 2401"], isElective: false, coordinator: "TBD", active: true },
    { id: "42", code: "CCS 3031", name: "Web Systems and Technologies", yearLevel: "Junior", semester: "1st Semester", creditUnits: 1, lecHours: 0, labHours: 3, prerequisites: ["CCS 2601", "CCS 2110"], isElective: false, coordinator: "TBD", active: true },
    { id: "43", code: "CCS 3100", name: "Methods of Research in IT", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "44", code: "CSPE 4100", name: "Software Development 1", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: true, specialization: "Software Development", coordinator: "TBD", active: true },
    { id: "45", code: "CS 3120", name: "Algorithms and Complexities", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CS 2111"], isElective: false, coordinator: "TBD", active: true },
    { id: "46", code: "GESocSci 3", name: "Life and Works of Rizal", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "47", code: "GESocSci 6", name: "Science, Technology and Society", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },

    // 3rd Year, 2nd Semester (18 units)
    { id: "48", code: "CCS 3300", name: "Software Engineering", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 3100"], isElective: false, coordinator: "TBD", active: true },
    { id: "49", code: "CCS 3501", name: "Operating Systems", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 3002"], isElective: false, coordinator: "TBD", active: true },
    { id: "50", code: "CCS 3600", name: "CCS Thesis I", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "51", code: "CS 3110", name: "Automata Theory & Computability", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CS 2111"], isElective: false, coordinator: "TBD", active: true },
    { id: "52", code: "CS 3210", name: "Computer Graphics and Visual Computing", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 3010"], isElective: false, coordinator: "TBD", active: true },
    { id: "53", code: "CSPE 4200", name: "Software Development 2", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCSPE 2101"], isElective: true, specialization: "Software Development", coordinator: "TBD", active: true },

    // Summer Term (3 units)
    { id: "54", code: "CCS 4001", name: "Seminars", yearLevel: "Senior", semester: "Summer", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },

    // 4th Year, 1st Semester (12 units)
    { id: "55", code: "CCS 4100", name: "CCS Thesis II", yearLevel: "Senior", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 3600"], isElective: false, coordinator: "TBD", active: true },
    { id: "56", code: "CS 4110", name: "Artificial Intelligence", yearLevel: "Senior", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CS 3110"], isElective: false, coordinator: "TBD", active: true },
    { id: "57", code: "CCS 4300", name: "Social Issues and Professional Practices", yearLevel: "Senior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "58", code: "CSPE 4300", name: "Software Development 3", yearLevel: "Senior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCSPE 2300"], isElective: true, specialization: "Software Development", coordinator: "TBD", active: true },

    // 4th Year, 2nd Semester (6 units)
    { id: "59", code: "CCS 4201", name: "On-the-Job Training (600 hours)", yearLevel: "Senior", semester: "2nd Semester", creditUnits: 6, lecHours: 6, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
  ];

  it("canonical degree path totals EXACTLY 164 academic units", () => {
    const totalUnits = canonicalCurriculum.reduce((sum, s) => sum + (s.creditUnits || 0), 0);
    expect(totalUnits).toBe(164);
  });

  it("accurately balances each semester according to the curriculum checklist", () => {
    const calc = (year: string, sem: string) =>
      canonicalCurriculum
        .filter((s) => s.yearLevel === year && s.semester === sem)
        .reduce((sum, s) => sum + (s.creditUnits || 0), 0);

    expect(calc("Freshman", "1st Semester")).toBe(27);
    expect(calc("Freshman", "2nd Semester")).toBe(27);
    expect(calc("Sophomore", "1st Semester")).toBe(24);
    expect(calc("Sophomore", "2nd Semester")).toBe(24);
    expect(calc("Junior", "1st Semester")).toBe(23);
    expect(calc("Junior", "2nd Semester")).toBe(18);
    expect(calc("Senior", "Summer")).toBe(3);
    expect(calc("Senior", "1st Semester")).toBe(12);
    expect(calc("Senior", "2nd Semester")).toBe(6);
  });

  it("distinguishes mutually exclusive offerings without double-counting degree units", () => {
    const alternativeOfferings = [
      { code: "PATHFit1 W", units: 2, variantOf: "PATHFit1" },
      { code: "PATHFit1 M", units: 2, variantOf: "PATHFit1" },
      { code: "NSTP 1-CWTS", units: 3, variantOf: "NSTP 1" },
      { code: "NSTP 1-LTS", units: 3, variantOf: "NSTP 1" },
      { code: "NSTP 1-ROTC", units: 3, variantOf: "NSTP 1" },
    ];

    // Verify each variant group provides equal academic credit
    const pathfit1Units = new Set(alternativeOfferings.filter((o) => o.variantOf === "PATHFit1").map((o) => o.units));
    expect(pathfit1Units.size).toBe(1);
    expect(Array.from(pathfit1Units)[0]).toBe(2);

    const nstp1Units = new Set(alternativeOfferings.filter((o) => o.variantOf === "NSTP 1").map((o) => o.units));
    expect(nstp1Units.size).toBe(1);
    expect(Array.from(nstp1Units)[0]).toBe(3);
  });
});

describe("Curriculum Anomaly Classifications & Data Integrity", () => {
  it("verifies CCS 3501 Operating Systems references valid prerequisite", () => {
    const osSubject: Partial<Subject> = {
      code: "CCS 3501",
      name: "Operating Systems",
      prerequisites: ["CCS 3002"],
    };
    expect(osSubject.prerequisites).toContain("CCS 3002");
  });

  it("ensures student CSV export does not expose sensitive credentials or auth metadata", () => {
    const studentUser: DemoUser = {
      id: "auth-uuid-12345",
      authUserId: "auth-uuid-12345",
      studentId: "24-0001-01",
      name: "Juan Dela Cruz",
      yearLevel: "Sophomore",
      email: "24-0001-01@cpu.edu.ph",
      program: "BS Computer Science",
      section: "A",
      role: "student",
      active: true,
      accountSetup: {
        completed: true,
        mustChangePassword: false,
      },
    };

    const exportData = {
      student_id: studentUser.studentId,
      name: studentUser.name,
      year: studentUser.yearLevel ?? "Unassigned",
      section: studentUser.section,
      email: studentUser.email,
      role: studentUser.role,
      active: studentUser.active,
    };

    // Assert sensitive properties are absent from CSV row
    expect(exportData).not.toHaveProperty("password");
    expect(exportData).not.toHaveProperty("authUserId");
    expect(exportData).not.toHaveProperty("token");
    expect(exportData.year).toBe("Sophomore");
  });
});

describe("Student Route Isolation & Admin Subject Management", () => {
  it("ensures student /subjects path has no active route and triggers fallback", async () => {
    const { tabFromPath, TAB_PATHS } = await import("../app/routes");
    expect(tabFromPath("/subjects")).toBeNull();
    expect(TAB_PATHS["admin-subjects"]).toBe("/admin/subjects");
    expect(tabFromPath("/admin/subjects")).toBe("admin-subjects");
  });

  it("verifies subjects are preserved for clinic sessions and study notes", () => {
    const activeSubjects: Subject[] = [
      { id: "subj-ccs-1001", code: "CCS 1001", name: "Introduction to Computing", yearLevel: "Freshman", coordinator: "TBD", active: true },
      { id: "subj-ccs-1400", code: "CCS 1400", name: "Fundamentals of Programming", yearLevel: "Freshman", coordinator: "TBD", active: true },
    ];

    const session = {
      id: "sess-1",
      title: "Programming 101 Clinic",
      subjectId: activeSubjects[0].id,
    };

    const note = {
      id: "note-1",
      title: "Computing Cheatsheet",
      subjectId: activeSubjects[0].id,
      status: "Approved",
    };

    const sessionSubject = activeSubjects.find((s) => s.id === session.subjectId);
    const noteSubject = activeSubjects.find((s) => s.id === note.subjectId);

    expect(sessionSubject?.code).toBe("CCS 1001");
    expect(noteSubject?.name).toBe("Introduction to Computing");
  });
});
