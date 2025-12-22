import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';
import { getHouseholdMembers, addHouseholdMemberByEmail, updateHouseholdName, removeHouseholdMember } from '../lib/households';
import { signOut } from '../lib/auth';
import { updateVibesForHousehold } from '../lib/updateVibes';
import type { HouseholdMember, AppUser } from '../types';

interface HouseholdSettingsProps {
  onClose: () => void;
}

interface HouseholdSettingsProps {
  onClose: () => void;
}

export function HouseholdSettings({ onClose }: HouseholdSettingsProps) {
  const { activeHousehold, refreshHouseholds, setActiveHousehold } = useHousehold();
  const { user } = useAuth();
  const [members, setMembers] = useState<(HouseholdMember & { app_users: AppUser })[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string; invitationLink?: string } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState(activeHousehold?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingVibes, setUpdatingVibes] = useState(false);
  const [vibeUpdateMessage, setVibeUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeHousehold) {
      loadMembers();
      setHouseholdName(activeHousehold.name);
    }
  }, [activeHousehold]);

  async function loadMembers() {
    if (!activeHousehold) return;

    setLoading(true);
    try {
      const householdMembers = await getHouseholdMembers(activeHousehold.id);
      setMembers(householdMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeHousehold || !inviteEmail.trim()) return;

    setInviting(true);
    setInviteMessage(null);

    try {
      const result = await addHouseholdMemberByEmail(activeHousehold.id, inviteEmail.trim());
      if (result.success) {
        if (result.invitationLink) {
          // User doesn't exist - invitation was created
          setInviteMessage({ 
            type: 'success', 
            text: `Invitation created! Share this link with ${inviteEmail}:`,
            invitationLink: result.invitationLink
          });
        } else {
          // User exists - was added directly
          setInviteMessage({ type: 'success', text: result.message });
          await loadMembers();
        }
        setInviteEmail('');
      } else {
        setInviteMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setInviteMessage({ type: 'error', text: error.message || 'Failed to invite user' });
    } finally {
      setInviting(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!activeHousehold || !householdName.trim()) return;

    setSavingName(true);
    try {
      await updateHouseholdName(activeHousehold.id, householdName.trim());
      setEditingName(false);
      // Refresh households to get updated name
      await refreshHouseholds();
      // Update active household with new name immediately
      if (activeHousehold) {
        setActiveHousehold({ ...activeHousehold, name: householdName.trim() });
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update household name');
      setHouseholdName(activeHousehold.name); // Reset on error
    } finally {
      setSavingName(false);
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!activeHousehold || !user) return;
    
    if (!confirm('Are you sure you want to remove this member from the household?')) {
      return;
    }

    setRemovingMemberId(memberUserId);
    try {
      await removeHouseholdMember(activeHousehold.id, memberUserId);
      await loadMembers();
      
      // If we removed ourselves, refresh households
      if (memberUserId === user.id) {
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  }

  // Check if current user is admin or creator
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentUserMember?.role === 'admin' || activeHousehold?.created_by === user?.id;

  if (!activeHousehold) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Household Settings</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Household Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Household Name</label>
        {editingName ? (
          <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingName}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {savingName ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setHouseholdName(activeHousehold.name);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-white">{activeHousehold.name}</span>
            <button
              onClick={() => setEditingName(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Invite Member */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Invite Member</h3>
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <label htmlFor="inviteEmail" className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              If they have an account, they'll be added immediately. If not, an invitation link will be created.
            </p>
          </div>

          {inviteMessage && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                inviteMessage.type === 'success'
                  ? 'bg-green-900/50 border border-green-700 text-green-200'
                  : 'bg-red-900/50 border border-red-700 text-red-200'
              }`}
            >
              <div>{inviteMessage.text}</div>
              {inviteMessage.invitationLink && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteMessage.invitationLink}
                      className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteMessage.invitationLink!);
                        alert('Link copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={`mailto:${inviteEmail}?subject=Invitation to join ${activeHousehold?.name} on Movie Jar&body=Hi! I've invited you to join my household "${activeHousehold?.name}" on Movie Jar. Click this link to accept: ${inviteMessage.invitationLink}`}
                    className="block text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    📧 Send Email
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? 'Inviting...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Members List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Members ({members.length})</h3>
        {loading ? (
          <div className="text-slate-400 text-center py-4">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-slate-400 text-center py-4">No members yet</div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">
                    {member.app_users?.display_name || member.app_users?.email || 'Unknown'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {member.app_users?.email || 'No email'}
                    {member.role === 'admin' && (
                      <span className="ml-2 text-blue-400">• Admin</span>
                    )}
                  </div>
                </div>
                {(isAdmin || member.user_id === user?.id) && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={removingMemberId === member.user_id}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {removingMemberId === member.user_id ? 'Removing...' : member.user_id === user?.id ? 'Leave' : 'Remove'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Update Vibes Section */}
        <div className="border-t border-slate-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Movie Data</h3>
          <p className="text-sm text-slate-400 mb-4">
            Update vibe tags for existing movies and TV shows from TMDB keywords.
          </p>
          {vibeUpdateMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              vibeUpdateMessage.type === 'success' 
                ? 'bg-green-600/20 text-green-300' 
                : 'bg-red-600/20 text-red-300'
            }`}>
              {vibeUpdateMessage.text}
            </div>
          )}
          <button
            onClick={async () => {
              if (!activeHousehold) return;
              
              setUpdatingVibes(true);
              setVibeUpdateMessage(null);
              
              try {
                const result = await updateVibesForHousehold(activeHousehold.id);
                if (result.updated > 0 || result.errors === 0) {
                  setVibeUpdateMessage({
                    type: 'success',
                    text: `Successfully updated ${result.updated} ${result.updated === 1 ? 'movie' : 'movies'} with vibe tags.${result.errors > 0 ? ` ${result.errors} errors occurred.` : ''}`
                  });
                } else if (result.updated === 0) {
                  setVibeUpdateMessage({
                    type: 'success',
                    text: 'All movies already have vibe tags, or no movies with TMDB data found.'
                  });
                } else {
                  setVibeUpdateMessage({
                    type: 'error',
                    text: `Updated ${result.updated} movies, but ${result.errors} errors occurred.`
                  });
                }
              } catch (error: any) {
                setVibeUpdateMessage({
                  type: 'error',
                  text: error.message || 'Failed to update vibe tags. Please try again.'
                });
              } finally {
                setUpdatingVibes(false);
              }
            }}
            disabled={updatingVibes || !activeHousehold}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {updatingVibes ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Vibe Tags
              </>
            )}
          </button>
        </div>

        {/* Sign Out Section */}
        <div className="border-t border-slate-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
          <button
            onClick={async () => {
              await signOut();
              onClose();
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

