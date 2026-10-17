import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Gift,
  CheckCircle2,
  Coins,
  ChevronRight,
  Flame,
  Award,
  CalendarCheck,
  Check,
  Lock,
  LogIn,
} from 'lucide-react';
import {
  DailyMission,
  DAILY_MISSIONS,
  DailyCreditState,
  DAILY_CHECKIN_REWARD,
  HOURLY_CLAIM_REWARD,
  HOURLY_REQUIRED_SECONDS,
  formatSecondsToDuration,
  getTimeUntilMidnight,
  isDailyCheckInAvailable,
  isHourlyClaimAvailable,
  getTimeUntilNextHourlyClaim,
  getHourlyProgressPercent,
  getHourlyMissionProgress,
  isGuestUser,
} from '../lib/credits';
import { User } from '../types';

interface DailyCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  creditState: DailyCreditState;
  currentUser?: User | null;
  onClaimMission: (hour: number, reward: number) => void;
  onDailyCheckIn: () => void;
  onHourlyClaim?: () => void;
  onOpenCodingStudio?: () => void;
  onOpenAuth?: () => void;
}

export const DailyCreditModal: React.FC<DailyCreditModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  creditState,
  currentUser,
  onClaimMission,
  onDailyCheckIn,
  onHourlyClaim,
  onOpenCodingStudio,
  onOpenAuth,
}) => {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [hourlyCountdown, setHourlyCountdown] = useState(getTimeUntilNextHourlyClaim(creditState));
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
      setHourlyCountdown(getTimeUntilNextHourlyClaim(creditState));
    }, 1000);
    return () => clearInterval(timer);
  }, [creditState]);

  if (!isOpen) return null;

  const isGuest = isGuestUser(currentUser);
  const canCheckInToday = isDailyCheckInAvailable(creditState, currentUser);
  const canClaimHourly = isHourlyClaimAvailable(creditState);
  const totalRewardsPossible = DAILY_MISSIONS.reduce((sum, m) => sum + m.rewardCredits, 0);
  const totalClaimedCredits = creditState.claimedMissions.reduce(
    (sum, hour) => sum + hour * 10,
    0
  );

  const handleClaim = (mission: DailyMission) => {
    onClaimMission(mission.hour, mission.rewardCredits);
    setClaimedNotice(`+${mission.rewardCredits} Credits Claimed for Hour ${mission.hour}! 🎉`);
    setTimeout(() => setClaimedNotice(null), 3000);
  };

  const handleDailyCheckInClick = () => {
    if (!canCheckInToday) return;
    onDailyCheckIn();
    setClaimedNotice(`+${DAILY_CHECKIN_REWARD} Credits Claimed from Daily Checking! 🎉`);
    setTimeout(() => setClaimedNotice(null), 3500);
  };

  const handleHourlyClaimClick = () => {
    if (!canClaimHourly || !onHourlyClaim) return;
    onHourlyClaim();
    setClaimedNotice(`+${HOURLY_CLAIM_REWARD} Credits Claimed from Hourly Refill! ⚡`);
    setTimeout(() => setClaimedNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#161719] border-[#292a2e] text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? 'border-[#292a2e] bg-[#1a1b1e]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-[2px] shadow-sm">
              <div
                className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  isDarkMode ? 'bg-[#18191c]' : 'bg-white'
                }`}
              >
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Credit</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Hourly +5 CR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Daily +10 CR
                </span>
              </div>
              <p className="text-xs opacity-65">
                Zero initial credit · Earn Credit via Hourly Refills (+5 CR), Daily Checking (+10 CR), and 12-Hour Missions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Balance Tag */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                isDarkMode
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{creditState.credits} Credits</span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-[#25262a] text-gray-300' : 'hover:bg-gray-200 text-gray-700'
              }`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Claim notice alert */}
        {claimedNotice && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
            <Sparkles className="w-4 h-4" />
            <span>{claimedNotice}</span>
          </div>
        )}

        {/* Top Summary Cards: Hourly Refill, Daily Checking, Active Missions */}
        <div className="p-6 border-b border-gray-500/10 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Personalized Hourly Credit Card (1 Hour Active Usage = +5 CR) */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                canClaimHourly
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-blue-950/70 to-cyan-950/50 border-blue-500/50 ring-1 ring-blue-500/40 shadow-md'
                    : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400 shadow-sm'
                  : isDarkMode
                  ? 'bg-[#1c1d22] border-[#2c2d33]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Hourly Active Refill</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    +5 CR / Hour
                  </span>
                </div>

                <div className="text-[11px] font-medium opacity-75 mt-1">
                  Your Active Time on AI:
                </div>
                <div className="text-base font-bold font-mono text-blue-400 flex items-center justify-between">
                  <span>{formatSecondsToDuration(creditState.activeSecondsForCurrentHourlyRefill || 0)}</span>
                  <span className="text-xs font-normal opacity-70">/ 1h 00m</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-500/20 rounded-full h-2 mt-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getHourlyProgressPercent(creditState)}%` }}
                  />
                </div>
              </div>

              <div className="my-2">
                {canClaimHourly ? (
                  <button
                    id="hourly-claim-top-btn"
                    onClick={handleHourlyClaimClick}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] animate-pulse"
                  >
                    <Gift className="w-3.5 h-3.5 animate-bounce" />
                    <span>Take Hourly Credit (+5 CR)!</span>
                  </button>
                ) : (
                  <div className="text-center py-1.5 px-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold">
                    <span>Use AI {hourlyCountdown} more to unlock</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] opacity-65 leading-tight">
                {canClaimHourly
                  ? '🎉 1 full hour completed! Claim your 5 free credits now.'
                  : 'Timer starts when you use Boss AI. Spend 1 hour to take credit.'}
              </div>
            </div>

            {/* 2. Daily Checking Card (10 Credits / Day) - GUEST PERSON DOES NOT HAVE DAILY CHECKING */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                isGuest
                  ? isDarkMode
                    ? 'bg-[#1a1b1f] border-amber-500/30 text-gray-300'
                    : 'bg-amber-50/70 border-amber-300 text-gray-800'
                  : canCheckInToday
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-emerald-950/60 to-teal-950/40 border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-md'
                    : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-sm'
                  : isDarkMode
                  ? 'bg-[#1c1d22] border-[#2c2d33]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daily Checking</span>
                </span>
                {isGuest ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Members Only</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    +{DAILY_CHECKIN_REWARD} CR
                  </span>
                )}
              </div>
              
              <div className="my-1">
                {isGuest ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Locked for Guest Mode</span>
                    </div>
                    <button
                      id="guest-unlock-daily-checking-btn"
                      onClick={() => {
                        onClose();
                        if (onOpenAuth) onOpenAuth();
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In to Unlock (+10 CR)</span>
                    </button>
                  </div>
                ) : canCheckInToday ? (
                  <button
                    id="daily-checking-top-btn"
                    onClick={handleDailyCheckInClick}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                  >
                    <Gift className="w-3.5 h-3.5 animate-bounce" />
                    <span>Check In Now (+{DAILY_CHECKIN_REWARD} CR)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Checked In (+{DAILY_CHECKIN_REWARD} CR)</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] opacity-65 mt-1">
                {isGuest
                  ? 'Guests do not have Daily Checking. Sign in to claim +10 CR daily!'
                  : canCheckInToday
                  ? `Claim your ${DAILY_CHECKIN_REWARD} free credits for today!`
                  : `Next daily checking in ${countdown} (at 00:00)`}
              </div>
            </div>

            {/* 3. Today's Mission Rewards */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDarkMode ? 'bg-[#1c1d22] border-[#2c2d33]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                <span className="font-semibold">Mission Rewards</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400">
                {totalClaimedCredits} / {totalRewardsPossible} CR
              </div>
              <div className="text-[11px] opacity-60 mt-1">
                {creditState.claimedMissions.length} of 12 individual hours claimed
              </div>
            </div>
          </div>

          {/* Dual Action Banner: Hourly Claim & Daily Checking */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hourly Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                canClaimHourly
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-blue-950/70 to-cyan-950/70 border-blue-500/50 text-blue-200 shadow-md'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 text-blue-900 shadow-sm'
                  : isDarkMode
                  ? 'bg-[#191a1e] border-[#2c2d33] text-gray-300'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    canClaimHourly
                      ? 'bg-blue-500 text-white shadow-sm'
                      : isDarkMode
                      ? 'bg-blue-950/80 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">Individual Hourly Timer</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400">
                      {getHourlyProgressPercent(creditState)}%
                    </span>
                  </div>
                  <p className="text-[11px] opacity-75">
                    {canClaimHourly
                      ? '1 Hour completed! Click to take your +5 credits.'
                      : `Used: ${formatSecondsToDuration(creditState.activeSecondsForCurrentHourlyRefill || 0)} (${hourlyCountdown} left to 1 hour)`}
                  </p>
                </div>
              </div>

              {canClaimHourly ? (
                <button
                  onClick={handleHourlyClaimClick}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-500 hover:bg-blue-400 text-white shadow-md transition-all hover:scale-105 shrink-0"
                >
                  Take (+5 CR)
                </button>
              ) : (
                <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-gray-500/10 opacity-70">
                  {hourlyCountdown} left
                </span>
              )}
            </div>

            {/* Daily Banner - GUEST PERSON DOES NOT HAVE DAILY CHECKING */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                isGuest
                  ? isDarkMode
                    ? 'bg-[#191a1e] border-amber-500/30 text-amber-200'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : canCheckInToday
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-emerald-950/70 via-green-950/50 to-teal-950/70 border-emerald-500/40 text-emerald-200 shadow-md'
                    : 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-300 text-emerald-900 shadow-sm'
                  : isDarkMode
                  ? 'bg-[#191a1e] border-[#2c2d33] text-gray-300'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isGuest
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : canCheckInToday
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isDarkMode
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {isGuest ? <Lock className="w-4 h-4 text-amber-400" /> : <CalendarCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">Daily Checking</span>
                    {isGuest ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Sign In Needed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
                        +{DAILY_CHECKIN_REWARD} CR
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-75">
                    {isGuest
                      ? 'Guest person does not have daily checking. Sign in to unlock +10 CR!'
                      : canCheckInToday
                      ? 'Ready for today! +10 free credits.'
                      : `Resets at midnight (${countdown})`}
                  </p>
                </div>
              </div>

              {isGuest ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth?.();
                  }}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black shadow transition-all hover:scale-105 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
              ) : canCheckInToday && (
                <button
                  onClick={handleDailyCheckInClick}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-white shadow transition-all hover:scale-105 shrink-0"
                >
                  Claim (+{DAILY_CHECKIN_REWARD} CR)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Missions List (Every hour time is individual 1 to 12) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Individual Hourly Missions (Hour 1 to 12)</span>
            </div>
            <span className="text-[11px] text-blue-400 font-medium">
              Every hour is individual (1h each)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAILY_MISSIONS.map((mission) => {
              const progress = getHourlyMissionProgress(mission.hour, creditState);
              const {
                isClaimed,
                isEligible,
                isActiveNow,
                isLocked,
                secondsInThisHour,
                secondsRemainingInThisHour,
                progressPercent,
              } = progress;

              return (
                <div
                  key={mission.hour}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isClaimed
                      ? isDarkMode
                        ? 'bg-[#18191d]/50 border-[#26272b] opacity-80'
                        : 'bg-gray-50/70 border-gray-200 opacity-80'
                      : isEligible
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-[#1e2321] to-[#1a2e26] border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/40'
                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                      : isActiveNow
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-blue-950/40 to-cyan-950/30 border-blue-500/50 ring-1 ring-blue-500/30 shadow-md'
                        : 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-blue-300 shadow-sm ring-1 ring-blue-400/30'
                      : isDarkMode
                      ? 'bg-[#1a1b1f] border-[#292a2f] opacity-75'
                      : 'bg-white border-gray-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isClaimed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isEligible
                            ? 'bg-emerald-500 text-white shadow-sm animate-bounce'
                            : isActiveNow
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                            : isDarkMode
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isClaimed ? <CheckCircle2 className="w-4 h-4" /> : `${mission.hour}h`}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight flex items-center gap-1.5 flex-wrap">
                          <span>Hour {mission.hour} Individual Timer</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            +{mission.rewardCredits} CR
                          </span>
                          {isActiveNow && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                              ⚡ Active Now
                            </span>
                          )}
                          {isEligible && !isClaimed && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              🎉 Ready!
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-70 leading-snug mt-0.5">
                          Spend 1 hour active on AI in Hour {mission.hour} to earn {mission.rewardCredits} credits
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Individual 1-Hour Progress Bar */}
                  <div className="my-2 p-2.5 rounded-xl bg-black/20 border border-gray-500/10">
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>Hour {mission.hour}: {formatSecondsToDuration(secondsInThisHour)} / 1h 00m</span>
                      </span>
                      <span className="font-bold text-amber-400">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-500/20 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isClaimed
                            ? 'bg-emerald-500'
                            : isEligible
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : isActiveNow
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                            : 'bg-gray-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] opacity-65 mt-1 font-mono">
                      <span>
                        {isClaimed
                          ? '✅ Hour completed & claimed'
                          : isEligible
                          ? '🎯 1 hour completed! Ready to claim'
                          : isActiveNow
                          ? `⏱️ ${formatSecondsToDuration(secondsRemainingInThisHour)} left in this hour`
                          : `🔒 Starts after Hour ${mission.hour - 1}`}
                      </span>
                      <span>
                        Stage {mission.hour} of 12
                      </span>
                    </div>
                  </div>

                  {/* Button Action */}
                  <div className="pt-1.5 flex justify-end">
                    {isClaimed ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Claimed Today (+{mission.rewardCredits} CR)</span>
                      </span>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleClaim(mission)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 animate-pulse cursor-pointer transition-all hover:scale-105"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Claim Hour {mission.hour} (+{mission.rewardCredits} CR)</span>
                      </button>
                    ) : isActiveNow ? (
                      <div className="text-[11px] font-medium text-blue-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>Ticking: {formatSecondsToDuration(secondsRemainingInThisHour)} left</span>
                      </div>
                    ) : (
                      <span className="text-[11px] opacity-50 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Unlocks in Hour {mission.hour}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & CTA */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 ${
            isDarkMode ? 'border-[#292a2e] bg-[#1a1b1e]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 opacity-80 text-[11px]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Use credits in the <strong>Coding Studio</strong> to generate code with 1 credit or watch an ad for free!
            </span>
          </div>

          {onOpenCodingStudio && (
            <button
              onClick={() => {
                onClose();
                onOpenCodingStudio();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm text-xs"
            >
              <span>Go to Coding Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
