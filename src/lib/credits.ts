// Daily Credit & Missions System for BOSS AURA AI
// Missions: 1 hour -> 10 credits, 2 hours -> 20 credits, ... 12 hours -> 120 credits.
// Automatically refreshes daily.

export interface DailyMission {
  hour: number;
  requiredSeconds: number;
  startSeconds: number;
  rewardCredits: number;
  title: string;
  description: string;
}

export const DAILY_MISSIONS: DailyMission[] = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1;
  return {
    hour,
    requiredSeconds: hour * 3600,
    startSeconds: (hour - 1) * 3600,
    rewardCredits: hour * 10,
    title: `Hour ${hour} Active Mission`,
    description: `Spend 1 hour active on AI in Hour ${hour} to earn ${hour * 10} credits`,
  };
});

export interface DailyCreditState {
  credits: number;
  activeSecondsToday: number;
  activeSecondsForCurrentHourlyRefill: number; // Seconds spent towards the next hourly credit claim (0 to 3600)
  hourlyClaimsCount: number; // How many hourly claims this user has redeemed
  claimedMissions: number[]; // array of mission hours claimed today e.g. [1, 2]
  lastActiveDate: string; // YYYY-MM-DD
  lastCheckInDate?: string; // YYYY-MM-DD for 1-per-day check-in
  lastHourlyClaimTimestamp?: number; // timestamp in ms of last hourly claim
  sessionStartedAt?: number; // timestamp when user started using AI
}

export const DAILY_CHECKIN_REWARD = 10;
export const HOURLY_CLAIM_REWARD = 5;
export const HOURLY_REQUIRED_SECONDS = 3600; // 1 hour of active time spent using Boss Aura AI

export const DEFAULT_INITIAL_CREDITS = 0; // Starts with zero credit on guest and signin

