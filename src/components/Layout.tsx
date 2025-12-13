import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useHousehold } from '../contexts/HouseholdContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { activeHousehold } = useHousehold();
  const location = useLocation();

  if (!activeHousehold) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {children}
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700">
        <div className="max-w-4xl mx-auto flex">
          <Link
            to="/"
            className={`flex-1 py-4 px-4 text-center transition-colors ${
              location.pathname === '/'
                ? 'text-blue-400 border-t-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="text-sm font-medium">Home</div>
          </Link>
          <Link
            to="/watched"
            className={`flex-1 py-4 px-4 text-center transition-colors ${
              location.pathname === '/watched'
                ? 'text-blue-400 border-t-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="text-sm font-medium">Watched</div>
          </Link>
        </div>
      </nav>
    </div>
  );
}
