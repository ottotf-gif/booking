export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'customer' | 'stylist' | 'admin';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type NotificationType = 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type NoteType = 'preference' | 'formula' | 'allergy' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          email: string;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          phone?: string | null;
          email: string;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          email?: string;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          duration_minutes: number;
          base_price: number;
          active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          duration_minutes: number;
          base_price: number;
          active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          base_price?: number;
          active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stylists: {
        Row: {
          id: string;
          bio: string | null;
          specializations: string[];
          hourly_rate: number | null;
          commission_rate: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bio?: string | null;
          specializations?: string[];
          hourly_rate?: number | null;
          commission_rate?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bio?: string | null;
          specializations?: string[];
          hourly_rate?: number | null;
          commission_rate?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stylist_services: {
        Row: {
          stylist_id: string;
          service_id: string;
          custom_price: number | null;
        };
        Insert: {
          stylist_id: string;
          service_id: string;
          custom_price?: number | null;
        };
        Update: {
          stylist_id?: string;
          service_id?: string;
          custom_price?: number | null;
        };
      };
      stylist_availability: {
        Row: {
          id: string;
          stylist_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          stylist_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          stylist_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      stylist_time_off: {
        Row: {
          id: string;
          stylist_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          stylist_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          stylist_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          approved?: boolean;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          customer_id: string | null;
          stylist_id: string | null;
          service_id: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          total_amount: number;
          deposit_amount: number;
          payment_status: PaymentStatus;
          payment_intent_id: string | null;
          special_requests: string | null;
          is_guest_booking: boolean;
          guest_name: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          stylist_id?: string | null;
          service_id?: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          total_amount: number;
          deposit_amount?: number;
          payment_status?: PaymentStatus;
          payment_intent_id?: string | null;
          special_requests?: string | null;
          is_guest_booking?: boolean;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          stylist_id?: string | null;
          service_id?: string | null;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          total_amount?: number;
          deposit_amount?: number;
          payment_status?: PaymentStatus;
          payment_intent_id?: string | null;
          special_requests?: string | null;
          is_guest_booking?: boolean;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointment_services: {
        Row: {
          id: string;
          appointment_id: string;
          service_id: string | null;
          price_at_booking: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          service_id?: string | null;
          price_at_booking: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          service_id?: string | null;
          price_at_booking?: number;
          created_at?: string;
        };
      };
      customer_notes: {
        Row: {
          id: string;
          customer_id: string;
          stylist_id: string | null;
          note_type: NoteType;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          stylist_id?: string | null;
          note_type?: NoteType;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          stylist_id?: string | null;
          note_type?: NoteType;
          content?: string;
          created_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          customer_id: string;
          service_id: string;
          preferred_date: string;
          preferred_time_range: string | null;
          notified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          service_id: string;
          preferred_date: string;
          preferred_time_range?: string | null;
          notified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          service_id?: string;
          preferred_date?: string;
          preferred_time_range?: string | null;
          notified?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          template: string;
          status: NotificationStatus;
          scheduled_for: string;
          sent_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          template: string;
          status?: NotificationStatus;
          scheduled_for: string;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          template?: string;
          status?: NotificationStatus;
          scheduled_for?: string;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      business_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      blocked_time_slots: {
        Row: {
          id: string;
          stylist_id: string | null;
          time_slot: string;
          day_of_week: number | null;
          reason: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stylist_id?: string | null;
          time_slot: string;
          day_of_week?: number | null;
          reason?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stylist_id?: string | null;
          time_slot?: string;
          day_of_week?: number | null;
          reason?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
