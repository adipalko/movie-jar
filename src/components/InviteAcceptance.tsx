import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { getInvitationById, acceptInvitation } from '../lib/households';

export function InviteAcceptance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, appUser, loading: authLoading } = useAuth();
  const { refreshHouseholds, setActiveHousehold } = useHousehold();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadInvitation();
    }
  }, [id]);

  async function loadInvitation() {
    if (!id) return;

    setLoading(true);
    try {
      const inv = await getInvitationById(id);
      if (inv) {
        setInvitation(inv);
      } else {
        setMessage({ type: 'error', text: 'Invitation not found.' });
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setMessage({ type: 'error', text: 'Failed to load invitation.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!id) return;

    setAccepting(true);
    setMessage(null);

    try {
      const result = await acceptInvitation(id);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        
        // Refresh households first
        await refreshHouseholds();
        
        if (result.householdId) {
          // Get updated households list and set active household
          const { getUserHouseholds } = await import('../lib/households');
          const households = await getUserHouseholds();
          const joinedHousehold = households.find(h => h.id === result.householdId);
          if (joinedHousehold) {
            setActiveHousehold(joinedHousehold);
          }
          
          // Navigate to home after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to accept invitation.' });
    } finally {
      setAccepting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-slate-300 mb-4">
            You need to sign in to accept this invitation.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invitation Not Found</h1>
          <p className="text-slate-300 mb-4">
            This invitation doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const userEmail = (appUser?.email || user.email || '').toLowerCase().trim();
  const invitationEmail = invitation.email.toLowerCase().trim();
  const emailMatches = userEmail === invitationEmail;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Household Invitation</h1>
        
        <div className="mb-6">
          <p className="text-slate-300 mb-2">
            You've been invited to join:
          </p>
          <p className="text-xl font-semibold text-white mb-4">
            {invitation.household_name || invitation.households?.name || 'Unknown Household'}
          </p>
          
          <div className="bg-slate-700 rounded p-3 mb-4">
            <div className="text-sm text-slate-400 mb-1">Invitation for:</div>
            <div className="text-white">{invitation.email}</div>
            <div className="text-sm text-slate-400 mt-1">Your email:</div>
            <div className="text-white">{user.email || 'Not set'}</div>
          </div>

          {!emailMatches && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-sm mb-4">
              ⚠️ This invitation is for <strong>{invitation.email}</strong>, but you're logged in as <strong>{user.email}</strong>. 
              Please log out and sign in with the correct account to accept this invitation.
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-900/50 border border-green-700 text-green-200'
                : 'bg-red-900/50 border border-red-700 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {emailMatches && invitation.status === 'pending' && (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        )}

        {invitation.status === 'accepted' && (
          <div className="text-center">
            <p className="text-slate-300 mb-4">This invitation has already been accepted.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

