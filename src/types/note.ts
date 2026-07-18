import { YearLevel } from "./common";
export type NoteStatus = "Pending" | "Approved" | "Rejected";

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