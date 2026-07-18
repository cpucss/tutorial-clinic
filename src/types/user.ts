import { YearLevel } from "./common";

export type User = {
  id: string;
  name: string;
  studentId: string;
  yearLevel: YearLevel;
  email: string;
  points: number;
  role: "student" | "contributor" | "admin";
  avatarUrl?: string;
};
