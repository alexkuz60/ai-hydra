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
      chronicles: {
        Row: {
          ai_revision: string | null
          created_at: string
          entry_code: string
          entry_date: string
          hypothesis: string | null
          id: string
          initiator: string
          is_visible: boolean
          metrics_after: Json | null
          metrics_before: Json | null
          role_object: string
          status: string
          summary: string | null
          supervisor_comment: string | null
          supervisor_resolution: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_revision?: string | null
          created_at?: string
          entry_code: string
          entry_date?: string
          hypothesis?: string | null
          id?: string
          initiator?: string
          is_visible?: boolean
          metrics_after?: Json | null
          metrics_before?: Json | null
          role_object?: string
          status?: string
          summary?: string | null
          supervisor_comment?: string | null
          supervisor_resolution?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_revision?: string | null
          created_at?: string
          entry_code?: string
          entry_date?: string
          hypothesis?: string | null
          id?: string
          initiator?: string
          is_visible?: boolean
          metrics_after?: Json | null
          metrics_before?: Json | null
          role_object?: string
          status?: string
          summary?: string | null
          supervisor_comment?: string | null
          supervisor_resolution?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contest_results: {
        Row: {
          arbiter_comment: string | null
          arbiter_model: string | null
          arbiter_score: number | null
          created_at: string
          criteria_scores: Json | null
          id: string
          metadata: Json | null
          model_id: string
          response_text: string | null
          response_time_ms: number | null
          round_id: string
          session_id: string
          status: string
          token_count: number | null
          updated_at: string
          user_score: number | null
        }
        Insert: {
          arbiter_comment?: string | null
          arbiter_model?: string | null
          arbiter_score?: number | null
          created_at?: string
          criteria_scores?: Json | null
          id?: string
          metadata?: Json | null
          model_id: string
          response_text?: string | null
          response_time_ms?: number | null
          round_id: string
          session_id: string
          status?: string
          token_count?: number | null
          updated_at?: string
          user_score?: number | null
        }
        Update: {
          arbiter_comment?: string | null
          arbiter_model?: string | null
          arbiter_score?: number | null
          created_at?: string
          criteria_scores?: Json | null
          id?: string
          metadata?: Json | null
          model_id?: string
          response_text?: string | null
          response_time_ms?: number | null
          round_id?: string
          session_id?: string
          status?: string
          token_count?: number | null
          updated_at?: string
          user_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_results_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "contest_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_rounds: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          prompt: string
          round_index: number
          session_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          prompt?: string
          round_index?: number
          session_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          prompt?: string
          round_index?: number
          session_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_sessions: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          id: string
          name: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          name?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          name?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_tools: {
        Row: {
          category: string
          created_at: string
          description: string
          display_name: string
          http_config: Json | null
          id: string
          is_shared: boolean
          name: string
          parameters: Json
          prompt_template: string
          tool_type: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          display_name: string
          http_config?: Json | null
          id?: string
          is_shared?: boolean
          name: string
          parameters?: Json
          prompt_template: string
          tool_type?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_name?: string
          http_config?: Json | null
          id?: string
          is_shared?: boolean
          name?: string
          parameters?: Json
          prompt_template?: string
          tool_type?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      flow_diagrams: {
        Row: {
          created_at: string
          description: string | null
          edges: Json
          id: string
          is_shared: boolean
          name: string
          nodes: Json
          source: string | null
          updated_at: string
          user_id: string
          viewport: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          is_shared?: boolean
          name: string
          nodes?: Json
          source?: string | null
          updated_at?: string
          user_id: string
          viewport?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          is_shared?: boolean
          name?: string
          nodes?: Json
          source?: string | null
          updated_at?: string
          user_id?: string
          viewport?: Json | null
        }
        Relationships: []
      }
      guide_panel_elements: {
        Row: {
          created_at: string
          description_en: string
          description_ru: string
          element_id: string
          id: string
          label_en: string
          label_ru: string
          selector: string | null
          sort_order: number
          step_index: number
          tour_id: string
        }
        Insert: {
          created_at?: string
          description_en?: string
          description_ru?: string
          element_id: string
          id?: string
          label_en: string
          label_ru: string
          selector?: string | null
          sort_order?: number
          step_index: number
          tour_id: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_ru?: string
          element_id?: string
          id?: string
          label_en?: string
          label_ru?: string
          selector?: string | null
          sort_order?: number
          step_index?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_panel_elements_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "guide_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_tour_steps: {
        Row: {
          action: string | null
          created_at: string
          delay_ms: number | null
          description_en: string
          description_ru: string
          id: string
          placement: string
          route: string | null
          selector: string
          step_index: number
          title_en: string
          title_ru: string
          tour_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          delay_ms?: number | null
          description_en?: string
          description_ru?: string
          id?: string
          placement?: string
          route?: string | null
          selector: string
          step_index: number
          title_en: string
          title_ru: string
          tour_id: string
        }
        Update: {
          action?: string | null
          created_at?: string
          delay_ms?: number | null
          description_en?: string
          description_ru?: string
          id?: string
          placement?: string
          route?: string | null
          selector?: string
          step_index?: number
          title_en?: string
          title_ru?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_tour_steps_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "guide_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_tours: {
        Row: {
          created_at: string
          description_en: string
          description_ru: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string
          description_ru?: string
          icon?: string
          id: string
          is_active?: boolean
          sort_order?: number
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_ru?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          briefing_data: Json | null
          briefing_token_count: number | null
          candidate_model: string
          completed_at: string | null
          config: Json | null
          created_at: string | null
          id: string
          role: string
          source_contest_id: string | null
          started_at: string | null
          status: string
          test_results: Json | null
          updated_at: string | null
          user_id: string
          verdict: Json | null
        }
        Insert: {
          briefing_data?: Json | null
          briefing_token_count?: number | null
          candidate_model: string
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          id?: string
          role: string
          source_contest_id?: string | null
          started_at?: string | null
          status?: string
          test_results?: Json | null
          updated_at?: string | null
          user_id: string
          verdict?: Json | null
        }
        Update: {
          briefing_data?: Json | null
          briefing_token_count?: number | null
          candidate_model?: string
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          id?: string
          role?: string
          source_contest_id?: string | null
          started_at?: string | null
          status?: string
          test_results?: Json | null
          updated_at?: string | null
          user_id?: string
          verdict?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          model_name: string | null
          reasoning_path: string | null
          reasoning_translated: string | null
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          model_name?: string | null
          reasoning_path?: string | null
          reasoning_translated?: string | null
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          model_name?: string | null
          reasoning_path?: string | null
          reasoning_translated?: string | null
          role?: Database["public"]["Enums"]["message_role"]
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      model_presets: {
        Row: {
          created_at: string
          id: string
          max_tokens: number
          name: string
          role: string
          system_prompt: string | null
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens?: number
          name: string
          role?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number
          name?: string
          role?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      model_statistics: {
        Row: {
          arbiter_eval_count: number
          arbiter_score: number
          contest_count: number
          contest_total_score: number
          created_at: string | null
          criteria_averages: Json | null
          critique_summary: string | null
          dismissal_count: number
          first_used_at: string | null
          hallucination_count: number
          id: string
          last_used_at: string | null
          model_id: string
          response_count: number
          role_used: string | null
          session_id: string | null
          task_id: string | null
          total_brains: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arbiter_eval_count?: number
          arbiter_score?: number
          contest_count?: number
          contest_total_score?: number
          created_at?: string | null
          criteria_averages?: Json | null
          critique_summary?: string | null
          dismissal_count?: number
          first_used_at?: string | null
          hallucination_count?: number
          id?: string
          last_used_at?: string | null
          model_id: string
          response_count?: number
          role_used?: string | null
          session_id?: string | null
          task_id?: string | null
          total_brains?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arbiter_eval_count?: number
          arbiter_score?: number
          contest_count?: number
          contest_total_score?: number
          created_at?: string | null
          criteria_averages?: Json | null
          critique_summary?: string | null
          dismissal_count?: number
          first_used_at?: string | null
          hallucination_count?: number
          id?: string
          last_used_at?: string | null
          model_id?: string
          response_count?: number
          role_used?: string | null
          session_id?: string | null
          task_id?: string | null
          total_brains?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_statistics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string
          preferred_theme: string
          proxyapi_priority: boolean
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string
          preferred_theme?: string
          proxyapi_priority?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string
          preferred_theme?: string
          proxyapi_priority?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      prompt_library: {
        Row: {
          content: string
          created_at: string
          description: string | null
          embedding: string | null
          id: string
          is_default: boolean
          is_shared: boolean
          language: string | null
          name: string
          role: string
          tags: string[] | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          is_default?: boolean
          is_shared?: boolean
          language?: string | null
          name: string
          role?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          is_default?: boolean
          is_shared?: boolean
          language?: string | null
          name?: string
          role?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      proxy_api_logs: {
        Row: {
          created_at: string
          error_message: string | null
          fallback_provider: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          model_id: string
          provider: string
          request_type: string
          status: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          fallback_provider?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model_id: string
          provider?: string
          request_type?: string
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          fallback_provider?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model_id?: string
          provider?: string
          request_type?: string
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: []
      }
      role_assignment_history: {
        Row: {
          assigned_at: string
          created_at: string
          id: string
          interview_avg_score: number | null
          interview_session_id: string | null
          is_synthetic: boolean
          metadata: Json | null
          model_id: string
          removal_reason: string | null
          removed_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          id?: string
          interview_avg_score?: number | null
          interview_session_id?: string | null
          is_synthetic?: boolean
          metadata?: Json | null
          model_id: string
          removal_reason?: string | null
          removed_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          id?: string
          interview_avg_score?: number | null
          interview_session_id?: string | null
          is_synthetic?: boolean
          metadata?: Json | null
          model_id?: string
          removal_reason?: string | null
          removed_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignment_history_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_behaviors: {
        Row: {
          communication: Json
          created_at: string
          id: string
          interactions: Json
          is_shared: boolean
          is_system: boolean
          name: string
          reactions: Json
          requires_approval: boolean | null
          role: string
          updated_at: string
          usage_count: number
          user_id: string | null
        }
        Insert: {
          communication?: Json
          created_at?: string
          id?: string
          interactions?: Json
          is_shared?: boolean
          is_system?: boolean
          name: string
          reactions?: Json
          requires_approval?: boolean | null
          role: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          communication?: Json
          created_at?: string
          id?: string
          interactions?: Json
          is_shared?: boolean
          is_system?: boolean
          name?: string
          reactions?: Json
          requires_approval?: boolean | null
          role?: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      role_knowledge: {
        Row: {
          category: string
          chunk_index: number
          chunk_total: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          role: string
          source_title: string | null
          source_url: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          category?: string
          chunk_index?: number
          chunk_total?: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          role: string
          source_title?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          category?: string
          chunk_index?: number
          chunk_total?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          source_title?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      role_memory: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          last_used_at: string | null
          memory_type: string
          metadata: Json | null
          role: string
          source_message_id: string | null
          source_session_id: string | null
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_used_at?: string | null
          memory_type?: string
          metadata?: Json | null
          role: string
          source_message_id?: string | null
          source_session_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_used_at?: string | null
          memory_type?: string
          metadata?: Json | null
          role?: string
          source_message_id?: string | null
          source_session_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_memory_source_session_id_fkey"
            columns: ["source_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_memory: {
        Row: {
          chunk_type: string
          content: string
          created_at: string
          embedding: string | null
          feedback: number | null
          id: string
          last_retrieved_at: string | null
          metadata: Json | null
          relevance_score: number | null
          retrieved_count: number
          session_id: string
          source_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chunk_type?: string
          content: string
          created_at?: string
          embedding?: string | null
          feedback?: number | null
          id?: string
          last_retrieved_at?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          retrieved_count?: number
          session_id: string
          source_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chunk_type?: string
          content?: string
          created_at?: string
          embedding?: string | null
          feedback?: number | null
          id?: string
          last_retrieved_at?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          retrieved_count?: number
          session_id?: string
          source_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_memory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_memory_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          session_config: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          session_config?: Json | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          session_config?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_blueprints: {
        Row: {
          category: Database["public"]["Enums"]["pattern_category"]
          checkpoints: Json
          created_at: string
          description: string
          id: string
          is_shared: boolean
          is_system: boolean
          name: string
          stages: Json
          updated_at: string
          usage_count: number
          user_id: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["pattern_category"]
          checkpoints?: Json
          created_at?: string
          description: string
          id?: string
          is_shared?: boolean
          is_system?: boolean
          name: string
          stages?: Json
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["pattern_category"]
          checkpoints?: Json
          created_at?: string
          description?: string
          id?: string
          is_shared?: boolean
          is_system?: boolean
          name?: string
          stages?: Json
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      task_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          anthropic_vault_id: string | null
          created_at: string
          deepseek_vault_id: string | null
          firecrawl_vault_id: string | null
          gemini_vault_id: string | null
          groq_vault_id: string | null
          id: string
          key_metadata: Json | null
          mistral_vault_id: string | null
          openai_vault_id: string | null
          openrouter_vault_id: string | null
          perplexity_vault_id: string | null
          proxyapi_vault_id: string | null
          tavily_vault_id: string | null
          updated_at: string
          user_id: string
          xai_vault_id: string | null
        }
        Insert: {
          anthropic_vault_id?: string | null
          created_at?: string
          deepseek_vault_id?: string | null
          firecrawl_vault_id?: string | null
          gemini_vault_id?: string | null
          groq_vault_id?: string | null
          id?: string
          key_metadata?: Json | null
          mistral_vault_id?: string | null
          openai_vault_id?: string | null
          openrouter_vault_id?: string | null
          perplexity_vault_id?: string | null
          proxyapi_vault_id?: string | null
          tavily_vault_id?: string | null
          updated_at?: string
          user_id: string
          xai_vault_id?: string | null
        }
        Update: {
          anthropic_vault_id?: string | null
          created_at?: string
          deepseek_vault_id?: string | null
          firecrawl_vault_id?: string | null
          gemini_vault_id?: string | null
          groq_vault_id?: string | null
          id?: string
          key_metadata?: Json | null
          mistral_vault_id?: string | null
          openai_vault_id?: string | null
          openrouter_vault_id?: string | null
          perplexity_vault_id?: string | null
          proxyapi_vault_id?: string | null
          tavily_vault_id?: string | null
          updated_at?: string
          user_id?: string
          xai_vault_id?: string | null
        }
        Relationships: []
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
      user_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_secret: { Args: { p_secret_id: string }; Returns: undefined }
      get_custom_tools_safe: {
        Args: never
        Returns: {
          category: string
          created_at: string
          description: string
          display_name: string
          http_config: Json
          id: string
          is_owner: boolean
          is_shared: boolean
          name: string
          parameters: Json
          prompt_template: string
          tool_type: string
          updated_at: string
          usage_count: number
        }[]
      }
      get_decrypted_secret: { Args: { p_secret_id: string }; Returns: string }
      get_my_api_key_status: {
        Args: never
        Returns: {
          has_anthropic: boolean
          has_deepseek: boolean
          has_firecrawl: boolean
          has_gemini: boolean
          has_groq: boolean
          has_mistral: boolean
          has_openai: boolean
          has_openrouter: boolean
          has_perplexity: boolean
          has_proxyapi: boolean
          has_tavily: boolean
          has_xai: boolean
        }[]
      }
      get_my_api_keys: {
        Args: never
        Returns: {
          anthropic_api_key: string
          deepseek_api_key: string
          firecrawl_api_key: string
          google_gemini_api_key: string
          groq_api_key: string
          mistral_api_key: string
          openai_api_key: string
          openrouter_api_key: string
          perplexity_api_key: string
          proxyapi_api_key: string
          tavily_api_key: string
          xai_api_key: string
        }[]
      }
      get_my_key_metadata: { Args: never; Returns: Json }
      get_prompt_library_safe: {
        Args: never
        Returns: {
          content: string
          created_at: string
          description: string
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          language: string
          name: string
          role: string
          tags: string[]
          updated_at: string
          usage_count: number
        }[]
      }
      get_rag_analytics: {
        Args: never
        Returns: {
          chunk_id: string
          chunk_type: string
          content_preview: string
          created_at: string
          feedback: number
          last_retrieved_at: string
          relevance_score: number
          retrieved_count: number
          session_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hybrid_search_role_knowledge: {
        Args: {
          p_categories?: string[]
          p_limit?: number
          p_query_embedding: string
          p_query_text: string
          p_role: string
        }
        Returns: {
          category: string
          content: string
          hybrid_score: number
          id: string
          metadata: Json
          similarity: number
          source_title: string
          source_url: string
          tags: string[]
          text_rank: number
          version: string
        }[]
      }
      hybrid_search_session_memory: {
        Args: {
          p_chunk_types?: string[]
          p_limit?: number
          p_query_embedding: string
          p_query_text: string
          p_session_id: string
        }
        Returns: {
          chunk_type: string
          content: string
          hybrid_score: number
          id: string
          metadata: Json
          similarity: number
          text_rank: number
        }[]
      }
      increment_role_memory_usage: {
        Args: { p_memory_id: string }
        Returns: undefined
      }
      is_admin_or_supervisor: { Args: { _user_id: string }; Returns: boolean }
      record_chunk_retrieval: {
        Args: { p_chunk_ids: string[]; p_similarities: number[] }
        Returns: undefined
      }
      save_api_key: {
        Args: { p_api_key: string; p_provider: string }
        Returns: undefined
      }
      search_role_knowledge: {
        Args: {
          p_categories?: string[]
          p_limit?: number
          p_query_embedding: string
          p_role: string
        }
        Returns: {
          category: string
          content: string
          id: string
          metadata: Json
          similarity: number
          source_title: string
          source_url: string
          tags: string[]
          version: string
        }[]
      }
      search_role_memory: {
        Args: {
          p_limit?: number
          p_memory_types?: string[]
          p_query_embedding: string
          p_role: string
        }
        Returns: {
          confidence_score: number
          content: string
          id: string
          memory_type: string
          metadata: Json
          similarity: number
          tags: string[]
        }[]
      }
      search_session_memory: {
        Args: {
          p_chunk_types?: string[]
          p_limit?: number
          p_query_embedding: string
          p_session_id: string
        }
        Returns: {
          chunk_type: string
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      set_api_key_expiration: {
        Args: { p_expires_at: string; p_provider: string }
        Returns: undefined
      }
      store_user_secret: {
        Args: {
          p_secret_name: string
          p_secret_value: string
          p_user_id: string
        }
        Returns: string
      }
      submit_chunk_feedback: {
        Args: { p_chunk_id: string; p_feedback: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "supervisor"
      communication_tone: "formal" | "friendly" | "neutral" | "provocative"
      message_role:
        | "user"
        | "assistant"
        | "critic"
        | "arbiter"
        | "consultant"
        | "moderator"
        | "advisor"
        | "archivist"
        | "analyst"
        | "webhunter"
        | "promptengineer"
        | "flowregulator"
        | "toolsmith"
        | "guide"
        | "technocritic"
        | "technoarbiter"
        | "technomoderator"
      pattern_category: "planning" | "creative" | "analysis" | "technical"
      verbosity_level: "concise" | "detailed" | "adaptive"
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
      app_role: ["user", "moderator", "admin", "supervisor"],
      communication_tone: ["formal", "friendly", "neutral", "provocative"],
      message_role: [
        "user",
        "assistant",
        "critic",
        "arbiter",
        "consultant",
        "moderator",
        "advisor",
        "archivist",
        "analyst",
        "webhunter",
        "promptengineer",
        "flowregulator",
        "toolsmith",
        "guide",
        "technocritic",
        "technoarbiter",
        "technomoderator",
      ],
      pattern_category: ["planning", "creative", "analysis", "technical"],
      verbosity_level: ["concise", "detailed", "adaptive"],
    },
  },
} as const
