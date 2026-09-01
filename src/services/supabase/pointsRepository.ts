import { supabase } from "./client";
import type { PointTransaction } from "../../types/app";
import type { YearLevel } from "../../types/common";
import type { Database } from "../../types/database.types";

type PointTransactionRow = Database["public"]["Tables"]["point_transactions"]["Row"];

export type LeaderboardItem = {
  id: string; // User UUID
  studentId: string;
  name: string;
  yearLevel: YearLevel;
  points: number;
  rank: number;
};

function mapPointRow(row: PointTransactionRow): PointTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    points: row.points || 0,
    reason: row.reason || "",
    relatedType: row.related_type,
    relatedId: row.related_id || undefined,
    createdAt: row.created_at,
  };
}

// Retrieves point history for a user
export async function getPointHistory(userId: string): Promise<{ data: PointTransaction[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: ((data as PointTransactionRow[]) || []).map(mapPointRow), error: null };
}

// Retrieves the public sanitized leaderboard via RPC
export async function getLeaderboard(
  yearLevel?: YearLevel
): Promise<{ data: LeaderboardItem[] | null; error: string | null }> {
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_year_level: yearLevel || null,
  });

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return { data: null, error: error.message };
  }

  const rawRows = (data as Array<{ user_id: string; name: string; year_level: string; total_points: number | string; rank: number | string }> | null) || [];
  const mapped: LeaderboardItem[] = rawRows.map((row, index) => ({
    id: row.user_id,
    studentId: "",
    name: row.name || "Student",
    yearLevel: (row.year_level as YearLevel) || "Freshman",
    points: Number(row.total_points ?? 0),
    rank: Number(row.rank ?? index + 1),
  }));

  return { data: mapped, error: null };
}

// Admin manually adjusts user points via audited RPC
export async function adjustPoints(
  userId: string,
  points: number,
  reason: string
): Promise<{ data: PointTransaction | null; error: string | null }> {
  const { data, error } = await supabase.rpc("adjust_points", {
    p_user_id: userId,
    p_points: points,
    p_reason: reason.trim(),
  });

  if (error) {
    return { data: null, error: error.message || "Failed to adjust points." };
  }

  return { data: data ? mapPointRow(data as PointTransactionRow) : null, error: null };
}
