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
      master_partners: {
        Row: {
          coupon_code: string
          cpf: string
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          coupon_code: string
          cpf: string
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          coupon_code?: string
          cpf?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      master_registration_settings: {
        Row: {
          created_at: string
          id: string
          registration_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      partner_coupon_usage: {
        Row: {
          commission_value: number
          created_at: string
          id: string
          paid_at: string | null
          partner_id: string
          payment_receipt_url: string | null
          payment_status: Database["public"]["Enums"]["affiliate_payment_status"]
          payment_value: number
          submission_id: string
        }
        Insert: {
          commission_value?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          partner_id: string
          payment_receipt_url?: string | null
          payment_status?: Database["public"]["Enums"]["affiliate_payment_status"]
          payment_value?: number
          submission_id: string
        }
        Update: {
          commission_value?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          partner_id?: string
          payment_receipt_url?: string | null
          payment_status?: Database["public"]["Enums"]["affiliate_payment_status"]
          payment_value?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_coupon_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "master_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_coupon_usage_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_registration_settings: {
        Row: {
          created_at: string
          id: string
          registration_enabled: boolean
          registration_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          registration_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          registration_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      partner_sales: {
        Row: {
          commission_value: number
          created_at: string
          id: string
          master_commission_value: number
          paid_at: string | null
          partner_id: string
          payment_receipt_url: string | null
          payment_status: string
          sale_value: number
          submission_id: string
        }
        Insert: {
          commission_value?: number
          created_at?: string
          id?: string
          master_commission_value?: number
          paid_at?: string | null
          partner_id: string
          payment_receipt_url?: string | null
          payment_status?: string
          sale_value?: number
          submission_id: string
        }
        Update: {
          commission_value?: number
          created_at?: string
          id?: string
          master_commission_value?: number
          paid_at?: string | null
          partner_id?: string
          payment_receipt_url?: string | null
          payment_status?: string
          sale_value?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_sales_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_sales_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          coupon_code: string
          cpf: string
          created_at: string
          id: string
          master_partner_id: string | null
          nome: string
          pix_key: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          coupon_code: string
          cpf: string
          created_at?: string
          id?: string
          master_partner_id?: string | null
          nome: string
          pix_key: string
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          coupon_code?: string
          cpf?: string
          created_at?: string
          id?: string
          master_partner_id?: string | null
          nome?: string
          pix_key?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_master_partner_id_fkey"
            columns: ["master_partner_id"]
            isOneToOne: false
            referencedRelation: "master_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      password_recovery_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          max_attempts: number
          used: boolean
          user_id: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          max_attempts?: number
          used?: boolean
          user_id: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          payment_id: string | null
          payment_status: string | null
          status_analise: Database["public"]["Enums"]["analysis_status"]
          status_contato: Database["public"]["Enums"]["contact_status"]
          updated_at: string
          url: string
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          payment_id?: string | null
          payment_status?: string | null
          status_analise?: Database["public"]["Enums"]["analysis_status"]
          status_contato?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          url: string
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          payment_id?: string | null
          payment_status?: string | null
          status_analise?: Database["public"]["Enums"]["analysis_status"]
          status_contato?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          url?: string
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_partner_discount: { Args: { coupon_code: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_master_coupon: { Args: { coupon: string }; Returns: boolean }
    }
    Enums: {
      affiliate_payment_status: "pending" | "paid"
      analysis_status: "pendente" | "seguro" | "vulneravel"
      app_role: "admin" | "user" | "master_partner"
      contact_status: "pendente" | "em_contato" | "resolvido"
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
      affiliate_payment_status: ["pending", "paid"],
      analysis_status: ["pendente", "seguro", "vulneravel"],
      app_role: ["admin", "user", "master_partner"],
      contact_status: ["pendente", "em_contato", "resolvido"],
    },
  },
} as const
