import { supabase } from "./client";
import type { DemoNotification, Announcement, NotificationType } from "../../types/app";
import type { YearLevel } from "../../types/common";

function mapNotificationRow(row: any): DemoNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: (row.type as NotificationType) || "System",
    createdAt: row.created_at,
    readAt: row.read_at || undefined,
    relatedTab: row.related_tab || undefined,
    relatedId: row.related_id || undefined,
  };
}

export async function getNotifications(userId: string): Promise<{ data: DemoNotification[] | null; error: any }> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, type, read_at, related_tab, related_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: (data || []).map(mapNotificationRow), error: null };
}

export async function markNotificationAsRead(
  notificationId: string,
  read: boolean
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", notificationId);

  return { error };
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  return { error };
}

export async function getAnnouncements(): Promise<{ data: Announcement[] | null; error: any }> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, pinned, audience, published_at")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) return { data: null, error };

  const mapped: Announcement[] = (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: Boolean(row.pinned),
    audience: (row.audience as "All" | YearLevel) || "All",
    publishedAt: row.published_at || new Date().toISOString(),
    readBy: [],
  }));

  return { data: mapped, error: null };
}

export async function markAnnouncementAsRead(announcementId: string): Promise<{ error: any }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: new Error("Not authenticated") };

  const { error } = await supabase
    .from("announcement_reads")
    .upsert({
      announcement_id: announcementId,
      user_id: userData.user.id,
    });

  return { error };
}
