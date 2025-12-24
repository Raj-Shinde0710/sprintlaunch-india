export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      commitments: {
        Row: {
          amount: number
          backer_id: string
          created_at: string | null
          id: string
          sprint_id: string
          status: Database["public"]["Enums"]["commitment_status"] | null
          unlock_milestone: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          backer_id: string
          created_at?: string | null
          id?: string
          sprint_id: string
          status?: Database["public"]["Enums"]["commitment_status"] | null
          unlock_milestone?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          backer_id?: string
          created_at?: string | null
          id?: string
          sprint_id?: string
          status?: Database["public"]["Enums"]["commitment_status"] | null
          unlock_milestone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commitments_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          backer_id: string
          created_at: string | null
          id: string
          message: string | null
          request_type: string
          sprint_id: string
          status: string | null
        }
        Insert: {
          backer_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          request_type: string
          sprint_id: string
          status?: string | null
        }
        Update: {
          backer_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          request_type?: string
          sprint_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_requests_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          competitive_analysis: string | null
          competitive_analysis_summary: string | null
          created_at: string | null
          founder_id: string
          has_problem_validation: boolean | null
          has_user_interviews: boolean | null
          id: string
          industry: string[] | null
          is_published: boolean | null
          pitch: string
          problem_statement: string | null
          readiness_status: string | null
          required_roles: string[] | null
          sprint_duration: number | null
          stage: Database["public"]["Enums"]["idea_stage"] | null
          target_users: string | null
          title: string
          updated_at: string | null
          validation_evidence: Json | null
          validation_proof: string | null
          weekly_commitment: number | null
        }
        Insert: {
          competitive_analysis?: string | null
          competitive_analysis_summary?: string | null
          created_at?: string | null
          founder_id: string
          has_problem_validation?: boolean | null
          has_user_interviews?: boolean | null
          id?: string
          industry?: string[] | null
          is_published?: boolean | null
          pitch: string
          problem_statement?: string | null
          readiness_status?: string | null
          required_roles?: string[] | null
          sprint_duration?: number | null
          stage?: Database["public"]["Enums"]["idea_stage"] | null
          target_users?: string | null
          title: string
          updated_at?: string | null
          validation_evidence?: Json | null
          validation_proof?: string | null
          weekly_commitment?: number | null
        }
        Update: {
          competitive_analysis?: string | null
          competitive_analysis_summary?: string | null
          created_at?: string | null
          founder_id?: string
          has_problem_validation?: boolean | null
          has_user_interviews?: boolean | null
          id?: string
          industry?: string[] | null
          is_published?: boolean | null
          pitch?: string
          problem_statement?: string | null
          readiness_status?: string | null
          required_roles?: string[] | null
          sprint_duration?: number | null
          stage?: Database["public"]["Enums"]["idea_stage"] | null
          target_users?: string | null
          title?: string
          updated_at?: string | null
          validation_evidence?: Json | null
          validation_proof?: string | null
          weekly_commitment?: number | null
        }
        Relationships: []
      }
      peer_reviews: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          sprint_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          sprint_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          sprint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_reviews_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_hours: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          execution_score: number | null
          full_name: string | null
          github_url: string | null
          id: string
          is_verified: boolean | null
          linkedin_url: string | null
          location: string | null
          portfolio_url: string | null
          skills: string[] | null
          sprints_completed: number | null
          tasks_completed: number | null
          updated_at: string | null
        }
        Insert: {
          availability_hours?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          execution_score?: number | null
          full_name?: string | null
          github_url?: string | null
          id: string
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          sprints_completed?: number | null
          tasks_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          availability_hours?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          execution_score?: number | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          sprints_completed?: number | null
          tasks_completed?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sprint_applications: {
        Row: {
          availability_hours: number | null
          created_at: string | null
          id: string
          message: string | null
          role: string
          sprint_id: string
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_hours?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          role: string
          sprint_id: string
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_hours?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          role?: string
          sprint_id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_applications_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_members: {
        Row: {
          commitment_deposit: number | null
          dropout_penalty_applied: boolean | null
          equity_share: number | null
          hours_committed: number | null
          hours_logged: number | null
          id: string
          is_founder: boolean | null
          joined_at: string | null
          left_at: string | null
          min_weekly_hours: number | null
          peer_rating: number | null
          peer_reviews_received: number | null
          role: string
          sprint_id: string
          user_id: string
        }
        Insert: {
          commitment_deposit?: number | null
          dropout_penalty_applied?: boolean | null
          equity_share?: number | null
          hours_committed?: number | null
          hours_logged?: number | null
          id?: string
          is_founder?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          min_weekly_hours?: number | null
          peer_rating?: number | null
          peer_reviews_received?: number | null
          role: string
          sprint_id: string
          user_id: string
        }
        Update: {
          commitment_deposit?: number | null
          dropout_penalty_applied?: boolean | null
          equity_share?: number | null
          hours_committed?: number | null
          hours_logged?: number | null
          id?: string
          is_founder?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          min_weekly_hours?: number | null
          peer_rating?: number | null
          peer_reviews_received?: number | null
          role?: string
          sprint_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_members_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_timeline: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          sprint_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          sprint_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          sprint_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_timeline_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          completed_at: string | null
          created_at: string | null
          deliverables: string[] | null
          deliverables_submitted: boolean | null
          demo_notes: string | null
          demo_video_url: string | null
          demo_visibility: string | null
          duration_days: number
          end_date: string | null
          failed_at: string | null
          goal: string | null
          goals_defined: boolean | null
          id: string
          idea_id: string
          inactivity_warning_at: string | null
          last_activity_at: string | null
          mid_review_done: boolean | null
          name: string
          pitch_deck_url: string | null
          progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["sprint_status"] | null
          tasks_assigned: boolean | null
          team_formed: boolean | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          deliverables_submitted?: boolean | null
          demo_notes?: string | null
          demo_video_url?: string | null
          demo_visibility?: string | null
          duration_days: number
          end_date?: string | null
          failed_at?: string | null
          goal?: string | null
          goals_defined?: boolean | null
          id?: string
          idea_id: string
          inactivity_warning_at?: string | null
          last_activity_at?: string | null
          mid_review_done?: boolean | null
          name: string
          pitch_deck_url?: string | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["sprint_status"] | null
          tasks_assigned?: boolean | null
          team_formed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          deliverables?: string[] | null
          deliverables_submitted?: boolean | null
          demo_notes?: string | null
          demo_video_url?: string | null
          demo_visibility?: string | null
          duration_days?: number
          end_date?: string | null
          failed_at?: string | null
          goal?: string | null
          goals_defined?: boolean | null
          id?: string
          idea_id?: string
          inactivity_warning_at?: string | null
          last_activity_at?: string | null
          mid_review_done?: boolean | null
          name?: string
          pitch_deck_url?: string | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["sprint_status"] | null
          tasks_assigned?: boolean | null
          team_formed?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprints_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          hours_estimated: number | null
          hours_logged: number | null
          id: string
          priority: number | null
          sprint_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          hours_estimated?: number | null
          hours_logged?: number | null
          id?: string
          priority?: number | null
          sprint_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          hours_estimated?: number | null
          hours_logged?: number | null
          id?: string
          priority?: number | null
          sprint_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_equity_distribution: {
        Args: { sprint_uuid: string }
        Returns: {
          equity_share: number
          user_id: string
        }[]
      }
      calculate_execution_score: {
        Args: { user_uuid: string }
        Returns: number
      }
      calculate_sprint_progress: {
        Args: { sprint_uuid: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "founder" | "builder" | "backer"
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      commitment_status: "pending" | "locked" | "released" | "refunded"
      idea_stage: "idea" | "validation" | "prototype" | "mvp"
      sprint_status: "draft" | "active" | "paused" | "completed" | "failed"
      task_status: "todo" | "in_progress" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["founder", "builder", "backer"],
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      commitment_status: ["pending", "locked", "released", "refunded"],
      idea_stage: ["idea", "validation", "prototype", "mvp"],
      sprint_status: ["draft", "active", "paused", "completed", "failed"],
      task_status: ["todo", "in_progress", "done"],
    },
  },
} as const
