export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          year_level: "Freshman" | "Sophomore" | "Junior" | "Senior" | null;
          program: string;
          section: string;
          role: "student" | "contributor" | "admin";
          active: boolean;
          account_setup_completed: boolean;
          must_change_password: boolean;
          password_prompt_dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name?: string;
          year_level?: "Freshman" | "Sophomore" | "Junior" | "Senior" | null;
          program?: string;
          section?: string;
          role?: "student" | "contributor" | "admin";
          active?: boolean;
          account_setup_completed?: boolean;
          must_change_password?: boolean;
          password_prompt_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          year_level?: "Freshman" | "Sophomore" | "Junior" | "Senior" | null;
          program?: string;
          section?: string;
          role?: "student" | "contributor" | "admin";
          active?: boolean;
          account_setup_completed?: boolean;
          must_change_password?: boolean;
          password_prompt_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          code: string;
          name: string;
          year_level: "Freshman" | "Sophomore" | "Junior" | "Senior" | null;
          coordinator: string;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          year_level?: "Freshman" | "Sophomore" | "Junior" | "Senior" | null;
          coordinator?: string;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          year_level?: "Freshman" | "Sophomore" | "Junior" | "Senior" | null;
          coordinator?: string;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          title: string;
          description: string;
          subject_id: string;
          date: string;
          end_date: string;
          venue: string;
          capacity: number;
          instructor: string;
          instructor_role: string;
          status: "Draft" | "Upcoming" | "Live" | "Completed" | "Cancelled";
          topics: string[];
          year_levels: ("Freshman" | "Sophomore" | "Junior" | "Senior")[];
          attendance_code: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          subject_id: string;
          date: string;
          end_date: string;
          venue: string;
          capacity?: number;
          instructor?: string;
          instructor_role?: string;
          status?: "Draft" | "Upcoming" | "Live" | "Completed" | "Cancelled";
          topics?: string[];
          year_levels?: ("Freshman" | "Sophomore" | "Junior" | "Senior")[];
          attendance_code?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          subject_id?: string;
          date?: string;
          end_date?: string;
          venue?: string;
          capacity?: number;
          instructor?: string;
          instructor_role?: string;
          status?: "Draft" | "Upcoming" | "Live" | "Completed" | "Cancelled";
          topics?: string[];
          year_levels?: ("Freshman" | "Sophomore" | "Junior" | "Senior")[];
          attendance_code?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rsvps: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          user_id: string;
          status: "Pending" | "Approved" | "Rejected";
          method: "Code" | "QR" | "Manual";
          arrival: "Early" | "On time" | "Late";
          scanned_at: string | null;
          checked_in_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          correction_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id?: string;
          user_id: string;
          status?: "Pending" | "Approved" | "Rejected";
          method?: "Code" | "QR" | "Manual";
          arrival?: "Early" | "On time" | "Late";
          scanned_at?: string | null;
          checked_in_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          correction_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          user_id?: string;
          status?: "Pending" | "Approved" | "Rejected";
          method?: "Code" | "QR" | "Manual";
          arrival?: "Early" | "On time" | "Late";
          scanned_at?: string | null;
          checked_in_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          correction_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          title: string;
          subject_id: string;
          description: string;
          tags: string[];
          target_year_levels: ("Freshman" | "Sophomore" | "Junior" | "Senior")[];
          uploader_id: string;
          status: "Draft" | "Pending" | "Approved" | "Rejected";
          downloads: number;
          rejection_reason: string | null;
          moderated_at: string | null;
          moderated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subject_id: string;
          description?: string;
          tags?: string[];
          target_year_levels?: ("Freshman" | "Sophomore" | "Junior" | "Senior")[];
          uploader_id: string;
          status?: "Draft" | "Pending" | "Approved" | "Rejected";
          downloads?: number;
          rejection_reason?: string | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subject_id?: string;
          description?: string;
          tags?: string[];
          target_year_levels?: ("Freshman" | "Sophomore" | "Junior" | "Senior")[];
          uploader_id?: string;
          status?: "Draft" | "Pending" | "Approved" | "Rejected";
          downloads?: number;
          rejection_reason?: string | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      note_files: {
        Row: {
          id: string;
          note_id: string;
          uploader_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          uploader_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          uploader_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      note_favorites: {
        Row: {
          user_id: string;
          note_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          note_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          note_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      point_rules: {
        Row: {
          code: string;
          points: number;
          label: string;
          active: boolean;
          updated_at: string;
        };
        Insert: {
          code: string;
          points: number;
          label: string;
          active?: boolean;
          updated_at?: string;
        };
        Update: {
          code?: string;
          points?: number;
          label?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          reason: string;
          related_type: "Attendance" | "Note" | "Adjustment" | "Account";
          related_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          points: number;
          reason: string;
          related_type: "Attendance" | "Note" | "Adjustment" | "Account";
          related_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          points?: number;
          reason?: string;
          related_type?: "Attendance" | "Note" | "Adjustment" | "Account";
          related_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          related_tab: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          related_tab?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          related_tab?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          pinned: boolean;
          audience: "All" | "Freshman" | "Sophomore" | "Junior" | "Senior";
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          pinned?: boolean;
          audience?: "All" | "Freshman" | "Sophomore" | "Junior" | "Senior";
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          pinned?: boolean;
          audience?: "All" | "Freshman" | "Sophomore" | "Junior" | "Senior";
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcement_reads: {
        Row: {
          announcement_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          announcement_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          announcement_id?: string;
          user_id?: string;
          read_at?: string;
        };
        Relationships: [];
      };
      saved_sessions: {
        Row: {
          user_id: string;
          session_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          session_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          session_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          reduced_motion: boolean;
          high_contrast: boolean;
          compact_navigation: boolean;
          session_reminders: boolean;
          note_updates: boolean;
          leaderboard_updates: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          reduced_motion?: boolean;
          high_contrast?: boolean;
          compact_navigation?: boolean;
          session_reminders?: boolean;
          note_updates?: boolean;
          leaderboard_updates?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          reduced_motion?: boolean;
          high_contrast?: boolean;
          compact_navigation?: boolean;
          session_reminders?: boolean;
          note_updates?: boolean;
          leaderboard_updates?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_rsvp: {
        Args: {
          p_session_id: string;
          p_joined: boolean;
        };
        Returns: {
          joined: boolean;
          rsvp: Database["public"]["Tables"]["rsvps"]["Row"] | null;
        };
      };
      set_session_attendance_code: {
        Args: {
          p_session_id: string;
          p_code: string;
        };
        Returns: void;
      };
      check_in_with_code: {
        Args: {
          p_session_id: string;
          p_code: string;
        };
        Returns: Database["public"]["Tables"]["attendance"]["Row"];
      };
      issue_attendance_qr: {
        Args: Record<string, never>;
        Returns: {
          token: string;
          expires_at: string;
        };
      };
      record_attendance_from_qr: {
        Args: {
          p_session_id: string;
          p_token: string;
        };
        Returns: {
          attendance: Database["public"]["Tables"]["attendance"]["Row"];
          student: {
            id: string;
            student_id: string;
            name: string;
            year_level: string;
          };
        };
      };
      moderate_attendance: {
        Args: {
          p_attendance_id: string;
          p_status: string;
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["attendance"]["Row"];
      };
      moderate_note: {
        Args: {
          p_note_id: string;
          p_status: string;
          p_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["notes"]["Row"];
      };
      adjust_points: {
        Args: {
          p_user_id: string;
          p_points: number;
          p_reason: string;
        };
        Returns: Database["public"]["Tables"]["point_transactions"]["Row"];
      };
      get_leaderboard: {
        Args: {
          p_year_level?: string | null;
        };
        Returns: Array<{
          user_id: string;
          name: string;
          year_level: string;
          total_points: number;
          rank: number;
        }>;
      };
      update_my_profile: {
        Args: {
          p_name: string;
          p_year_level: string;
          p_program: string;
          p_section: string;
          p_account_setup_completed?: boolean | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      defer_password_change: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      complete_password_change: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
