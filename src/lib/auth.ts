/**
 * Auth & App Users Sync
 * 
 * This module handles authentication and ensures that every authenticated user
 * has a corresponding row in the app_users table.
 * 
 * When a user signs up or logs in, we check if an app_users row exists.
 * If not, we create one and prompt for display_name.
 */

import { supabase } from './supabase';
import type { AppUser } from '../types';

/**
 * Get the current authenticated user's app_users row
 */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching app user:', error);
    return null;
  }

  return data;
}

/**
 * Create an app_users row for the current authenticated user
 */
export async function createAppUser(displayName: string): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('app_users')
    .insert({
      id: user.id,
      display_name: displayName,
      email: user.email || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating app user:', error);
    throw error;
  }

  return data;
}

/**
 * Update the current user's display name
 */
export async function updateDisplayName(displayName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const { error } = await supabase
    .from('app_users')
    .update({ display_name: displayName })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating display name:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
