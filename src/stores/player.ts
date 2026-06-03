import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player } from '@/domain/Player';
import { Quest } from '@/domain/Quest';
import { Achievement } from '@/domain/Achievement';
import { getDefaultAchievements } from '@/utils/fixtures';
import { AchievementRarity, AchievementRequirementType, FinancialCategory, QuestPriority, QuestStatus } from '@/enums/finquestEnums';
import { useNotificationStore } from '@/stores/notification';

function clonePlayer(player: Player): Player {
  return Object.assign(Object.create(Object.getPrototypeOf(player)), player);
}

function pushNotification(title: string, message: string): void {
  useNotificationStore.getState().pushNotification({ title, message, variant: 'success' });
}

function notifyQuestCompleted(quest: Quest): void {
  pushNotification('Quest complete!', `You completed "${quest.title}" and earned ${quest.rewards.experience} XP.`);
}

function notifyAchievementUnlocked(achievement: { title: string; description: string; icon: string }): void {
  pushNotification('Achievement unlocked!', `${achievement.icon} ${achievement.title}: ${achievement.description}`);
}

function checkAchievements(player: Player): void {
  const availableAchievements = getDefaultAchievements();

  availableAchievements.forEach((achievement) => {
    if (player.achievements.find((a) => a.id === achievement.id)) return;

    let shouldUnlock = false;

    switch (achievement.id) {
      case 'first-quest':
        shouldUnlock = player.getCompletedQuestsCount() >= 1;
        break;
      case 'quest-veteran':
        shouldUnlock = player.getCompletedQuestsCount() >= 10;
        break;
      case 'level-3':
        shouldUnlock = player.level >= 3;
        break;
      case 'level-5':
        shouldUnlock = player.level >= 5;
        break;
      case 'level-10':
        shouldUnlock = player.level >= 10;
        break;
      case 'saving-hero':
        shouldUnlock = player.getCompletedQuestsByCategory(FinancialCategory.Savings) >= 5;
        break;
      case 'investor':
        shouldUnlock = player.getCompletedQuestsByCategory(FinancialCategory.Investing) >= 3;
        break;
      case 'debt-slayer':
        shouldUnlock = player.getCompletedQuestsByCategory(FinancialCategory.DebtPayoff) >= 3;
        break;
      case 'budget-master':
        shouldUnlock = player.getCompletedQuestsByCategory(FinancialCategory.Budgeting) >= 3;
        break;
      case 'scholar':
        shouldUnlock = player.getCompletedQuestsByCategory(FinancialCategory.Learning) >= 3;
        break;
      case 'coin-collector':
        shouldUnlock = player.coins >= 1000;
        break;
      case 'high-roller':
        shouldUnlock = player.coins >= 5000;
        break;
    }

    if (shouldUnlock) {
      player.unlockAchievement(achievement);
      notifyAchievementUnlocked(achievement);
    }
  });
}

function reconstructQuest(q: Record<string, unknown>): Quest {
  const quest = new Quest({
    id: q.id as string,
    title: q.title as string,
    description: q.description as string,
    category: q.category as FinancialCategory,
    targetAmount: q.targetAmount as number,
    dueDate: new Date(q.dueDate as string),
    priority: q.priority as QuestPriority,
    rewards: q.rewards as { experience: number; coins: number },
  });
  quest.status = q.status as QuestStatus;
  quest.currentAmount = q.currentAmount as number;
  if (q.completedAt) quest.completedAt = new Date(q.completedAt as string);
  quest.createdAt = new Date(q.createdAt as string);
  return quest;
}

function reconstructAchievement(a: Record<string, unknown>): Achievement {
  const ach = new Achievement({
    id: a.id as string,
    title: a.title as string,
    description: a.description as string,
    icon: a.icon as string,
    rarity: a.rarity as AchievementRarity,
    requirements: a.requirements as { type: AchievementRequirementType; value: number },
  });
  if (a.unlockedAt) ach.unlockedAt = new Date(a.unlockedAt as string);
  return ach;
}

function reconstructPlayer(raw: Record<string, unknown>): Player {
  const player = new Player({ id: raw.id as string, username: raw.username as string });
  player.level = raw.level as number;
  player.experience = raw.experience as number;
  player.coins = raw.coins as number;
  player.createdAt = new Date(raw.createdAt as string);
  player.quests = ((raw.quests as unknown[]) || []).map((q) =>
    reconstructQuest(q as Record<string, unknown>)
  );
  player.achievements = ((raw.achievements as unknown[]) || []).map((a) =>
    reconstructAchievement(a as Record<string, unknown>)
  );
  return player;
}

interface QuestUpdates {
  title: string;
  description: string;
  category: FinancialCategory;
  targetAmount: number;
  dueDate: Date;
  priority: QuestPriority;
}

interface PlayerState {
  player: Player | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  initializePlayer: (player: Player) => void;
  addQuest: (quest: Quest) => void;
  editQuest: (questId: string, updates: QuestUpdates) => void;
  deleteQuest: (questId: string) => void;
  updateQuestProgress: (questId: string, amount: number) => void;
  completeQuest: (questId: string) => void;
  setError: (error: string | null) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      player: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      initializePlayer: (player: Player) => set({ player, error: null }),

      addQuest: (quest: Quest) =>
        set((state) => {
          if (!state.player) return state;
          state.player.addQuest(quest);
          return { player: clonePlayer(state.player) };
        }),

      editQuest: (questId, updates) =>
        set((state) => {
          if (!state.player) return state;
          const quest = state.player.quests.find((q) => q.id === questId);
          if (quest) {
            quest.title = updates.title;
            quest.description = updates.description;
            quest.category = updates.category;
            quest.targetAmount = updates.targetAmount;
            quest.dueDate = updates.dueDate;
            quest.priority = updates.priority;
          }
          return { player: clonePlayer(state.player) };
        }),

      deleteQuest: (questId) =>
        set((state) => {
          if (!state.player) return state;
          state.player.quests = state.player.quests.filter((q) => q.id !== questId);
          return { player: clonePlayer(state.player) };
        }),

      updateQuestProgress: (questId: string, amount: number) =>
        set((state) => {
          if (!state.player) return state;
          const quest = state.player.quests.find((q) => q.id === questId);
          if (quest) {
            const wasCompleted = quest.status === QuestStatus.Completed;
            quest.updateProgress(amount);
            if (quest.status === QuestStatus.Completed && !wasCompleted) {
              state.player.addExperience(quest.rewards.experience);
              state.player.coins += quest.rewards.coins;
              notifyQuestCompleted(quest);
              checkAchievements(state.player);
            }
          }
          return { player: clonePlayer(state.player) };
        }),

      completeQuest: (questId: string) =>
        set((state) => {
          if (!state.player) return state;
          const quest = state.player.quests.find((q) => q.id === questId);
          if (quest && quest.status !== QuestStatus.Completed) {
            quest.completeQuest();
            state.player.addExperience(quest.rewards.experience);
            state.player.coins += quest.rewards.coins;
            notifyQuestCompleted(quest);
            checkAchievements(state.player);
          }
          return { player: clonePlayer(state.player) };
        }),

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'finquest-player',
      partialize: (state) => ({ player: state.player }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persisted: unknown, current: PlayerState): PlayerState => {
        try {
          const stored = persisted as Partial<{ player: Record<string, unknown> | null }>;
          if (!stored?.player) return { ...current, _hasHydrated: true };
          return { ...current, player: reconstructPlayer(stored.player), _hasHydrated: true };
        } catch {
          return { ...current, _hasHydrated: true };
        }
      },
    }
  )
);
