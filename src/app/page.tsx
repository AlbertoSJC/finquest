'use client';

import { useState } from 'react';
import { Player } from '@/domain/Player';
import { usePlayerStore } from '@/stores/player';
import { createDemoQuests } from '@/utils/fixtures';
import { getPlayerTitle } from '@/utils/titles';
import { ProgressBar } from '@/components/common/ProgressBar';
import Link from 'next/link';

const FEATURES = [
  { icon: '🎯', title: 'Set Financial Quests', desc: 'Turn savings goals, debt payoffs, and investments into trackable quests.' },
  { icon: '⭐', title: 'Level Up', desc: 'Earn XP and level up as you make financial progress. Reach new milestones.' },
  { icon: '🏆', title: 'Unlock Achievements', desc: 'Complete challenges to unlock badges and prove your financial mastery.' },
];

function Onboarding() {
  const { initializePlayer } = usePlayerStore();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (!name) {
      setError('Please enter your hero name.');
      return;
    }
    if (name.length < 2 || name.length > 24) {
      setError('Name must be between 2 and 24 characters.');
      return;
    }
    const player = new Player({ id: `player-${Date.now()}`, username: name });
    createDemoQuests().forEach((q) => player.addQuest(q));
    initializePlayer(player);
  }

  return (
    <main className="onboarding-root">
      <div className="onboarding-card">
        <div className="onboarding-hero">
          <span className="onboarding-logo">⚔️</span>
          <h1 className="onboarding-title">FinQuest</h1>
          <p className="onboarding-subtitle">
            Transform your financial goals into an epic adventure
          </p>
        </div>

        <div className="onboarding-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="onboarding-feature">
              <span className="onboarding-feature-icon">{f.icon}</span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <form className="onboarding-form" onSubmit={handleStart}>
          <label htmlFor="username" className="onboarding-label">
            What should we call you?
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            placeholder="Enter your hero name..."
            className={`form-input onboarding-input${error ? ' input-error' : ''}`}
            autoFocus
            maxLength={24}
          />
          {error && <span className="error-message">{error}</span>}
          <button type="submit" className="btn btn-primary onboarding-cta">
            Begin Your Adventure →
          </button>
        </form>
      </div>
    </main>
  );
}

function WelcomeHome({ player }: { player: Player }) {
  const activeCount = player.getActiveQuestsCount();
  const completedCount = player.getCompletedQuestsCount();
  const xpIntoLevel = player.experience % 1000;

  const stats = [
    { label: 'Level', value: player.level, icon: '⭐' },
    { label: 'Coins', value: player.coins.toLocaleString(), icon: '🪙' },
    { label: 'Active Quests', value: activeCount, icon: '⚔️' },
    { label: 'Completed', value: completedCount, icon: '✅' },
  ];

  return (
    <main>
      <div className="container">
        <div className="home-banner">
          <h1 className="home-banner-title">Welcome back, {player.username}!</h1>
          <div className="home-banner-meta">
            <span className="player-level-badge">Level {player.level}</span>
            <span className="player-title-badge">{getPlayerTitle(player)}</span>
          </div>
          <div className="home-banner-xp-section">
            <div className="home-banner-xp-row">
              <span>Experience</span>
              <span>{xpIntoLevel} / 1000 XP to level {player.level + 1}</span>
            </div>
            <ProgressBar current={xpIntoLevel} target={1000} variant="banner" showLabel={false} />
          </div>
        </div>

        <div className="home-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="home-stat-card">
              <span className="home-stat-icon">{s.icon}</span>
              <span className="home-stat-value">{s.value}</span>
              <span className="home-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="home-nav-cards">
          <Link href="/dashboard" className="home-nav-card">
            <span className="home-nav-card-icon">📊</span>
            <div>
              <strong>Dashboard</strong>
              <p>Visualize your progress and stats</p>
            </div>
          </Link>
          <Link href="/quests" className="home-nav-card home-nav-card-accent">
            <span className="home-nav-card-icon">⚔️</span>
            <div>
              <strong>Quests</strong>
              <p>{activeCount} active quest{activeCount !== 1 ? 's' : ''} awaiting</p>
            </div>
          </Link>
          <Link href="/achievements" className="home-nav-card">
            <span className="home-nav-card-icon">🏆</span>
            <div>
              <strong>Achievements</strong>
              <p>{player.achievements.length} unlocked so far</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const { player, _hasHydrated } = usePlayerStore();

  if (!_hasHydrated) {
    return (
      <main className="onboarding-root">
        <div className="loading">Loading your adventure...</div>
      </main>
    );
  }

  if (!player) return <Onboarding />;

  return <WelcomeHome player={player} />;
}
