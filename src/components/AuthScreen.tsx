import { useState } from 'react';
import { signIn, signUp } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { refreshAppUser } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmationSent(false);
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        // Check if email confirmation is required
        if (result.user && !result.session) {
          // Email confirmation was sent
          setConfirmationSent(true);
        } else {
          // User is immediately confirmed (email confirmation disabled)
          await refreshAppUser();
        }
      } else {
        await signIn(email, password);
        await refreshAppUser();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 Movie Jar</h1>
          <p className="text-slate-400">Your shared movie list</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <div className="flex mb-6">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setConfirmationSent(false);
              }}
              className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                !isSignUp
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setConfirmationSent(false);
              }}
              className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                isSignUp
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {confirmationSent && (
              <div className="bg-blue-900/50 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg text-sm">
                <div className="font-semibold mb-1">📧 Check your email!</div>
                <div>
                  We've sent a confirmation email to <strong>{email}</strong>. 
                  Please click the link in the email to verify your account and continue.
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || confirmationSent}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
