import { supabase } from './supabase.ts';
import { User } from '../types/user.ts';

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.session.access_token) {
    throw error ?? new Error('Login failed: no session returned.');
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error('Failed to fetch user profile.');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      name: profile.name,
      avatarUrl: profile.avatar_url,
    },
    token: data.session.access_token,
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ user: User; token: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error || !data.user) {
    throw error ?? new Error('Registration failed: no user returned.');
  }

  // Insert a profile row linked to this auth user
  const { error: insertError } = await supabase.from('profiles').insert([
    {
      id: data.user.id,
      name,
      avatar_url: null,
    },
  ]);

  if (insertError) {
    throw insertError;
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      name,
      avatarUrl: null,
    },
    token: data.session?.access_token ?? null,
  };
}

export async function getCurrentUser(token: string): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw error ?? new Error('Could not retrieve user from token.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error('Failed to fetch profile.');
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: profile.name,
    avatarUrl: profile.avatar_url,
  };
}
