import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <footer className="py-4 px-4 text-center border-t border-slate-700 bg-slate-900">
        <p className="text-sm text-slate-400">
          © Created by <span className="text-slate-300 font-medium">Plaki</span>
        </p>
      </footer>
    </div>
  );
}
