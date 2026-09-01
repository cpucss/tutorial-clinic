-- Migration: 20260901133512_bscs_curriculum_and_student_year_levels.sql
-- Description: Ingest BSCS Curriculum Checklist (AY 2024-2025, 164 units) into public.subjects with versioning, semester grouping, and prerequisites.

-- 1. Enhance public.subjects with curriculum metadata
alter table public.subjects
  add column if not exists curriculum_version text not null default '2024-2025',
  add column if not exists semester text,
  add column if not exists lec_hours numeric not null default 0,
  add column if not exists lab_hours numeric not null default 0,
  add column if not exists credit_units numeric not null default 0,
  add column if not exists prerequisites text[] not null default '{}'::text[],
  add column if not exists is_elective boolean not null default false,
  add column if not exists specialization text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subjects_semester_check'
  ) then
    alter table public.subjects
      add constraint subjects_semester_check check (
        semester is null or semester in ('1st Semester', '2nd Semester', 'Summer')
      );
  end if;
end $$;

create index if not exists idx_subjects_curriculum_year_sem
  on public.subjects(curriculum_version, year_level, semester);

-- 2. Idempotent upsert of official BSCS Curriculum subjects
with new_subjects(code, name, year_level, semester, lec_hours, lab_hours, credit_units, prerequisites, is_elective, specialization) as (
  values
    -- First Year, First Semester
    ('CCS 1001', 'Introduction to Computing', 'Freshman', '1st Semester', 2, 3, 3, '{}'::text[], false, null),
    ('CCS 1400', 'Fundamentals of Programming', 'Freshman', '1st Semester', 2, 3, 3, '{}'::text[], false, null),
    ('GEMath 1', 'Mathematics in the Modern World', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('GESocSci 5', 'Ethics', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('CETech 1', 'Living in the IT Era', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('GESocSci 2', 'Readings in Philippine History', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('SEAL 1', 'Student Enhancement Activities for Life I', 'Freshman', '1st Semester', 1, 0, 1, '{}'::text[], false, null),
    ('RE 1', 'Christianity in a Changing Society', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('PATHFit1 W', 'Physical Activity Toward Health and Fitness (PATHFit)-Movement Competency Training (Women)', 'Freshman', '1st Semester', 2, 0, 2, '{}'::text[], false, null),
    ('PATHFit1 M', 'Physical Activity Toward Health and Fitness (PATHFit)-Movement Competency Training (Men)', 'Freshman', '1st Semester', 2, 0, 2, '{}'::text[], false, null),
    ('NSTP 1-CWTS', 'Civic Welfare Training Service 1', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('NSTP 1-LTS', 'Literacy Training Service 1', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('NSTP 1-ROTC', 'Reserve Officers'' Training Corps 1', 'Freshman', '1st Semester', 3, 0, 3, '{}'::text[], false, null),

    -- First Year, Second Semester
    ('CCS 1500', 'Intermediate Programming', 'Freshman', '2nd Semester', 2, 3, 3, array['CCS 1001', 'CCS 1400']::text[], false, null),
    ('CCS 1301', 'Data Structures and Algorithms', 'Freshman', '2nd Semester', 2, 3, 3, array['CCS 1400']::text[], false, null),
    ('GESocSci 4', 'The Contemporary World', 'Freshman', '2nd Semester', 3, 0, 3, '{}'::text[], false, null),
    ('SEAL 2', 'Student Enhancement Activities for Life II', 'Freshman', '2nd Semester', 1, 0, 1, '{}'::text[], false, null),
    ('GEEng 1', 'Purposive Communication', 'Freshman', '2nd Semester', 3, 0, 3, '{}'::text[], false, null),
    ('GESocSci 1', 'Understanding the Self', 'Freshman', '2nd Semester', 3, 0, 3, '{}'::text[], false, null),
    ('CESocSci 4', 'The Entrepreneurial Mind', 'Freshman', '2nd Semester', 3, 0, 3, '{}'::text[], false, null),
    ('RE 2', 'Christian Ethics in a Changing World', 'Freshman', '2nd Semester', 3, 0, 3, array['RE 1']::text[], false, null),
    ('PATHFit2 W', 'Physical Activity Toward Health and Fitness (PATHFit)-Exercise Based Fitness Activities (Women)', 'Freshman', '2nd Semester', 2, 0, 2, array['PATHFit1 W']::text[], false, null),
    ('PATHFit2 M', 'Physical Activity Toward Health and Fitness (PATHFit)-Exercise Based Fitness Activities (Men)', 'Freshman', '2nd Semester', 2, 0, 2, array['PATHFit1 M']::text[], false, null),
    ('NSTP 2-CWTS', 'Civic Welfare Training Service 2', 'Freshman', '2nd Semester', 3, 0, 3, array['NSTP 1-CWTS']::text[], false, null),
    ('NSTP 2-LTS', 'Literacy Training Service 2', 'Freshman', '2nd Semester', 3, 0, 3, array['NSTP 1-LTS']::text[], false, null),
    ('NSTP 2-ROTC', 'Reserve Officers'' Training Corps 2', 'Freshman', '2nd Semester', 3, 0, 3, array['NSTP 1-ROTC']::text[], false, null),

    -- Second Year, First Semester
    ('CCS 2100', 'Fundamentals of Database Design', 'Sophomore', '1st Semester', 2, 3, 3, array['CCS 1301', 'CCS 1500']::text[], false, null),
    ('CS 2111', 'Structure of Programming Languages', 'Sophomore', '1st Semester', 3, 0, 3, array['CCS 1301', 'CCS 1500']::text[], false, null),
    ('CCS 2110', 'Application Development and Emerging Technologies', 'Sophomore', '1st Semester', 3, 0, 3, array['CCS 1500']::text[], false, null),
    ('CCS 2200', 'Basic Electrical and Electronic Concepts', 'Sophomore', '1st Semester', 2, 3, 3, array['Passed all 1st Yr. CS Subjects']::text[], false, null),
    ('Math 2110', 'Calculus', 'Sophomore', '1st Semester', 3, 0, 3, array['GEMath 1']::text[], false, null),
    ('CS 2120', 'Discrete Structures I', 'Sophomore', '1st Semester', 3, 0, 3, array['GEMath 1']::text[], false, null),
    ('CCS 2801', 'Mobile Application Development I', 'Sophomore', '1st Semester', 0, 3, 1, array['CCS 1500']::text[], false, null),
    ('GEHum 1', 'Art Appreciation', 'Sophomore', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('PATHFit3 W', 'Physical Activity Toward Health and Fitness (PATHFit)-Dance and Swimming (Women)', 'Sophomore', '1st Semester', 2, 0, 2, array['PATHFit2 W']::text[], false, null),
    ('PATHFit3 M', 'Physical Activity Toward Health and Fitness (PATHFit)-Dance and Swimming (Men)', 'Sophomore', '1st Semester', 2, 0, 2, array['PATHFit2 M']::text[], false, null),

    -- Second Year, Second Semester
    ('CCS 2300', 'Logic Design', 'Sophomore', '2nd Semester', 2, 3, 3, array['CCS 2200']::text[], false, null),
    ('CCS 2401', 'Network Engineering I: Introduction to Networks', 'Sophomore', '2nd Semester', 2, 3, 3, array['CCS 2200']::text[], false, null),
    ('CCS 2501', 'System Analysis and Design', 'Sophomore', '2nd Semester', 3, 0, 3, array['CCS 2100']::text[], false, null),
    ('CCS 2601', 'Programming with Databases', 'Sophomore', '2nd Semester', 3, 0, 3, array['CCS 2100']::text[], false, null),
    ('IT 3110', 'Computer Hardware Repair and Maintenance', 'Sophomore', '2nd Semester', 2, 3, 3, array['CCS 2200', 'CCS 2401']::text[], false, null),
    ('CS 2210', 'Discrete Structures II', 'Sophomore', '2nd Semester', 3, 0, 3, array['CS 2120']::text[], false, null),
    ('CCS 3801', 'Mobile Application Development II', 'Sophomore', '2nd Semester', 0, 3, 1, array['CCS 2801']::text[], false, null),
    ('CEArts 3', 'Reading Visual Art', 'Sophomore', '2nd Semester', 3, 0, 3, '{}'::text[], false, null),
    ('PATHFit4 W', 'Physical Activity Toward Health and Fitness (PATHFit)-Volleyball and Basketball (Women)', 'Sophomore', '2nd Semester', 2, 0, 2, array['PATHFit3 W']::text[], false, null),
    ('PATHFit4 M', 'Physical Activity Toward Health and Fitness (PATHFit)-Volleyball and Basketball (Men)', 'Sophomore', '2nd Semester', 2, 0, 2, array['PATHFit3 M']::text[], false, null),

    -- Third Year, First Semester
    ('CCS 3002', 'Computer Organization & Assembly Language', 'Junior', '1st Semester', 0, 3, 1, array['CCS 2300']::text[], false, null),
    ('CCS 3010', 'Fundamentals of Human Computer Interaction', 'Junior', '1st Semester', 3, 0, 3, array['CCS 2501']::text[], false, null),
    ('CCS 3020', 'Information Assurance and Security I', 'Junior', '1st Semester', 3, 0, 3, array['CCS 2401']::text[], false, null),
    ('CCS 3031', 'Web Systems and Technologies', 'Junior', '1st Semester', 0, 3, 1, array['CCS 2601', 'CCS 2110']::text[], false, null),
    ('CCS 3100', 'Methods of Research in IT', 'Junior', '1st Semester', 3, 0, 3, array['Passed all 2nd Yr. 2nd Sem. CS Subjects']::text[], false, null),
    ('CSPE 1', 'Professional Elective 1', 'Junior', '1st Semester', 3, 0, 3, array['Passed all 2nd Yr. CS Subjects']::text[], true, null),
    ('CS 3120', 'Algorithms and Complexities', 'Junior', '1st Semester', 3, 0, 3, array['CS 2111']::text[], false, null),
    ('GESocSci 3', 'Life and Works of Rizal', 'Junior', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('GESocSci 6', 'Science, Technology and Society', 'Junior', '1st Semester', 3, 0, 3, '{}'::text[], false, null),

    -- Third Year, Second Semester
    ('CCS 3300', 'Software Engineering', 'Junior', '2nd Semester', 3, 0, 3, array['CCS 3100']::text[], false, null),
    ('CCS 3501', 'Operating Systems', 'Junior', '2nd Semester', 3, 0, 3, array['CCS 3002']::text[], false, null),
    ('CCS 3600', 'CCS Thesis I', 'Junior', '2nd Semester', 2, 3, 3, array['Passed all 3rd Yr. 1st Sem. CS Subjects']::text[], false, null),
    ('CS 3110', 'Automata Theory & Computability', 'Junior', '2nd Semester', 3, 0, 3, array['CS 2111']::text[], false, null),
    ('CS 3210', 'Computer Graphics and Visual Computing', 'Junior', '2nd Semester', 2, 3, 3, array['CCS 3010']::text[], false, null),
    ('CSPE 2', 'Professional Elective 2', 'Junior', '2nd Semester', 3, 0, 3, array['CSPE 1']::text[], true, null),

    -- Summer Term
    ('CCS 4001', 'Seminars', 'Senior', 'Summer', 3, 0, 3, array['Passed all 3rd Yr. CS Subjects']::text[], false, null),

    -- Fourth Year, First Semester
    ('CCS 4100', 'CCS Thesis II', 'Senior', '1st Semester', 2, 3, 3, array['CCS 3600']::text[], false, null),
    ('CS 4110', 'Artificial Intelligence', 'Senior', '1st Semester', 2, 3, 3, array['CS 3110']::text[], false, null),
    ('CCS 4300', 'Social Issues and Professional Practices', 'Senior', '1st Semester', 3, 0, 3, '{}'::text[], false, null),
    ('CSPE 3', 'Professional Elective 3', 'Senior', '1st Semester', 3, 0, 3, array['CSPE 2']::text[], true, null),

    -- Fourth Year, Second Semester
    ('CCS 4201', 'On-the-Job Training (600 hours)', 'Senior', '2nd Semester', 6, 0, 6, array['Passed ALL Subjects']::text[], false, null),

    -- Elective Tracks: Software Development
    ('CSPE 4100', 'Software Development 1', 'Junior', '1st Semester', 3, 0, 3, array['Passed all 2nd Yr. 2nd Sem. CS Subjects']::text[], true, 'Software Development'),
    ('CSPE 4200', 'Software Development 2', 'Junior', '2nd Semester', 3, 0, 3, array['CCSPE 2101']::text[], true, 'Software Development'),
    ('CSPE 4300', 'Software Development 3', 'Senior', '1st Semester', 3, 0, 3, array['CCSPE 2300']::text[], true, 'Software Development'),

    -- Elective Tracks: Data Science
    ('CSPE 3101', 'Data Science 1: Introduction to Data Science and Statistics', 'Junior', '1st Semester', 3, 0, 3, array['Passed all 2nd Yr. 2nd Sem. CS Subjects']::text[], true, 'Data Science'),
    ('CSPE 3300', 'Data Science 3: Data and Network Security', 'Junior', '2nd Semester', 3, 0, 3, array['CSPE 3101']::text[], true, 'Data Science'),
    ('CSPE 3400', 'Data Science 4: Data Mining', 'Senior', '1st Semester', 3, 0, 3, array['CSPE 3300']::text[], true, 'Data Science'),

    -- Elective Tracks: Cybersecurity
    ('CSPE 5100', 'Cybersecurity 1: Ethical Hacking', 'Junior', '1st Semester', 3, 0, 3, array['Passed all 2nd Yr. 2nd Sem. CS Subjects']::text[], true, 'Cybersecurity'),
    ('CSPE 5200', 'Cybersecurity 2: Ethics and Cyber Warfare', 'Junior', '2nd Semester', 3, 0, 3, array['CSPE 5100']::text[], true, 'Cybersecurity'),
    ('CSPE 5300', 'Cybersecurity 3: Digital Forensics and Cybercrime', 'Senior', '1st Semester', 3, 0, 3, array['CSPE 5200']::text[], true, 'Cybersecurity')
)
insert into public.subjects (
  id,
  code,
  name,
  year_level,
  semester,
  lec_hours,
  lab_hours,
  credit_units,
  prerequisites,
  is_elective,
  specialization,
  curriculum_version,
  active
)
select
  coalesce(s.id, 'subj-' || lower(replace(replace(ns.code, ' ', '-'), '/', '-'))),
  ns.code,
  ns.name,
  ns.year_level,
  ns.semester,
  ns.lec_hours,
  ns.lab_hours,
  ns.credit_units,
  ns.prerequisites,
  ns.is_elective,
  ns.specialization,
  '2024-2025',
  true
from new_subjects ns
left join public.subjects s on s.code = ns.code
on conflict (code) do update set
  name = excluded.name,
  year_level = excluded.year_level,
  semester = excluded.semester,
  lec_hours = excluded.lec_hours,
  lab_hours = excluded.lab_hours,
  credit_units = excluded.credit_units,
  prerequisites = excluded.prerequisites,
  is_elective = excluded.is_elective,
  specialization = excluded.specialization,
  curriculum_version = excluded.curriculum_version,
  active = true,
  updated_at = now();
