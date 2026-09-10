export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TableStatus = 'فارغة' | 'مشغولة' | 'محجوزة';
export type OrderStatus = 'جديد' | 'قيد التحضير' | 'جاهز' | 'تم التسليم' | 'ملغي';
export type StaffRole = 'owner' | 'branch_manager' | 'cashier' | 'kitchen';

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          phone: string | null;
          city: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          phone?: string | null;
          city?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          phone?: string | null;
          city?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          city: string;
          address: string | null;
          tables_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          city: string;
          address?: string | null;
          tables_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          city?: string;
          address?: string | null;
          tables_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          branch_id: string;
          table_number: number;
          seats: number;
          qr_token: string;
          status: TableStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          table_number: number;
          seats?: number;
          qr_token?: string;
          status?: TableStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          table_number?: number;
          seats?: number;
          qr_token?: string;
          status?: TableStatus;
          created_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name_ar: string;
          icon: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name_ar: string;
          icon?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name_ar?: string;
          icon?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name_ar: string;
          description_ar: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          is_popular: boolean;
          is_spicy: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name_ar: string;
          description_ar?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          is_popular?: boolean;
          is_spicy?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name_ar?: string;
          description_ar?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          is_popular?: boolean;
          is_spicy?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      item_extras: {
        Row: {
          id: string;
          item_id: string;
          name_ar: string;
          price: number;
        };
        Insert: {
          id?: string;
          item_id: string;
          name_ar: string;
          price?: number;
        };
        Update: {
          id?: string;
          item_id?: string;
          name_ar?: string;
          price?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          branch_id: string;
          table_id: string;
          order_number: string;
          status: OrderStatus;
          total_amount: number;
          customer_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          table_id: string;
          order_number: string;
          status?: OrderStatus;
          total_amount?: number;
          customer_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          table_id?: string;
          order_number?: string;
          status?: OrderStatus;
          total_amount?: number;
          customer_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_id: string | null;
          item_name: string;
          quantity: number;
          unit_price: number;
          selected_extras: Json;
          notes: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id?: string | null;
          item_name: string;
          quantity: number;
          unit_price: number;
          selected_extras?: Json;
          notes?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_id?: string | null;
          item_name?: string;
          quantity?: number;
          unit_price?: number;
          selected_extras?: Json;
          notes?: string | null;
        };
      };
      staff_users: {
        Row: {
          id: string;
          branch_id: string;
          full_name: string;
          role: StaffRole;
          pin_hash: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          branch_id: string;
          full_name: string;
          role: StaffRole;
          pin_hash: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          branch_id?: string;
          full_name?: string;
          role?: StaffRole;
          pin_hash?: string;
          is_active?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      table_status: TableStatus;
      order_status: OrderStatus;
      staff_role: StaffRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
