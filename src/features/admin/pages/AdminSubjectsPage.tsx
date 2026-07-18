import { BookOpen, Plus, Search } from "lucide-react";

import { notes } from "../../../mock";
import type { YearLevel } from "../../../types/common";

type Subject = {
  code: string;
  name: string;
  yearLevel: YearLevel;
  coordinator: string;
};

const subjects: Subject[] = [
  { code: "CCS 1001", name: "Introduction to Computing", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "CCS 1400", name: "Fundamentals of Programming", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "GEMath 1", name: "Mathematics in the Modern World", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "GESocSci 5", name: "Ethics", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "CETech 1", name: "Living in the IT Era", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "GESocSci 2", name: "Readings in Philippine History", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "SEAL 1", name: "Student Enhancement Activities for Life I", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "RE 1", name: "Christianity in a Changing Society", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "PATHFit1", name: "Physical Activity Toward Health and Fitness", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "NSTP 1", name: "Civic Welfare Training Service / LTS / ROTC", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "CCS 1500", name: "Intermediate Programming", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "CCS 1301", name: "Data Structures and Algorithms", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "GESocSci 4", name: "The Contemporary World", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "SEAL 2", name: "Student Enhancement Activities for Life II", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "GEEng 1", name: "Purposive Communication", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "GESocSci 1", name: "Understanding the Self", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "CESocSci 4", name: "The Entrepreneurial Mind", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "RE 2", name: "Christian Ethics in a Changing World", yearLevel: "Freshman", coordinator: "TBD" },
  { code: "CCS 2300", name: "Logic Design", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2100", name: "Fundamentals of Database Design", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CS 2111", name: "Structure of Programming Languages", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2110", name: "Application Development and Emerging Technologies", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2200", name: "Basic Electrical and Electronic Concepts", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "Math 2110", name: "Calculus", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CS 2120", name: "Discrete Structures I", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2801", name: "Mobile Application Development I", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "GEHum 1", name: "Art Appreciation", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2401", name: "Network Engineering I: Introduction to Networks", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2501", name: "System Analysis and Design", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 2601", name: "Programming with Databases", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "IT 3110", name: "Computer Hardware Repair and Maintenance", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CS 2210", name: "Discrete Structures II", yearLevel: "Sophomore", coordinator: "TBD" },
  { code: "CCS 3801", name: "Mobile Application Development II", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CEArts 3", name: "Reading Visual Art", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3002", name: "Computer Organization & Assembly Language", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3010", name: "Fundamentals of Human Computer Interaction", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3020", name: "Information Assurance and Security I", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3031", name: "Web Systems and Technologies", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3100", name: "Methods of Research in IT", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CS 3120", name: "Algorithms and Complexities", yearLevel: "Junior", coordinator: "TBD" },
  { code: "GESocSci 3", name: "Life and Works of Rizal", yearLevel: "Junior", coordinator: "TBD" },
  { code: "GESocSci 6", name: "Science, Technology and Society", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3300", name: "Software Engineering", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3501", name: "Operating Systems", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 3600", name: "CCS Thesis I", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CS 3110", name: "Automata Theory & Computability", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CS 3210", name: "Computer Graphics and Visual Computing", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CCS 4001", name: "Seminars", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CCS 4100", name: "CCS Thesis II", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CS 4110", name: "Artificial Intelligence", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CCS 4300", name: "Social Issues and Professional Practices", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CCS 4201", name: "On-the-Job Training", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CSPE 4100", name: "Software Development 1", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CSPE 4200", name: "Software Development 2", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CSPE 4300", name: "Software Development 3", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CSPE 3101", name: "Data Science 1: Introduction to Data Science", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CSPE 3300", name: "Data Science 3: Data and Network Security", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CSPE 3400", name: "Data Science 4: Data Mining", yearLevel: "Junior", coordinator: "TBD" },
  { code: "CSPE 5100", name: "Cybersecurity 1: Ethical Hacking", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CSPE 5200", name: "Cybersecurity 2: Ethics and Cyber Warfare", yearLevel: "Senior", coordinator: "TBD" },
  { code: "CSPE 5300", name: "Cybersecurity 3: Digital Forensics and Cybercrime", yearLevel: "Senior", coordinator: "TBD" }
];

export function AdminSubjectsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Curriculum setup</div>
            <h1 className="mt-1" style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Subjects
            </h1>
            <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
              Maintain the subject list used by sessions and student note uploads.
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
            <Plus size={14} /> Add Subject
          </button>
        </div>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-[310px_1fr] gap-5 items-start">
          <aside className="rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2">
              <BookOpen size={18} color="#F5A623" />
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Coverage</h2>
            </div>
            <div className="mt-4 grid gap-2">
              {(["Freshman", "Sophomore", "Junior", "Senior"] as YearLevel[]).map((year) => {
                const count = subjects.filter((subject) => subject.yearLevel === year).length;
                return (
                  <div key={year} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "#FAF8F2" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1C1C1C" }}>{year}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F5A623" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="p-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1C1C1C" }}>Subject catalog</h2>
              <div className="relative w-full sm:w-[280px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
                <input placeholder="Search subjects" className="h-9 w-full rounded-full bg-white pl-8 pr-3 outline-none" style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead style={{ background: "#FAF8F2" }}>
                  <tr>
                    {["Code", "Subject", "Year level", "Notes", "Coordinator", ""].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left" style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => {
                    const noteCount = notes.filter((note) => note.subject.startsWith(subject.code)).length;
                    return (
                      <tr key={subject.code} style={{ borderTop: "1px solid #F0EFE9" }}>
                        <td className="px-5 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#F5A623" }}>{subject.code}</td>
                        <td className="px-5 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{subject.name}</td>
                        <td className="px-5 py-3" style={{ fontSize: 13, color: "#1C1C1C" }}>{subject.yearLevel}</td>
                        <td className="px-5 py-3" style={{ fontSize: 13, color: "#6F6F6F" }}>{noteCount}</td>
                        <td className="px-5 py-3" style={{ fontSize: 13, color: "#1C1C1C" }}>{subject.coordinator}</td>
                        <td className="px-5 py-3 text-right">
                          <button className="rounded-full px-3 py-1" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
