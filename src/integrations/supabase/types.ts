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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          shop_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          shop_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          shop_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          add_to_cart: number | null
          cta_clicks: number | null
          day: string
          impressions: number | null
          orders: number | null
          revenue: number | null
          shop_id: string
          video_completes: number | null
          video_id: string
          video_starts: number | null
          views: number | null
          widget_id: string
        }
        Insert: {
          add_to_cart?: number | null
          cta_clicks?: number | null
          day: string
          impressions?: number | null
          orders?: number | null
          revenue?: number | null
          shop_id: string
          video_completes?: number | null
          video_id?: string
          video_starts?: number | null
          views?: number | null
          widget_id?: string
        }
        Update: {
          add_to_cart?: number | null
          cta_clicks?: number | null
          day?: string
          impressions?: number | null
          orders?: number | null
          revenue?: number | null
          shop_id?: string
          video_completes?: number | null
          video_id?: string
          video_starts?: number | null
          views?: number | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          amount: number | null
          currency: string | null
          customer_id: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: number
          metadata: Json | null
          occurred_at: string
          product_id: string | null
          session_id: string | null
          shop_id: string
          video_id: string | null
          widget_id: string | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          customer_id?: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: number
          metadata?: Json | null
          occurred_at?: string
          product_id?: string | null
          session_id?: string | null
          shop_id: string
          video_id?: string | null
          widget_id?: string | null
        }
        Update: {
          amount?: number | null
          currency?: string | null
          customer_id?: string | null
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: number
          metadata?: Json | null
          occurred_at?: string
          product_id?: string | null
          session_id?: string | null
          shop_id?: string
          video_id?: string | null
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          position: number | null
          product_id: string
        }
        Insert: {
          collection_id: string
          position?: number | null
          product_id: string
        }
        Update: {
          collection_id?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          handle: string | null
          id: string
          image_url: string | null
          shop_id: string
          shopify_collection_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          shop_id: string
          shopify_collection_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          shop_id?: string
          shopify_collection_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          currency: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          shop_id: string
          shopify_customer_id: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          shop_id: string
          shopify_customer_id?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          shop_id?: string
          shopify_customer_id?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_shopify_id: string | null
          id: string
          payload: Json
          received_at: string
          shop_domain: string
          shop_id: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_shopify_id?: string | null
          id?: string
          payload: Json
          received_at?: string
          shop_domain: string
          shop_id?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_shopify_id?: string | null
          id?: string
          payload?: Json
          received_at?: string
          shop_domain?: string
          shop_id?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_requests_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          shop_id: string
          shopify_invoice_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          shop_id: string
          shopify_invoice_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          shop_id?: string
          shopify_invoice_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          metadata: Json | null
          provider: string | null
          provider_asset_id: string | null
          shop_id: string
          size_bytes: number | null
          url: string
          video_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          metadata?: Json | null
          provider?: string | null
          provider_asset_id?: string | null
          shop_id: string
          size_bytes?: number | null
          url: string
          video_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          metadata?: Json | null
          provider?: string | null
          provider_asset_id?: string | null
          shop_id?: string
          size_bytes?: number | null
          url?: string
          video_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          shop_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          shop_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          shop_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          handle: string | null
          id: string
          image_url: string | null
          inventory: number
          metadata: Json | null
          price_max: number | null
          price_min: number | null
          product_type: string | null
          shop_id: string
          shopify_product_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          inventory?: number
          metadata?: Json | null
          price_max?: number | null
          price_min?: number | null
          product_type?: string | null
          shop_id: string
          shopify_product_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          inventory?: number
          metadata?: Json | null
          price_max?: number | null
          price_min?: number | null
          product_type?: string | null
          shop_id?: string
          shopify_product_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          expires_at: string
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          expires_at: string
          key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          expires_at?: string
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      shop_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          shop_domain: string
          state: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          shop_domain: string
          state: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          shop_domain?: string
          state?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          accent_color: string | null
          analytics_enabled: boolean | null
          brand_color: string | null
          data: Json
          default_language: string | null
          shop_id: string
          storefront_domain: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          analytics_enabled?: boolean | null
          brand_color?: string | null
          data?: Json
          default_language?: string | null
          shop_id: string
          storefront_domain?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          analytics_enabled?: boolean | null
          brand_color?: string | null
          data?: Json
          default_language?: string | null
          shop_id?: string
          storefront_domain?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          access_token_encrypted: string | null
          country_code: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          installed_at: string
          name: string
          plan_name: string | null
          scopes: string | null
          shopify_domain: string
          shopify_shop_id: string | null
          timezone: string | null
          uninstalled_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          installed_at?: string
          name: string
          plan_name?: string | null
          scopes?: string | null
          shopify_domain: string
          shopify_shop_id?: string | null
          timezone?: string | null
          uninstalled_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          installed_at?: string
          name?: string
          plan_name?: string | null
          scopes?: string | null
          shopify_domain?: string
          shopify_shop_id?: string | null
          timezone?: string | null
          uninstalled_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          currency_code: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          impression_limit: number | null
          impression_used: number | null
          overage_impressions: number | null
          pending_charge_id: string | null
          pending_confirmation_url: string | null
          pending_plan: Database["public"]["Enums"]["subscription_plan"] | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          shop_id: string
          shopify_charge_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          test_charge: boolean
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          impression_limit?: number | null
          impression_used?: number | null
          overage_impressions?: number | null
          pending_charge_id?: string | null
          pending_confirmation_url?: string | null
          pending_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          shop_id: string
          shopify_charge_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          test_charge?: boolean
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          impression_limit?: number | null
          impression_used?: number | null
          overage_impressions?: number | null
          pending_charge_id?: string | null
          pending_confirmation_url?: string | null
          pending_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          shop_id?: string
          shopify_charge_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          test_charge?: boolean
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      video_products: {
        Row: {
          cta_label: string | null
          position: number | null
          product_id: string
          timestamp_ms: number | null
          video_id: string
        }
        Insert: {
          cta_label?: string | null
          position?: number | null
          product_id: string
          timestamp_ms?: number | null
          video_id: string
        }
        Update: {
          cta_label?: string | null
          position?: number | null
          product_id?: string
          timestamp_ms?: number | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_products_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          click_count: number
          created_at: string
          description: string | null
          duration_seconds: number | null
          height: number | null
          hls_url: string | null
          id: string
          metadata: Json | null
          mp4_url: string | null
          poster_url: string | null
          provider: string | null
          provider_asset_id: string | null
          shop_id: string
          size_bytes: number | null
          source_url: string | null
          status: Database["public"]["Enums"]["video_status"]
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          click_count?: number
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          height?: number | null
          hls_url?: string | null
          id?: string
          metadata?: Json | null
          mp4_url?: string | null
          poster_url?: string | null
          provider?: string | null
          provider_asset_id?: string | null
          shop_id: string
          size_bytes?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          click_count?: number
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          height?: number | null
          hls_url?: string | null
          id?: string
          metadata?: Json | null
          mp4_url?: string | null
          poster_url?: string | null
          provider?: string | null
          provider_asset_id?: string | null
          shop_id?: string
          size_bytes?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_versions: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          custom_css: string | null
          id: string
          published_at: string | null
          version: number
          widget_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          created_by?: string | null
          custom_css?: string | null
          id?: string
          published_at?: string | null
          version: number
          widget_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          custom_css?: string | null
          id?: string
          published_at?: string | null
          version?: number
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_versions_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_videos: {
        Row: {
          position: number | null
          video_id: string
          widget_id: string
        }
        Insert: {
          position?: number | null
          video_id: string
          widget_id: string
        }
        Update: {
          position?: number | null
          video_id?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_videos_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          custom_css: string | null
          handle: string
          id: string
          name: string
          publish_meta: Json
          published_version_id: string | null
          shop_id: string
          status: Database["public"]["Enums"]["widget_status"]
          type: Database["public"]["Enums"]["widget_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          custom_css?: string | null
          handle: string
          id?: string
          name: string
          publish_meta?: Json
          published_version_id?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["widget_status"]
          type: Database["public"]["Enums"]["widget_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          custom_css?: string | null
          handle?: string
          id?: string
          name?: string
          publish_meta?: Json
          published_version_id?: string | null
          shop_id?: string
          status?: Database["public"]["Enums"]["widget_status"]
          type?: Database["public"]["Enums"]["widget_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "widgets_published_version_fk"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "widget_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widgets_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_shop_access: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
      has_shop_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _shop_id: string
          _user_id: string
        }
        Returns: boolean
      }
      rate_limit_check: {
        Args: { _key: string; _max: number; _window_ms: number }
        Returns: {
          allowed: boolean
          current_count: number
          reset_at: string
        }[]
      }
    }
    Enums: {
      analytics_event_type:
        | "impression"
        | "view"
        | "video_start"
        | "video_complete"
        | "cta_click"
        | "add_to_cart"
        | "buy_now"
        | "order"
        | "engagement"
      app_role: "owner" | "admin" | "staff"
      invoice_status: "pending" | "paid" | "failed" | "refunded"
      media_kind: "video" | "image" | "thumbnail" | "poster"
      notification_kind: "info" | "success" | "warning" | "error"
      subscription_plan: "starter" | "growth" | "scale" | "enterprise"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "frozen"
      video_status: "uploading" | "processing" | "ready" | "failed" | "archived"
      widget_status: "draft" | "published" | "archived"
      widget_type:
        | "homepage_carousel"
        | "story"
        | "floating"
        | "product"
        | "collection"
        | "popup"
        | "hero"
        | "grid"
        | "instagram_feed"
        | "tiktok_feed"
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
      analytics_event_type: [
        "impression",
        "view",
        "video_start",
        "video_complete",
        "cta_click",
        "add_to_cart",
        "buy_now",
        "order",
        "engagement",
      ],
      app_role: ["owner", "admin", "staff"],
      invoice_status: ["pending", "paid", "failed", "refunded"],
      media_kind: ["video", "image", "thumbnail", "poster"],
      notification_kind: ["info", "success", "warning", "error"],
      subscription_plan: ["starter", "growth", "scale", "enterprise"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "frozen",
      ],
      video_status: ["uploading", "processing", "ready", "failed", "archived"],
      widget_status: ["draft", "published", "archived"],
      widget_type: [
        "homepage_carousel",
        "story",
        "floating",
        "product",
        "collection",
        "popup",
        "hero",
        "grid",
        "instagram_feed",
        "tiktok_feed",
      ],
    },
  },
} as const
