import { createClient } from "@supabase/supabase-js";

// Replace these with actual keys tomorrow!
const supabaseUrl = process.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_SERVICE_ROLE_KEY";

if (supabaseUrl === "YOUR_SUPABASE_URL") {
  console.log("⚠️  Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run the seeder.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The official CPU BSCS Curriculum (Core CS + GE/CE)
const bscsCurriculum = [
  // First Year
  { code: "CCS 1100", title: "Introduction to Computing", year_level: "Freshman" },
  { code: "CCS 1101", title: "Computer Programming 1", year_level: "Freshman" },
  { code: "CCS 1200", title: "Computer Programming 2", year_level: "Freshman" },
  { code: "CCS 1201", title: "Data Structures and Algorithms", year_level: "Freshman" },
  
  // Second Year
  { code: "CCS 2100", title: "Object Oriented Programming", year_level: "Sophomore" },
  { code: "CCS 2101", title: "Information Management", year_level: "Sophomore" },
  { code: "CCS 2200", title: "Design and Analysis of Algorithms", year_level: "Sophomore" },
  { code: "CCS 2201", title: "Database Systems", year_level: "Sophomore" },
  { code: "CCS 2202", title: "Computer Architecture and Organization", year_level: "Sophomore" },
  
  // Third Year
  { code: "CCS 3100", title: "Software Engineering 1", year_level: "Junior" },
  { code: "CCS 3101", title: "Operating Systems", year_level: "Junior" },
  { code: "CCS 3102", title: "Automata Theory and Formal Languages", year_level: "Junior" },
  { code: "CCS 3200", title: "Software Engineering 2", year_level: "Junior" },
  { code: "CCS 3201", title: "Information Assurance and Security", year_level: "Junior" },
  { code: "CCS 3202", title: "Data Communications and Networking", year_level: "Junior" },
  { code: "CCS 3203", title: "Human Computer Interaction", year_level: "Junior" },
  
  // Fourth Year
  { code: "CCS 4100", title: "CS Thesis Writing 1", year_level: "Senior" },
  { code: "CCS 4101", title: "Programming Languages / Compilers", year_level: "Senior" },
  { code: "CCS 4200", title: "CS Thesis Writing 2", year_level: "Senior" },
  { code: "CCS 4201", title: "Social and Professional Issues", year_level: "Senior" },

  // Math & GE Electives
  { code: "MATH 1101", title: "Discrete Mathematics", year_level: "Freshman" },
  { code: "MATH 2101", title: "Calculus", year_level: "Sophomore" },
  { code: "GE 1101", title: "Understanding the Self", year_level: "Freshman" },
  { code: "GE 1102", title: "Readings in Philippine History", year_level: "Freshman" },
  { code: "GE 1103", title: "The Contemporary World", year_level: "Freshman" }
];

async function seedSubjects() {
  console.log(`Starting to seed ${bscsCurriculum.length} BSCS subjects into Supabase...`);
  
  const { data, error } = await supabase.from("subjects").insert(bscsCurriculum);

  if (error) {
    console.error("❌ Failed to insert subjects:", error.message);
  } else {
    console.log("✅ Successfully populated the subjects table with the real BSCS curriculum!");
  }
}

seedSubjects();