export function isGuestUser(user?: { isGuest?: boolean; role?: string; email?: string } | null): boolean {
  if (!user) return true;
  if (user.isGuest) return true;
  if (user.role === 'guest') return true;
  if ((user.email || '').trim().toLowerCase() === 'guest@bossai.com') return true;
  return false;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Guest users do not have Daily Checking. Only signed-in registered users can check in!
export function isDailyCheckInAvailable(state: DailyCreditState, user?: { isGuest?: boolean; role?: string; email?: string } | null): boolean {
  if (isGuestUser(user)) {
    return false; // Guest person does not have daily checking
  }
  const today = getTodayDateString();
  return state.lastCheckInDate !== today;
}

export interface HourlyMissionProgress {
  hour: number;
  requiredSeconds: number; // cumulative end: hour * 3600
  startSeconds: number; // (hour - 1) * 3600
  rewardCredits: number;
  secondsInThisHour: number; // 0 to 3600 seconds in this individual hour
  secondsRemainingInThisHour: number; // 0 to 3600
  progressPercent: number; // 0 to 100
  isClaimed: boolean;
  isEligible: boolean; // completed 3600s in this hour
  isActiveNow: boolean; // currently ticking in this individual hour
  isLocked: boolean; // previous hour not yet finished
}

// Calculate individual timer and status for each hour 1 to 12
export function getHourlyMissionProgress(hour: number, state: DailyCreditState): HourlyMissionProgress {
  const startSeconds = (hour - 1) * 3600;
  const endSeconds = hour * 3600;
  const activeToday = state.activeSecondsToday || 0;
  const secondsInThisHour = Math.min(3600, Math.max(0, activeToday - startSeconds));
  const secondsRemainingInThisHour = Math.max(0, 3600 - secondsInThisHour);
  const progressPercent = Math.min(100, Math.floor((secondsInThisHour / 3600) * 100));
  const isEligible = activeToday >= endSeconds;
  const isClaimed = Array.isArray(state.claimedMissions) && state.claimedMissions.includes(hour);
  const isActiveNow = !isEligible && activeToday >= startSeconds && activeToday < endSeconds;
  const isLocked = activeToday < startSeconds;

  return {
    hour,
    requiredSeconds: endSeconds,
    startSeconds,
    rewardCredits: hour * 10,
    secondsInThisHour,
    secondsRemainingInThisHour,
    progressPercent,
    isClaimed,
    isEligible,
    isActiveNow,
    isLocked,
  };
}

// Every user has their own individual timer. Only when they use the AI for 1 hour (3600s active usage) can they take credit!
export function isHourlyClaimAvailable(state: DailyCreditState): boolean {
  return (state.activeSecondsForCurrentHourlyRefill || 0) >= HOURLY_REQUIRED_SECONDS;
}

// Time remaining for THIS user to spend using the AI before taking credit
export function getTimeUntilNextHourlyClaim(state: DailyCreditState): string {
  const spent = state.activeSecondsForCurrentHourlyRefill || 0;
  const remaining = Math.max(0, HOURLY_REQUIRED_SECONDS - spent);
  if (remaining <= 0) return '00m 00s';
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

// Percentage of 1-hour active usage completed (0% to 100%)
export function getHourlyProgressPercent(state: DailyCreditState): number {
  const spent = state.activeSecondsForCurrentHourlyRefill || 0;
  return Math.min(100, Math.floor((spent / HOURLY_REQUIRED_SECONDS) * 100));
}

export function getCreditStorageKey(userEmailOrId?: string): string {
  const clean = (userEmailOrId || 'guest').trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `boss_aura_user_credits_${clean}`;
}

export function loadDailyCreditState(userEmailOrId?: string): DailyCreditState {
  const today = getTodayDateString();
  const key = getCreditStorageKey(userEmailOrId);
  const saved = localStorage.getItem(key);
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as DailyCreditState;
      // Check if it's a new day -> daily refresh of missions, but preserve active refill progress and total credits!
      if (parsed.lastActiveDate !== today) {
        const refreshedState: DailyCreditState = {
          credits: typeof parsed.credits === 'number' ? parsed.credits : DEFAULT_INITIAL_CREDITS,
          activeSecondsToday: 0,
          activeSecondsForCurrentHourlyRefill: parsed.activeSecondsForCurrentHourlyRefill || 0,
          hourlyClaimsCount: parsed.hourlyClaimsCount || 0,
          claimedMissions: [],
          lastActiveDate: today,
          lastCheckInDate: parsed.lastCheckInDate,
          lastHourlyClaimTimestamp: parsed.lastHourlyClaimTimestamp,
          sessionStartedAt: parsed.sessionStartedAt || Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(refreshedState));
        return refreshedState;
      }
      return {
        credits: typeof parsed.credits === 'number' ? parsed.credits : DEFAULT_INITIAL_CREDITS,
        activeSecondsToday: parsed.activeSecondsToday || 0,
        activeSecondsForCurrentHourlyRefill: parsed.activeSecondsForCurrentHourlyRefill || 0,
        hourlyClaimsCount: parsed.hourlyClaimsCount || 0,
        claimedMissions: Array.isArray(parsed.claimedMissions) ? parsed.claimedMissions : [],
        lastActiveDate: today,
        lastCheckInDate: parsed.lastCheckInDate,
        lastHourlyClaimTimestamp: parsed.lastHourlyClaimTimestamp,
        sessionStartedAt: parsed.sessionStartedAt || Date.now(),
      };
    } catch (e) {
      console.warn('Failed to parse user credit state, resetting', e);
    }
  }

  const initialState: DailyCreditState = {
    credits: DEFAULT_INITIAL_CREDITS,
    activeSecondsToday: 0,
    activeSecondsForCurrentHourlyRefill: 0,
    hourlyClaimsCount: 0,
    claimedMissions: [],
    lastActiveDate: today,
    lastCheckInDate: undefined,
    lastHourlyClaimTimestamp: undefined,
    sessionStartedAt: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(initialState));
  return initialState;
}

export function saveDailyCreditState(state: DailyCreditState, userEmailOrId?: string): void {
  const key = getCreditStorageKey(userEmailOrId);
  localStorage.setItem(key, JSON.stringify(state));
}

export function formatSecondsToDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffSec = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}
