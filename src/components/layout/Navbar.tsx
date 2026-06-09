'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayerStore } from '@/stores/player';
import { useTheme } from '@/hooks/useTheme';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/quests', label: 'Quests' },
  { href: '/achievements', label: 'Achievements' },
];

export function Navbar() {
  const pathname = usePathname();
  const { player } = usePlayerStore();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <span className="navbar-brand-icon">⚔️</span>
          <span className="navbar-brand-name">FinQuest</span>
        </Link>

        <div className="navbar-links">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link${pathname === href ? ' navbar-link-active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="navbar-player">
          {player && (
            <>
              <span className="navbar-level">Lv {player.level}</span>
              <span className="navbar-coins">🪙 {player.coins.toLocaleString()}</span>
            </>
          )}
          <button
            className="navbar-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
}
