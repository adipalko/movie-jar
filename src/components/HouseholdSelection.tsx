import { useState } from 'react';
import { createHousehold } from '../lib/households';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAuth } from '../contexts/AuthContext';

export function HouseholdSelection() {
  const { households, activeHousehold, setActiveHousehold, refreshHouseholds, loading } = useHousehold();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateHousehold(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const newHousehold = await createHousehold(householdName.trim());
      await refreshHouseholds();
      setActiveHousehold(newHousehold);
      setShowCreateForm(false);
      setHouseholdName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 Movie Jar</h1>
          <p className="text-slate-400">Select or create a household</p>
        </div>

        {households.length === 0 && !showCreateForm && (
          <div className="bg-slate-800 rounded-lg p-6 mb-4 text-center">
            <p className="text-slate-300 mb-4">You don't have any households yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Household
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-slate-800 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">Create Household</h2>
            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <div>
                <label htmlFor="householdName" className="block text-sm font-medium text-slate-300 mb-1">
                  Household Name
                </label>
                <input
                  id="householdName"
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  required
                  minLength={1}
                  maxLength={100}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Adi & Jonathan, Family, Roommates"
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating || !householdName.trim()}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setHouseholdName('');
                    setError(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {households.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white mb-4">Your Households</h2>
            {households.map((household) => (
              <button
                key={household.id}
                onClick={() => setActiveHousehold(household)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  activeHousehold?.id === household.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold">{household.name}</div>
                {activeHousehold?.id === household.id && (
                  <div className="text-sm mt-1 opacity-90">Active</div>
                )}
              </button>
            ))}
          </div>
        )}

        {households.length > 0 && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            + Create New Household
          </button>
        )}
      </div>
    </div>
  );
}
