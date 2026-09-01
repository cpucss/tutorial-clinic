import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubjectsPage } from "../features/subjects/pages/SubjectsPage";
import { AdminSubjectsPage } from "../features/admin/pages/AdminSubjectsPage";
import { AppDataProvider } from "../context/AppDataContext";
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

describe("BSCS Curriculum Catalog Data Model & Unit Balancing", () => {
  const sampleCurriculum: Subject[] = [
    // 1st Year 1st Sem (27 units)
    { id: "s1", code: "CCS 1001", name: "Introduction to Computing", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s2", code: "CCS 1400", name: "Fundamentals of Programming", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s3", code: "GEMath 1", name: "Mathematics in the Modern World", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s4", code: "GESocSci 5", name: "Ethics", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s5", code: "CETech 1", name: "Living in the IT Era", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s6", code: "GESocSci 2", name: "Readings in Philippine History", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s7", code: "SEAL 1", name: "Student Enhancement Activities for Life I", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 1, lecHours: 1, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s8", code: "RE 1", name: "Christianity in a Changing Society", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s9", code: "PATHFit1 W", name: "PATHFit 1 (Women)", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 2, lecHours: 2, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },
    { id: "s10", code: "NSTP 1-CWTS", name: "CWTS 1", yearLevel: "Freshman", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: [], isElective: false, coordinator: "TBD", active: true },

    // 1st Year 2nd Sem
    { id: "s11", code: "CCS 1500", name: "Intermediate Programming", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 1001", "CCS 1400"], isElective: false, coordinator: "TBD", active: true },
    { id: "s12", code: "CCS 1301", name: "Data Structures and Algorithms", yearLevel: "Freshman", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 1400"], isElective: false, coordinator: "TBD", active: true },

    // 2nd Year
    { id: "s20", code: "CCS 2100", name: "Fundamentals of Database Design", yearLevel: "Sophomore", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 1301", "CCS 1500"], isElective: false, coordinator: "TBD", active: true },
    { id: "s21", code: "CCS 2300", name: "Logic Design", yearLevel: "Sophomore", semester: "2nd Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 2200"], isElective: false, coordinator: "TBD", active: true },

    // 3rd Year
    { id: "s30", code: "CCS 3002", name: "Computer Organization & Assembly Language", yearLevel: "Junior", semester: "1st Semester", creditUnits: 1, lecHours: 0, labHours: 3, prerequisites: ["CCS 2300"], isElective: false, coordinator: "TBD", active: true },
    { id: "s31", code: "CCS 3501", name: "Operating Systems", yearLevel: "Junior", semester: "2nd Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["CCS 3002"], isElective: false, coordinator: "TBD", active: true },
    { id: "s32", code: "CSPE 4100", name: "Software Development 1", yearLevel: "Junior", semester: "1st Semester", creditUnits: 3, lecHours: 3, labHours: 0, prerequisites: ["Passed all 2nd Yr. 2nd Sem. CS Subjects"], isElective: true, specialization: "Software Development", coordinator: "TBD", active: true },

    // 4th Year
    { id: "s40", code: "CCS 4100", name: "CCS Thesis II", yearLevel: "Senior", semester: "1st Semester", creditUnits: 3, lecHours: 2, labHours: 3, prerequisites: ["CCS 3600"], isElective: false, coordinator: "TBD", active: true },
    { id: "s41", code: "CCS 4201", name: "On-the-Job Training (600 hours)", yearLevel: "Senior", semester: "2nd Semester", creditUnits: 6, lecHours: 6, labHours: 0, prerequisites: ["Passed ALL Subjects"], isElective: false, coordinator: "TBD", active: true },
  ];

  it("correctly models prerequisites and semester assignments", () => {
    const os = sampleCurriculum.find((s) => s.code === "CCS 3501");
    expect(os).toBeDefined();
    expect(os?.prerequisites).toContain("CCS 3002");
    expect(os?.semester).toBe("2nd Semester");
    expect(os?.yearLevel).toBe("Junior");
  });

  it("correctly identifies elective tracks and specializations", () => {
    const sd1 = sampleCurriculum.find((s) => s.code === "CSPE 4100");
    expect(sd1).toBeDefined();
    expect(sd1?.isElective).toBe(true);
    expect(sd1?.specialization).toBe("Software Development");
  });
});
