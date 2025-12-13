/**
 * Household Management
 * 
 * This module handles all household-related operations:
 * - Creating households
 * - Fetching user's households
 * - Managing household members
 * - Setting active household
 */

import { supabase } from './supabase';
import type { Household, HouseholdMember, AppUser } from '../types';

/**
 * Get all households where the current user is a member
 */
export async function getUserHouseholds(): Promise<Household[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('household_members')
    .select(`
      household_id,
      households (
        id,
        name,
        created_by,
        created_at
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching households:', error);
    return [];
  }

  // Extract households from the joined data
  return (data || [])
    .map((item: any) => item.households)
    .filter(Boolean) as Household[];
}

/**
 * Create a new household and add the creator as an admin member
 */
export async function createHousehold(name: string): Promise<Household> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Create household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      name,
      created_by: user.id,
    })
    .select()
    .single();

  if (householdError) {
    console.error('Error creating household:', householdError);
    throw householdError;
  }

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: 'admin',
    });

  if (memberError) {
    console.error('Error adding household member:', memberError);
    // Try to clean up household if member creation fails
    await supabase.from('households').delete().eq('id', household.id);
    throw memberError;
  }

  return household;
}

/**
 * Get members of a household
 */
export async function getHouseholdMembers(householdId: string): Promise<(HouseholdMember & { app_users: AppUser })[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select(`
      *,
      app_users (
        id,
        display_name,
        email,
        created_at
      )
    `)
    .eq('household_id', householdId);

  if (error) {
    console.error('Error fetching household members:', error);
    return [];
  }

  return (data || []) as (HouseholdMember & { app_users: AppUser })[];
}

/**
 * Find a user by email (case-insensitive, handles null emails)
 */
export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Try exact match first
  let { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error && error.code !== 'PGRST116') {
    // If not found, try case-insensitive search using ilike
    const { data: data2, error: error2 } = await supabase
      .from('app_users')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle();
    
    if (!error2 && data2) {
      return data2;
    }
    
    console.error('Error finding user by email:', error);
    return null;
  }

  if (error && error.code === 'PGRST116') {
    return null;
  }

  return data;
}

/**
 * Create an invitation for a user who hasn't signed up yet
 */
export async function createHouseholdInvitation(householdId: string, email: string): Promise<{ success: boolean; message: string; invitationLink?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to send invitations.',
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // First, check if a pending invitation already exists
  const { data: pendingInvitation } = await supabase
    .from('household_invitations')
    .select('id, status, household_name')
    .eq('household_id', householdId)
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingInvitation) {
    // If a pending invitation exists, return its link
    // If household_name is missing, update it
    if (!pendingInvitation.household_name) {
      const { data: household } = await supabase
        .from('households')
        .select('name')
        .eq('id', householdId)
        .single();
      
      if (household) {
        await supabase
          .from('household_invitations')
          .update({ household_name: household.name })
          .eq('id', pendingInvitation.id);
      }
    }
    
    const invitationLink = `${window.location.origin}/invite/${pendingInvitation.id}`;
    return {
      success: true,
      message: `Invitation already exists. Here's the link:`,
      invitationLink,
    };
  }

  // If no pending invitation, delete ALL existing invitations for this email/household
  // This ensures we can create a new one without duplicate key errors
  const { error: deleteError } = await supabase
    .from('household_invitations')
    .delete()
    .eq('household_id', householdId)
    .eq('email', normalizedEmail);

  if (deleteError) {
    console.warn('Error deleting existing invitations:', deleteError);
    // Continue anyway - the insert might still work if the invitation doesn't exist
  }

  // Get household name - safe because creator can query their own household
  // (RLS allows: created_by = auth.uid())
  const { data: household } = await supabase
    .from('households')
    .select('name')
    .eq('id', householdId)
    .single();

  // Create new invitation with household name stored
  const { data: invitation, error } = await supabase
    .from('household_invitations')
    .insert({
      household_id: householdId,
      email: normalizedEmail,
      invited_by: user.id,
      status: 'pending',
      household_name: household?.name || 'Household', // Store name to avoid queries later
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message || 'Failed to create invitation.',
    };
  }

  // Generate invitation link
  const invitationLink = `${window.location.origin}/invite/${invitation.id}`;

  return {
    success: true,
    message: `Invitation created! Share this link:`,
    invitationLink,
  };
}

/**
 * Add a user to a household by email
 */
