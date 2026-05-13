import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Pencil, Box, Library as LibIcon, SlidersHorizontal } from 'lucide-react';
import {AspLogoAnimated} from "@/components/asp-logo";

const NAV_ITEMS = [
  { to: '/selector', label: 'Selector', testId: 'nav-selector', icon: SlidersHorizontal },
  { to: '/editor', label: 'Editor', testId: 'nav-editor', icon: Pencil },
  { to: '/projection', label: 'Projection', testId: 'nav-projection', icon: Box },
  { to: '/library', label: 'Library', testId: 'nav-library', icon: LibIcon },
];

export default function Layout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-white">
      <header
        className="sticky top-0 z-40 border-b border-zinc-800 bg-[#0b0b0d]/95 backdrop-blur-sm"
        data-testid="app-header"
      >
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" data-testid="brand-link">
              <AspLogoAnimated size={72} animated={true} showText={false} />
            <div className="flex flex-col leading-none">
              <span className="text-[16px] font-mono uppercase tracking-[0.25em] text-amber-500">
                ALEDO HOLDING / GLASS DESIGN APP
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1" data-testid="primary-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                data-testid={item.testId}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
            <span className="pulse-dot" />
            <span data-testid="status-indicator">ONLINE</span>
          </div>
        </div>
        <div className="divider-amber opacity-30" />
      </header>

      <main className="flex-1 flex flex-col" key={location.pathname}>
        {children}
      </main>

      <footer className="border-t border-zinc-900 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between text-[11px] font-mono tracking-[0.18em] text-zinc-500">
        <span data-testid="footer-copy">© ALEDO HOLDING / GLASS DESIGN APPLICATION v2.0</span>
        <span>{new Date().toISOString().slice(0, 10)}</span>
      </footer>
    </div>
  );
}
