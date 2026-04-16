// DestinyPlanner — Types Supabase (v2.0)
// Structure conforme à supabase-js v2 (Relationships, Views, Enums requis)
// Normalement généré via : supabase gen types typescript --project-id <id>

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type BusinessProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned'
export type BusinessStepStatus = 'locked' | 'active' | 'completed'
export type BusinessMilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'postponed'
export type BusinessMemberRole = 'owner' | 'editor' | 'viewer'
export type BusinessCommentTargetType = 'step' | 'milestone'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      business_projects: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string
          current_step: number
          status: BusinessProjectStatus
          progress: number
          template_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string
          current_step?: number
          status?: BusinessProjectStatus
          progress?: number
          template_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          current_step?: number
          status?: BusinessProjectStatus
          progress?: number
          template_id?: string | null
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      business_project_steps: {
        Row: {
          id: string
          project_id: string
          step_number: number
          status: BusinessStepStatus
          data: Record<string, unknown>
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          step_number: number
          status?: BusinessStepStatus
          data?: Record<string, unknown>
          completed_at?: string | null
        }
        Update: {
          status?: BusinessStepStatus
          data?: Record<string, unknown>
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'business_project_steps_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'business_projects'
            referencedColumns: ['id']
          }
        ]
      }
      business_milestones: {
        Row: {
          id: string
          project_id: string
          assignee_id: string | null
          title: string
          description: string
          due_date: string | null
          status: BusinessMilestoneStatus
          sort_order: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          assignee_id?: string | null
          title: string
          description?: string
          due_date?: string | null
          status?: BusinessMilestoneStatus
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          title?: string
          description?: string
          due_date?: string | null
          status?: BusinessMilestoneStatus
          sort_order?: number
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_milestones_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'business_projects'
            referencedColumns: ['id']
          }
        ]
      }
      business_actions: {
        Row: {
          id: string
          milestone_id: string
          project_id: string
          created_by: string
          title: string
          date: string
          estimated_minutes: number | null
          done: boolean
          done_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          milestone_id: string
          project_id: string
          created_by: string
          title: string
          date: string
          estimated_minutes?: number | null
          done?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          date?: string
          estimated_minutes?: number | null
          done?: boolean
          done_at?: string | null
        }
        Relationships: []
      }
      business_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: BusinessMemberRole
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: BusinessMemberRole
          joined_at?: string
        }
        Update: {
          role?: BusinessMemberRole
        }
        Relationships: []
      }
      business_detours: {
        Row: {
          id: string
          project_id: string
          reported_by: string
          date: string
          obstacle: string
          impact: string
          adjustment: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          is_systemic: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          reported_by: string
          date: string
          obstacle: string
          impact?: string
          adjustment?: string
          resolved?: boolean
          is_systemic?: boolean
          created_at?: string
        }
        Update: {
          obstacle?: string
          impact?: string
          adjustment?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          is_systemic?: boolean
        }
        Relationships: []
      }
      business_comments: {
        Row: {
          id: string
          project_id: string
          author_id: string
          target_type: BusinessCommentTargetType
          target_id: string
          body: string
          mentioned_user_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          author_id: string
          target_type: BusinessCommentTargetType
          target_id: string
          body: string
          mentioned_user_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          body?: string
          mentioned_user_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      business_invite_tokens: {
        Row: {
          id: string
          project_id: string
          created_by: string
          token: string
          role: Exclude<BusinessMemberRole, 'owner'>
          expires_at: string
          used_by: string | null
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          created_by: string
          token?: string
          role: Exclude<BusinessMemberRole, 'owner'>
          expires_at?: string
          created_at?: string
        }
        Update: {
          used_by?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      community_templates: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string
          template_type: 'product-launch' | 'company-creation' | 'real-estate' | 'partnership' | 'fundraising' | 'client-mission'
          steps_data: Record<string, unknown>
          uses_count: number
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string
          template_type: 'product-launch' | 'company-creation' | 'real-estate' | 'partnership' | 'fundraising' | 'client-mission'
          steps_data: Record<string, unknown>
          uses_count?: number
          created_at?: string
        }
        Update: {
          uses_count?: number
        }
        Relationships: []
      }
      user_push_subscriptions: {
        Row: {
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          updated_at: string
        }
        Insert: {
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          updated_at?: string
        }
        Update: {
          endpoint?: string
          p256dh?: string
          auth?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_project_member: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      has_project_role: {
        Args: { p_project_id: string; p_roles: string[] }
        Returns: boolean
      }
      accept_project_invite: {
        Args: { p_token: string }
        Returns: { project_id: string; role: string }
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Raccourcis de type (Row) ─────────────────────────────────
export type Profile            = Database['public']['Tables']['profiles']['Row']
export type BusinessProject    = Database['public']['Tables']['business_projects']['Row']
export type BusinessProjectStep = Database['public']['Tables']['business_project_steps']['Row']
export type BusinessMilestone  = Database['public']['Tables']['business_milestones']['Row']
export type BusinessAction     = Database['public']['Tables']['business_actions']['Row']
export type BusinessMember     = Database['public']['Tables']['business_members']['Row']
export type BusinessDetour     = Database['public']['Tables']['business_detours']['Row']
export type BusinessComment    = Database['public']['Tables']['business_comments']['Row']
export type UserPushSubscription  = Database['public']['Tables']['user_push_subscriptions']['Row']
export type CommunityTemplate     = Database['public']['Tables']['community_templates']['Row']
export type CommunityTemplateType = CommunityTemplate['template_type']
export type BusinessInviteToken = Database['public']['Tables']['business_invite_tokens']['Row']
