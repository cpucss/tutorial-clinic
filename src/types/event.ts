import { YearLevel } from "./common";

export type EventItem = {
  id: string;
  title: string;
  topics: string[];
  date: string;
  yearLevels: YearLevel[];
  speaker: string;
  speakerRole: string;
  venue: string;
  capacity: number;
  rsvps: number;
};