export async function addHouseholdMemberByEmail(householdId: string, email: string): Promise<{ success: boolean; message: string; invitationLink?: string }> {
  // Find the user by email
  const user = await findUserByEmail(email);
  
  if (!user) {
    // User doesn't exist - create an invitation instead
    return await createHouseholdInvitation(householdId, email);
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return {
      success: false,
      message: 'User is already a member of this household.',
    };
  }

  // Add user as a member
  try {
    await addHouseholdMember(householdId, user.id, 'member');
    
    // Mark any pending invitations as accepted
    await supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('household_id', householdId)
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'pending');
    
    return {
      success: true,
      message: `${user.display_name} has been added to the household!`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to add user to household.',
    };
  }
}

/**
 * Add a user to a household by user_id (for when you already have the user_id)
 */
export async function addHouseholdMember(householdId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<void> {
  const { error } = await supabase
    .from('household_members')
    .insert({
      household_id: householdId,
      user_id: userId,
      role,
    });

  if (error) {
    // Check if it's a unique constraint violation (user already a member)
    if (error.code === '23505') {
      throw new Error('User is already a member of this household');
    }
    console.error('Error adding household member:', error);
    throw error;
  }
}

/**
 * Update household name (admin only)
 */
export async function updateHouseholdName(householdId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('households')
    .update({ name })
    .eq('id', householdId);

  if (error) {
    console.error('Error updating household name:', error);
    throw error;
  }
}

/**
 * Remove a member from a household
 * Only household creator or admins can remove members (checked in RLS policy)
 * Users can always remove themselves
 */
export async function removeHouseholdMember(householdId: string, userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Check if we're trying to remove the last admin (before deletion)
  const { data: admins } = await supabase
    .from('household_members')
    .select('id, user_id, role')
    .eq('household_id', householdId)
    .eq('role', 'admin');

  if (admins && admins.length === 1) {
    // Check if the member being removed is the last admin
    const memberToRemove = admins.find(a => a.user_id === userId);
    if (memberToRemove) {
      throw new Error('Cannot remove the last admin from the household');
    }
  }

  // Get user's email before removing them (to clean up invitations)
  const { data: appUser } = await supabase
    .from('app_users')
    .select('email')
    .eq('id', userId)
    .single();

  // Remove the member (RLS will check permissions)
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);

  if (error) {
    // Check if it's a permission error
    if (error.code === '42501' || error.message?.includes('permission')) {
      throw new Error('You do not have permission to remove this member');
    }
    console.error('Error removing household member:', error);
    throw error;
  }

  // Clean up any pending invitations for this user's email
  if (appUser?.email) {
    await supabase
      .from('household_invitations')
      .delete()
      .eq('household_id', householdId)
      .eq('email', appUser.email.toLowerCase().trim())
      .eq('status', 'pending');
  }
}

/**
 * Get invitation by ID (public access for accepting invitations)
 */
export async function getInvitationById(invitationId: string) {
  // Simple query - no joins to avoid RLS recursion
  const { data, error } = await supabase
    .from('household_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (error) {
    console.error('Error fetching invitation:', error);
    return null;
  }

  return data;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(invitationId: string): Promise<{ success: boolean; message: string; householdId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to accept an invitation.',
    };
  }

  // Get current app user
  const { data: appUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!appUser) {
    return {
      success: false,
      message: 'User profile not found. Please complete your profile setup first.',
    };
  }

  // Get invitation
  const invitation = await getInvitationById(invitationId);
  
  if (!invitation) {
    return {
      success: false,
      message: 'Invitation not found or has expired.',
    };
  }

  // Check if invitation is still pending
  if (invitation.status !== 'pending') {
    return {
      success: false,
      message: invitation.status === 'accepted' 
        ? 'This invitation has already been accepted.'
        : 'This invitation has expired.',
    };
  }

  // Check if invitation has expired
  if (new Date(invitation.expires_at) < new Date()) {
    return {
      success: false,
      message: 'This invitation has expired.',
    };
  }

  // Check if email matches (case-insensitive)
  const invitationEmail = invitation.email.toLowerCase().trim();
  const userEmail = (appUser.email || user.email || '').toLowerCase().trim();
  
  if (userEmail !== invitationEmail) {
    return {
      success: false,
      message: `This invitation is for ${invitation.email}, but you're logged in as ${user.email || 'a different email'}. Please log in with the correct account.`,
    };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', invitation.household_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    // Mark invitation as accepted even if already a member
    await supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);
    
    return {
      success: true,
      message: 'You are already a member of this household.',
      householdId: invitation.household_id,
    };
  }

  // Add user to household
  try {
    await addHouseholdMember(invitation.household_id, user.id, 'member');
    
    // Mark invitation as accepted
    await supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);
    
    return {
      success: true,
      message: `You've been added to ${invitation.households?.name || 'the household'}!`,
      householdId: invitation.household_id,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to accept invitation.',
    };
  }
}
