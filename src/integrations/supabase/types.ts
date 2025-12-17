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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_annotations: {
        Row: {
          analysis_id: string
          created_at: string
          end_offset: number
          field_name: string
          highlighted_text: string
          id: string
          note: string
          start_offset: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          end_offset: number
          field_name: string
          highlighted_text: string
          id?: string
          note: string
          start_offset: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          end_offset?: number
          field_name?: string
          highlighted_text?: string
          id?: string
          note?: string
          start_offset?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_annotations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "experiment_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      annotations: {
        Row: {
          created_at: string
          end_offset: number
          experiment_id: string
          field_name: string
          highlighted_text: string
          id: string
          note: string
          start_offset: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_offset: number
          experiment_id: string
          field_name: string
          highlighted_text: string
          id?: string
          note: string
          start_offset: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_offset?: number
          experiment_id?: string
          field_name?: string
          highlighted_text?: string
          id?: string
          note?: string
          start_offset?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annotations_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_history: {
        Row: {
          board_name: string
          created_at: string
          goal: string
          id: string
          loser_elo_after: number
          loser_elo_before: number
          loser_id: string
          user_id: string | null
          winner_elo_after: number
          winner_elo_before: number
          winner_id: string
        }
        Insert: {
          board_name: string
          created_at?: string
          goal: string
          id?: string
          loser_elo_after: number
          loser_elo_before: number
          loser_id: string
          user_id?: string | null
          winner_elo_after: number
          winner_elo_before: number
          winner_id: string
        }
        Update: {
          board_name?: string
          created_at?: string
          goal?: string
          id?: string
          loser_elo_after?: number
          loser_elo_before?: number
          loser_id?: string
          user_id?: string | null
          winner_elo_after?: number
          winner_elo_before?: number
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_history_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_history_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      experiment_analyses: {
        Row: {
          analysis: Json
          created_at: string
          experiment_count: number
          experiment_ids: string[]
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          analysis: Json
          created_at?: string
          experiment_count: number
          experiment_ids: string[]
          id?: string
          title?: string
          user_id?: string | null
        }
        Update: {
          analysis?: Json
          created_at?: string
          experiment_count?: number
          experiment_ids?: string[]
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_tags: {
        Row: {
          created_at: string
          experiment_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          experiment_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          experiment_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_tags_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          agentic_prompt: string
          board_full_context: string
          board_name: string
          board_pulled_context: string
          created_at: string
          desired: string
          elo_rating: number
          example: string
          folder_id: string | null
          goal: string
          id: string
          mission: string
          name: string
          notes: string | null
          output: string
          rating: number | null
          rules: string
          search_context: string
          search_terms: string
          updated_at: string
          use_websearch: boolean
        }
        Insert: {
          agentic_prompt?: string
          board_full_context?: string
          board_name?: string
          board_pulled_context?: string
          created_at?: string
          desired?: string
          elo_rating?: number
          example?: string
          folder_id?: string | null
          goal?: string
          id?: string
          mission?: string
          name: string
          notes?: string | null
          output?: string
          rating?: number | null
          rules?: string
          search_context?: string
          search_terms?: string
          updated_at?: string
          use_websearch?: boolean
        }
        Update: {
          agentic_prompt?: string
          board_full_context?: string
          board_name?: string
          board_pulled_context?: string
          created_at?: string
          desired?: string
          elo_rating?: number
          example?: string
          folder_id?: string | null
          goal?: string
          id?: string
          mission?: string
          name?: string
          notes?: string | null
          output?: string
          rating?: number | null
          rules?: string
          search_context?: string
          search_terms?: string
          updated_at?: string
          use_websearch?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "experiments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          annotation_id: string | null
          created_at: string
          from_user_id: string | null
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          annotation_id?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          annotation_id?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          has_completed_tour: boolean | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          has_completed_tour?: boolean | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          has_completed_tour?: boolean | null
          id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          analysis_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          experiment_id: string | null
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          experiment_id?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          experiment_id?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "experiment_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_messages: {
        Row: {
          created_at: string
          edited_at: string | null
          id: string
          message: string
          reply_to_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          edited_at?: string | null
          id?: string
          message: string
          reply_to_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          edited_at?: string | null
          id?: string
          message?: string
          reply_to_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "team_chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
