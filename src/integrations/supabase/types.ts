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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bookings: {
        Row: {
          assigned_at: string | null
          assigned_rider: string | null
          assignment_notes: string | null
          booking_code: string | null
          created_at: string
          created_by: string | null
          customer_name: string
          customer_phone: string
          cctv_brand: string | null
          cctv_service: string | null
          guard_type: string | null
          id: string
          inspect_latitude: number | null
          inspect_longitude: number | null
          location: string | null
          model_id: string | null
          manual_order: boolean
          notes: string | null
          order_source: string
          pincode: string | null
          repair_category_id: string | null
          repair_subcategory_id: string | null
          scheduled_date: string | null
          service_type: string
          status: string
          time_slot: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_rider?: string | null
          assignment_notes?: string | null
          booking_code?: string | null
          created_at?: string
          created_by?: string | null
          customer_name: string
          customer_phone: string
          cctv_brand?: string | null
          cctv_service?: string | null
          guard_type?: string | null
          id?: string
          inspect_latitude?: number | null
          inspect_longitude?: number | null
          location?: string | null
          model_id?: string | null
          manual_order?: boolean
          notes?: string | null
          order_source?: string
          pincode?: string | null
          repair_category_id?: string | null
          repair_subcategory_id?: string | null
          scheduled_date?: string | null
          service_type?: string
          status?: string
          time_slot?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_rider?: string | null
          assignment_notes?: string | null
          booking_code?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string
          customer_phone?: string
          cctv_brand?: string | null
          cctv_service?: string | null
          guard_type?: string | null
          id?: string
          inspect_latitude?: number | null
          inspect_longitude?: number | null
          location?: string | null
          model_id?: string | null
          manual_order?: boolean
          notes?: string | null
          order_source?: string
          pincode?: string | null
          repair_category_id?: string | null
          repair_subcategory_id?: string | null
          scheduled_date?: string | null
          service_type?: string
          status?: string
          time_slot?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_repair_category_id_fkey"
            columns: ["repair_category_id"]
            isOneToOne: false
            referencedRelation: "repair_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_repair_subcategory_id_fkey"
            columns: ["repair_subcategory_id"]
            isOneToOne: false
            referencedRelation: "repair_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          full_name: string | null
          inspect_latitude: number | null
          inspect_longitude: number | null
          phone: string | null
          pincode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          inspect_latitude?: number | null
          inspect_longitude?: number | null
          phone?: string | null
          pincode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          inspect_latitude?: number | null
          inspect_longitude?: number | null
          phone?: string | null
          pincode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          gradient: string
          id: string
          image_url: string | null
          letter: string
          name: string
          service_type: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          gradient?: string
          id?: string
          image_url?: string | null
          letter?: string
          name: string
          service_type?: string
          slug?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          gradient?: string
          id?: string
          image_url?: string | null
          letter?: string
          name?: string
          service_type?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      model_repair_services: {
        Row: {
          created_at: string
          id: string
          model_id: string
          price: number
          repair_category_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          price?: number
          repair_category_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          price?: number
          repair_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_repair_services_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_repair_services_repair_category_id_fkey"
            columns: ["repair_category_id"]
            isOneToOne: false
            referencedRelation: "repair_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      model_repair_subcategory_prices: {
        Row: {
          created_at: string
          id: string
          model_id: string
          price: number
          repair_subcategory_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          price?: number
          repair_subcategory_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          price?: number
          repair_subcategory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_repair_subcategory_prices_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_repair_subcategory_prices_repair_subcategory_id_fkey"
            columns: ["repair_subcategory_id"]
            isOneToOne: false
            referencedRelation: "repair_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      model_screen_guards: {
        Row: {
          created_at: string
          guard_type: string
          id: string
          image_url: string | null
          model_id: string
          price: number
        }
        Insert: {
          created_at?: string
          guard_type: string
          id?: string
          image_url?: string | null
          model_id: string
          price?: number
        }
        Update: {
          created_at?: string
          guard_type?: string
          id?: string
          image_url?: string | null
          model_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "model_screen_guards_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          series_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          series_id: string
          slug?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          series_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          service_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          service_type?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          service_type?: string
          sort_order?: number
        }
        Relationships: []
      }
      repair_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "repair_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_guard_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      screen_guard_types: {
        Row: {
          category_id: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "screen_guard_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "screen_guard_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operation" | "technician" | "user"
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
      app_role: ["admin", "operation", "technician", "user"],
    },
  },
} as const
