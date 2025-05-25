/*
  # Initial Schema Setup for DocChat

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user data
      - Stores user profile information
    
    - `documents`
      - Stores document metadata
      - Links to user profiles
      
    - `document_chunks`
      - Stores document content chunks for AI processing
      - Contains embeddings for semantic search
      
    - `chats`
      - Stores chat history between users and documents
      - Links to documents and users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure access to sensitive data
*/

-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_type text not null,
  file_size integer not null,
  file_path text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create document_chunks table with vector support
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  embedding vector(1536),
  chunk_index integer not null,
  created_at timestamptz default now()
);

-- Create chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chats enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Documents policies
create policy "Users can view their own documents"
  on public.documents
  for select
  using (auth.uid() = user_id);

create policy "Users can create documents"
  on public.documents
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents
  for delete
  using (auth.uid() = user_id);

-- Document chunks policies
create policy "Users can view chunks of their documents"
  on public.document_chunks
  for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

-- Chats policies
create policy "Users can view their own chats"
  on public.chats
  for select
  using (auth.uid() = user_id);

create policy "Users can create chat messages"
  on public.chats
  for insert
  with check (auth.uid() = user_id);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update profile timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.documents
  for each row execute procedure public.handle_updated_at();