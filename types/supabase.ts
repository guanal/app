export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          content: string | null;
          created_at: string | null;
          file_path: string | null;
          file_size: number | null;
        };
        Insert: {
          id?: never;
          user_id: string;
          title: string;
          content?: string | null;
          created_at?: string | null;
          file_path?: string | null;
          file_size?: number | null;
        };
        Update: {
          title?: string;
          content?: string | null;
          file_path?: string | null;
          file_size?: number | null;
        };
      };
      chats: {
        Row: {
          id: number;
          document_id: string;
          user_id: string;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: never;
          document_id: string;
          user_id: string;
          content: string;
          created_at?: string | null;
        };
        Update: {
          content?: string;
          document_id?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};