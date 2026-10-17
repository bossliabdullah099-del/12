import React, { useState, useEffect, useRef } from 'react';
import { Shield, X } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { FindChatModal } from './components/FindChatModal';
import { CodingStudioModal } from './components/CodingStudioModal';
import { DailyCreditModal } from './components/DailyCreditModal';
import { CodeSandboxModal } from './components/CodeSandboxModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { DeviceAspectRatioBar, getAutoRatioForWindowWidth } from './components/DeviceAspectRatioBar';
import { User, ActiveTab, ChatMessage, ChatConversation, DeviceAspectRatio } from './types';
import {
  DailyCreditState,
  loadDailyCreditState,
  saveDailyCreditState,
  getTodayDateString,
  DAILY_CHECKIN_REWARD,
  HOURLY_CLAIM_REWARD,
  HOURLY_REQUIRED_SECONDS,
  isHourlyClaimAvailable,
  isGuestUser,
} from './lib/credits';
import {
  saveConversationToFirestore,
  fetchConversationsFromFirestore,
  deleteConversationFromFirestore,
  renameConversationInFirestore,
} from './lib/firebase';

const ADMIN_USER_DEFAULT: User = {
  id: 'admin_boss_01',
  name: 'Ali Abdullah Tariq',
  email: 'bossliabdullah099@gmail.com',
  role: 'admin',
  isSuperAdmin: true,
  modelAccess: 'BOSS AURA AI (Enterprise Unlimited)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
};

// Helper functions to partition chat history strictly by user email ID
const getUserEmailKey = (user: User | null): string => {
  return (user?.email || '').trim().toLowerCase() || 'guest@bossai.com';
};

const getConversationsStorageKey = (email: string): string => {
  return `boss_ai_conversations_${email.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
};

const getActiveConvStorageKey = (email: string): string => {
  return `boss_ai_active_conv_${email.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('boss_ai_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // When a user opens this website in a fresh tab/window: everyone has to login first!
    try {
      const sessionActive = sessionStorage.getItem('boss_ai_session_active');
      if (!sessionActive) {
        return null;
      }
      const saved = localStorage.getItem('boss_ai_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.isGuest && parsed.email !== 'guest@bossai.com' && parsed.role !== 'guest') {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return null; // Visitors must log in first whenever they open this website
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFindChatOpen, setIsFindChatOpen] = useState(false);
  const [isPolyglotOpen, setIsPolyglotOpen] = useState(false);
  const [isDailyCreditOpen, setIsDailyCreditOpen] = useState(false);
  const [creditState, setCreditState] = useState<DailyCreditState>(() => loadDailyCreditState());
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('console.log("Hello from BOSS AURA AI Coding Engine!");');
  const [sandboxLanguage, setSandboxLanguage] = useState('javascript');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState<boolean>(() => {
    try {
      return localStorage.getItem('boss_privacy_notice_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const [currentRatio, setCurrentRatio] = useState<DeviceAspectRatio>(() => {
    try {
      const saved = localStorage.getItem('boss_ai_device_ratio');
      if (saved && ['auto', '16:10', '3:2', '4:3', '19.5:9', '18:9'].includes(saved)) {
        return saved as DeviceAspectRatio;
      }
    } catch {}
    return 'auto';
  });

  const [isFrameMode, setIsFrameMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('boss_ai_frame_mode') === 'true';
    } catch {}
    return false;
  });

  const handleChangeRatio = (ratio: DeviceAspectRatio) => {
    setCurrentRatio(ratio);
    try {
      localStorage.setItem('boss_ai_device_ratio', ratio);
    } catch {}
  };

  const handleToggleFrameMode = () => {
    setIsFrameMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('boss_ai_frame_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Daily active usage time tracker & individual time spent counting
  useEffect(() => {
    const timer = setInterval(() => {
      setCreditState((prev) => {
        const today = getTodayDateString();
        // If the date changed, reset daily cycle but keep individual hourly progress!
        if (prev.lastActiveDate !== today) {
          const refreshed: DailyCreditState = {
            credits: prev.credits,
            activeSecondsToday: 1,
            activeSecondsForCurrentHourlyRefill: (prev.activeSecondsForCurrentHourlyRefill || 0) + 1,
            hourlyClaimsCount: prev.hourlyClaimsCount || 0,
            claimedMissions: [],
            lastActiveDate: today,
            lastCheckInDate: prev.lastCheckInDate,
            lastHourlyClaimTimestamp: prev.lastHourlyClaimTimestamp,
            sessionStartedAt: prev.sessionStartedAt || Date.now(),
          };
          saveDailyCreditState(refreshed, currentUser?.email);
          return refreshed;
        }

        // Increment active time only if window/tab is active
        if (document.hidden) {
          return prev;
        }

        const updated: DailyCreditState = {
          ...prev,
          activeSecondsToday: prev.activeSecondsToday + 1,
          activeSecondsForCurrentHourlyRefill: (prev.activeSecondsForCurrentHourlyRefill || 0) + 1,
        };
        saveDailyCreditState(updated, currentUser?.email);
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser?.email]);

  // Claim Daily Mission Reward
  const handleClaimMission = (hour: number, rewardCredits: number) => {
    setCreditState((prev) => {
      if (prev.claimedMissions.includes(hour)) return prev;
      const updated: DailyCreditState = {
        ...prev,
        credits: prev.credits + rewardCredits,
        claimedMissions: [...prev.claimedMissions, hour],
      };
      saveDailyCreditState(updated, currentUser?.email);
      return updated;
    });
  };

  // Deduct Credit (for Coding Studio: "Write code by 1 credit")
  const handleDeductCredit = (amount = 1): boolean => {
    if (creditState.credits < amount) return false;
    setCreditState((prev) => {
      const updated: DailyCreditState = {
        ...prev,
        credits: Math.max(0, prev.credits - amount),
      };
      saveDailyCreditState(updated, currentUser?.email);
      return updated;
    });
    return true;
  };

  // Daily Checking (Check-in reward: 10 credits once a day)
  // GUEST PERSON DOES NOT HAVE DAILY CHECKING
  const handleDailyCheckIn = () => {
    if (isGuestUser(currentUser)) {
      setIsAuthOpen(true);
      return;
    }
    const today = getTodayDateString();
    if (creditState.lastCheckInDate === today) return;
    setCreditState((prev) => {
      const updated: DailyCreditState = {
        ...prev,
        credits: prev.credits + DAILY_CHECKIN_REWARD,
        lastCheckInDate: today,
      };
      saveDailyCreditState(updated, currentUser?.email);
      return updated;
    });
  };

  // Hourly Credit Refill (Claim reward: 5 credits every 1 hour spent using Boss Aura AI)
  const handleHourlyClaim = () => {
    if (!isHourlyClaimAvailable(creditState)) return;
    setCreditState((prev) => {
      const remainingProgress = Math.max(0, (prev.activeSecondsForCurrentHourlyRefill || 0) - HOURLY_REQUIRED_SECONDS);
      const updated: DailyCreditState = {
        ...prev,
        credits: prev.credits + HOURLY_CLAIM_REWARD,
        activeSecondsForCurrentHourlyRefill: remainingProgress,
        hourlyClaimsCount: (prev.hourlyClaimsCount || 0) + 1,
        lastHourlyClaimTimestamp: Date.now(),
      };
      saveDailyCreditState(updated, currentUser?.email);
      return updated;
    });
  };

  // Active email for partitioning chat history
  const activeEmail = getUserEmailKey(currentUser);
  const loadedEmailRef = useRef<string>(activeEmail);

  // ChatGPT-style Chat Conversations partitioned strictly by each user's email ID
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    // Whenever a person starts with guest, they have NO saved chat!
    if (!currentUser || isGuestUser(currentUser)) {
      return [];
    }
    const key = getConversationsStorageKey(activeEmail);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly ensure conversations belong to this active email
          return parsed.filter((c) => !c.userEmail || c.userEmail.toLowerCase() === activeEmail);
        }
      } catch (e) {}
    }
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    if (!currentUser || isGuestUser(currentUser)) {
      return null;
    }
    return localStorage.getItem(getActiveConvStorageKey(activeEmail)) || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync dark mode
  useEffect(() => {
    localStorage.setItem('boss_ai_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync user profile (guests are never saved to localStorage to ensure login gate triggers)
  useEffect(() => {
    if (currentUser && !isGuestUser(currentUser)) {
      localStorage.setItem('boss_ai_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('boss_ai_user');
    }
  }, [currentUser]);

  // Whenever currentUser or their email changes: partition & load THAT person's old chats!
  useEffect(() => {
    const isGuest = isGuestUser(currentUser);
    const email = getUserEmailKey(currentUser);
    loadedEmailRef.current = email;
    const storageKey = getConversationsStorageKey(email);
    const activeKey = getActiveConvStorageKey(email);

    // 1. Sync credit state for this user / guest account
    setCreditState(loadDailyCreditState(email));

    // CRITICAL: Whenever a person starts with guest, they have NO saved chat!
    if (isGuest) {
      try {
        localStorage.removeItem('boss_ai_conversations_guest_bossai_com');
        localStorage.removeItem('boss_ai_active_conv_guest_bossai_com');
        localStorage.removeItem(storageKey);
        localStorage.removeItem(activeKey);
      } catch (e) {}
      setConversations([]);
      setActiveConversationId(null);
      return;
    }

    // 2. Load local cache for this specific signed-in email
    const localSaved = localStorage.getItem(storageKey);
    let initialConvs: ChatConversation[] = [];
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed)) {
          // Strictly verify ownership by email
          initialConvs = parsed.filter((c) => !c.userEmail || c.userEmail.toLowerCase() === email);
        }
      } catch (e) {}
    }
    setConversations(initialConvs);
    setActiveConversationId(localStorage.getItem(activeKey) || (initialConvs[0]?.id ?? null));

    // 3. Fetch cloud-synced conversations for this user's email ID from Firestore
    let isMounted = true;
    async function loadCloudConversations() {
      try {
        const cloudConvs = await fetchConversationsFromFirestore(currentUser?.id, email);
        if (isMounted && loadedEmailRef.current === email && cloudConvs && cloudConvs.length > 0) {
          setConversations((prev) => {
            const map = new Map<string, ChatConversation>();
            // Keep existing conversations that match this email
            prev
              .filter((c) => !c.userEmail || c.userEmail.toLowerCase() === email)
              .forEach((c) => map.set(c.id, c));

            // Merge cloud conversations for this email
            cloudConvs
              .filter((c) => !c.userEmail || c.userEmail.toLowerCase() === email)
              .forEach((c) => {
                const existing = map.get(c.id);
                if (!existing || (c.updatedAt || 0) >= (existing.updatedAt || 0)) {
                  map.set(c.id, { ...c, userEmail: email });
                }
              });

            const merged = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            localStorage.setItem(storageKey, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        console.warn('Firestore load for email notice:', e);
      }
    }
    loadCloudConversations();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.role, currentUser?.isGuest]);

  // Sync conversations to localStorage partitioned strictly by this user's email ID
  useEffect(() => {
    // Guest mode has NO saved chat - never save guest conversations to localStorage
    if (isGuestUser(currentUser)) {
      return;
    }
    const email = getUserEmailKey(currentUser);
    // CRITICAL GUARD: Only save if state is confirmed to belong to this active email
    if (loadedEmailRef.current === email) {
      const emailFiltered = conversations.filter(
        (c) => !c.userEmail || c.userEmail.toLowerCase() === email
      );
      localStorage.setItem(getConversationsStorageKey(email), JSON.stringify(emailFiltered));
    }
  }, [conversations, currentUser]);

  // Sync active conversation ID partitioned strictly by this user's email ID
  useEffect(() => {
    // Guest mode has NO saved chat
    if (isGuestUser(currentUser)) {
      return;
    }
    const email = getUserEmailKey(currentUser);
    const key = getActiveConvStorageKey(email);
    if (loadedEmailRef.current === email) {
      if (activeConversationId) {
        localStorage.setItem(key, activeConversationId);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [activeConversationId, currentUser]);

  // Global keyboard shortcut for Find Old Chats (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsFindChatOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute active conversation and messages
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const messages = activeConversation ? activeConversation.messages : [];

  // Handle Chat message sending
  const handleSendMessage = async (text: string, attachedImage?: string) => {
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      ...(attachedImage ? { attachedImage } : {}),
    };

    let targetConvId = activeConversationId;
    let currentMessages = messages;

    const userEmail = getUserEmailKey(currentUser);

    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      // Create fresh conversation thread
      targetConvId = `conv_${Date.now()}`;
      const autoTitle = text ? (text.slice(0, 36) + (text.length > 36 ? '...' : '')) : 'Image Discussion';
      const newConv: ChatConversation = {
        id: targetConvId,
        title: autoTitle,
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: currentUser?.id || 'anonymous',
        userEmail: userEmail,
        modelUsed: 'BOSS AURA AI',
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(targetConvId);
      currentMessages = [userMsg];
      if (!isGuestUser(currentUser)) {
        saveConversationToFirestore(newConv, currentUser?.id, userEmail).catch(console.warn);
      }
    } else {
      currentMessages = [...messages, userMsg];
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? { ...c, userEmail: userEmail, messages: currentMessages, updatedAt: Date.now() }
            : c
        )
      );
    }

    setIsLoading(true);

    try {
      // Prepare user's past conversation summaries to ensure the AI has individual memory of their old chats
      const pastChatSummaries = isGuestUser(currentUser)
        ? []
        : conversations.map((c) => ({
            id: c.id,
            title: c.title,
            updatedAt: c.updatedAt,
            messageCount: Array.isArray(c.messages) ? c.messages.length : 0,
            summary: (c.messages || [])
              .slice(-3)
              .map((m) => `${m.role === 'user' ? 'User' : 'Boss AI'}: ${m.content.slice(0, 100)}`)
              .join(' | ')
              .slice(0, 250),
          }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          attachedImage: attachedImage || undefined,
          model: 'BOSS AURA AI',
          history: currentMessages.slice(-8),
          userInfo: {
            email: userEmail,
            name: currentUser?.name || (userEmail.includes('@') ? userEmail.split('@')[0] : 'Creator'),
            role: currentUser?.role || 'user',
            isSuperAdmin: currentUser?.isSuperAdmin || false,
          },
          userPastConversations: pastChatSummaries,
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || 'I have processed your request with BOSS AURA AI.';

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
        modelUsed: data.modelUsed || 'BOSS AURA AI',
        ...(data.generatedImage
          ? { mediaType: 'image' as const, mediaData: data.generatedImage }
          : data.generatedVideo
          ? { mediaType: 'video' as const, mediaData: data.generatedVideo }
          : { mediaType: 'text' as const }),
      };

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === targetConvId) {
            const updatedConv = {
              ...c,
              userEmail: userEmail,
              messages: [...c.messages, assistantMsg],
              updatedAt: Date.now(),
            };
            if (!isGuestUser(currentUser)) {
              saveConversationToFirestore(updatedConv, currentUser?.id, userEmail).catch(console.warn);
            }
            return updatedConv;
          }
          return c;
        });
        return updated;
      });
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `### BOSS AURA AI Response\n\nI encountered an unexpected network interruption. Please try sending your message again.`,
        timestamp: Date.now(),
        modelUsed: 'BOSS AURA AI',
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, errorMsg], updatedAt: Date.now() }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    if (isGuestUser(currentUser)) {
      setConversations([]);
    }
    setActiveTab('chat');
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    setActiveTab('chat');
  };

  const handleDeleteConversation = (convId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
    }
    if (!isGuestUser(currentUser)) {
      deleteConversationFromFirestore(convId).catch(console.warn);
    }
  };

  const handleRenameConversation = (convId: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
    if (!isGuestUser(currentUser)) {
      renameConversationInFirestore(convId, newTitle).catch(console.warn);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      const email = getUserEmailKey(currentUser);
      if (!isGuestUser(currentUser)) {
        conversations.forEach((c) => deleteConversationFromFirestore(c.id).catch(console.warn));
      }
      localStorage.removeItem(getConversationsStorageKey(email));
      localStorage.removeItem(getActiveConvStorageKey(email));
      setConversations([]);
      setActiveConversationId(null);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('boss_ai_session_active');
      localStorage.removeItem('boss_ai_conversations_guest_bossai_com');
      localStorage.removeItem('boss_ai_active_conv_guest_bossai_com');
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem('boss_ai_user');
    setActiveConversationId(null);
    setConversations([]);
    setIsAuthOpen(true);
  };

  // Mandatory Login Gate: Everyone has to login first whenever they open this website for the first time
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#131314] text-white' : 'bg-[#f8fafc] text-gray-900'
        }`}
      >
        {/* Ambient atmospheric backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-purple-600/10 to-emerald-600/15 blur-[130px] pointer-events-none rounded-full" />

        <AuthModal
          isOpen={true}
          canClose={false}
          isFirstTimeGate={true}
          onClose={() => {}}
          onSuccess={(u) => {
            try {
              sessionStorage.setItem('boss_ai_session_active', 'true');
            } catch (e) {}
            if (isGuestUser(u)) {
              try {
                localStorage.removeItem('boss_ai_user');
                localStorage.removeItem('boss_ai_conversations_guest_bossai_com');
                localStorage.removeItem('boss_ai_active_conv_guest_bossai_com');
                localStorage.removeItem(getConversationsStorageKey('guest@bossai.com'));
                localStorage.removeItem(getActiveConvStorageKey('guest@bossai.com'));
              } catch (e) {}
              setConversations([]);
              setActiveConversationId(null);
            } else {
              localStorage.setItem('boss_ai_user', JSON.stringify(u));
            }
            setCurrentUser(u);
            setIsAuthOpen(false);
            const userInitKey = `boss_user_init_${u.id}`;
            if (!localStorage.getItem(userInitKey)) {
              localStorage.setItem(userInitKey, 'true');
              setCreditState((prev) => {
                const updated = {
                  ...prev,
                  credits: 0,
                };
                saveDailyCreditState(updated, u.email || u.id);
                return updated;
              });
            }
          }}
          isDarkMode={isDarkMode}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />

        {/* Privacy Policy Modal accessible from the login screen */}
        {isPrivacyOpen && (
          <PrivacyPolicyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDarkMode ? 'bg-[#131314] text-white' : 'bg-[#f8fafc] text-gray-900'
      }`}
    >
      {/* Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
        onOpenPolyglot={() => setIsPolyglotOpen(true)}
        credits={creditState.credits}
        onOpenDailyCredits={() => setIsDailyCreditOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        currentRatio={currentRatio}
        onChangeRatio={handleChangeRatio}
        isFrameMode={isFrameMode}
        onToggleFrameMode={handleToggleFrameMode}
      />

      {/* Device Screen Aspect Ratio Standards Bar (16:10/3:2 Desktop, 4:3/16:10 Tablet, 19.5:9/18:9 Mobile) */}
      <DeviceAspectRatioBar
        currentRatio={currentRatio}
        onChangeRatio={handleChangeRatio}
        isFrameMode={isFrameMode}
        onToggleFrameMode={handleToggleFrameMode}
        isDarkMode={isDarkMode}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar with ChatGPT-style Chat History & Find Chat */}
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewChat={handleNewChat}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onOpenFindChat={() => setIsFindChatOpen(true)}
          onOpenPolyglot={() => setIsPolyglotOpen(true)}
          onClearHistory={handleClearHistory}
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          credits={creditState.credits}
          onOpenDailyCredits={() => setIsDailyCreditOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Dynamic AI View Canvas with Aspect Ratio Adaptation */}
        <main
          className={`flex-1 flex flex-col overflow-hidden relative ${
            isFrameMode
              ? isDarkMode
                ? 'bg-gradient-to-b from-[#0f1012] to-[#16171a] p-2 sm:p-4 items-center justify-center overflow-auto'
                : 'bg-gradient-to-b from-gray-200 to-gray-300 p-2 sm:p-4 items-center justify-center overflow-auto'
              : 'ai-device-adaptive-view'
          }`}
        >
          {isFrameMode ? (
            <div
              id="ai-device-frame-container"
              className={`device-canvas-frame w-full flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border shadow-2xl transition-all duration-300 ${
                isDarkMode
                  ? 'bg-[#18191c] border-[#383a40] shadow-blue-950/40'
                  : 'bg-white border-gray-300 shadow-2xl'
              } ${
                (currentRatio === 'auto'
                  ? typeof window !== 'undefined' && window.innerWidth >= 1024
                    ? '16:10'
                    : typeof window !== 'undefined' && window.innerWidth >= 768
                    ? '4:3'
                    : '19.5:9'
                  : currentRatio) === '16:10'
                  ? 'max-w-[1280px] aspect-[16/10] max-h-[88vh]'
                  : (currentRatio === 'auto' ? '16:10' : currentRatio) === '3:2'
                  ? 'max-w-[1200px] aspect-[3/2] max-h-[88vh]'
                  : (currentRatio === 'auto' ? '16:10' : currentRatio) === '4:3'
                  ? 'max-w-[960px] aspect-[4/3] max-h-[88vh]'
                  : (currentRatio === 'auto' ? '16:10' : currentRatio) === '19.5:9'
                  ? 'max-w-[430px] aspect-[9/19.5] max-h-[92vh]'
                  : 'max-w-[440px] aspect-[9/18] max-h-[92vh]'
              }`}
            >
              {/* Device Frame Top Notch / Status Bar */}
              <div
                className={`px-4 py-1.5 flex items-center justify-between text-[11px] font-mono border-b shrink-0 select-none ${
                  isDarkMode
                    ? 'bg-[#1e1f23] text-gray-400 border-[#2f3138]'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex items-center gap-1.5 font-sans font-semibold text-xs">
                  <span>
                    {(currentRatio === 'auto'
                      ? typeof window !== 'undefined' && window.innerWidth >= 1024
                        ? '16:10'
                        : typeof window !== 'undefined' && window.innerWidth >= 768
                        ? '4:3'
                        : '19.5:9'
                      : currentRatio) === '16:10'
                      ? '💻 Desktop & Laptop (16:10 · 1280×800)'
                      : (currentRatio === 'auto' ? '16:10' : currentRatio) === '3:2'
                      ? '💻 Desktop / Surface (3:2 · 1200×800)'
                      : (currentRatio === 'auto' ? '16:10' : currentRatio) === '4:3'
                      ? '📟 Tablet / iPad (4:3 · 1152×864)'
                      : (currentRatio === 'auto' ? '16:10' : currentRatio) === '19.5:9'
                      ? '📱 Mobile Phone (19.5:9 · 720×1560)'
                      : '📱 Mobile Phone (18:9 · 720×1440)'}
                  </span>
                </div>
                <button
                  onClick={handleToggleFrameMode}
                  className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-sans font-semibold transition-colors"
                >
                  Full View
                </button>
              </div>

              {/* Inside Canvas */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <ChatView
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  currentUser={currentUser}
                  isDarkMode={isDarkMode}
                  currentConversation={activeConversation}
                  onNewChat={handleNewChat}
                  onOpenFindChat={() => setIsFindChatOpen(true)}
                  onRenameConversation={handleRenameConversation}
                  credits={creditState.credits}
                  onOpenDailyCredits={() => setIsDailyCreditOpen(true)}
                  onDeductCredit={handleDeductCredit}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              </div>
            </div>
          ) : (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              currentUser={currentUser}
              isDarkMode={isDarkMode}
              currentConversation={activeConversation}
              onNewChat={handleNewChat}
              onOpenFindChat={() => setIsFindChatOpen(true)}
              onRenameConversation={handleRenameConversation}
              credits={creditState.credits}
              onOpenDailyCredits={() => setIsDailyCreditOpen(true)}
              onDeductCredit={handleDeductCredit}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Find Old Chats Modal (like ChatGPT) */}
      <FindChatModal
        isOpen={isFindChatOpen}
        onClose={() => setIsFindChatOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        currentUserEmail={activeEmail}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Authentication Modal - For signed in users wishing to switch accounts */}
      <AuthModal
        isOpen={isAuthOpen}
        canClose={true}
        isFirstTimeGate={false}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          try {
            sessionStorage.setItem('boss_ai_session_active', 'true');
          } catch (e) {}
          if (isGuestUser(u)) {
            try {
              localStorage.removeItem('boss_ai_user');
              localStorage.removeItem('boss_ai_conversations_guest_bossai_com');
              localStorage.removeItem('boss_ai_active_conv_guest_bossai_com');
              localStorage.removeItem(getConversationsStorageKey('guest@bossai.com'));
              localStorage.removeItem(getActiveConvStorageKey('guest@bossai.com'));
            } catch (e) {}
            setConversations([]);
            setActiveConversationId(null);
          } else {
            localStorage.setItem('boss_ai_user', JSON.stringify(u));
          }
          setCurrentUser(u);
          setIsAuthOpen(false);
          // Ensure zero starting credits on guest mode and fresh sign in as requested
          const userInitKey = `boss_user_init_${u.id}`;
          if (!localStorage.getItem(userInitKey)) {
            localStorage.setItem(userInitKey, 'true');
            setCreditState((prev) => {
              const updated = {
                ...prev,
                credits: 0, // Zero starting credit
              };
              saveDailyCreditState(updated, u.email || u.id);
              return updated;
            });
          }
        }}
        isDarkMode={isDarkMode}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Super Admin Dashboard Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
      />

      {/* Daily Credit Missions & Daily Checking Modal */}
      <DailyCreditModal
        isOpen={isDailyCreditOpen}
        onClose={() => setIsDailyCreditOpen(false)}
        isDarkMode={isDarkMode}
        creditState={creditState}
        currentUser={currentUser}
        onClaimMission={handleClaimMission}
        onDailyCheckIn={handleDailyCheckIn}
        onHourlyClaim={handleHourlyClaim}
        onOpenCodingStudio={() => setIsPolyglotOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Coding Studio Modal (Renamed from Polyglot Studio) */}
      <CodingStudioModal
        isOpen={isPolyglotOpen}
        onClose={() => setIsPolyglotOpen(false)}
        onSelectPrompt={(p) => {
          handleSendMessage(p);
        }}
        isDarkMode={isDarkMode}
        onOpenSandbox={(code, lang) => {
          setSandboxCode(code);
          setSandboxLanguage(lang);
          setIsSandboxOpen(true);
        }}
        credits={creditState.credits}
        onDeductCredit={handleDeductCredit}
        onOpenDailyCredits={() => setIsDailyCreditOpen(true)}
      />

      {/* Interactive Code Sandbox Modal */}
      <CodeSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        initialCode={sandboxCode}
        initialLanguage={sandboxLanguage}
        isDarkMode={isDarkMode}
        onAskBossAiToFix={(brokenCode, errorMsg) => {
          handleSendMessage(`Please fix this runtime error in my ${sandboxLanguage.toUpperCase()} code:\n\nError: ${errorMsg}\n\nCode:\n\`\`\`${sandboxLanguage}\n${brokenCode}\n\`\`\``);
        }}
      />

      {/* Privacy Policy Pop-up Notice (Toast Banner) */}
      {showPrivacyNotice && (
        <div
          id="privacy-policy-popup-toast"
          className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 p-4 rounded-3xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 ${
            isDarkMode
              ? 'bg-[#18191c]/95 border-blue-500/30 text-gray-100 shadow-blue-950/60'
              : 'bg-white/95 border-blue-200 text-gray-900 shadow-2xl'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-400">
                    Privacy Policy
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                    Notice
                  </span>
                </div>
                <button
                  id="close-privacy-banner-x"
                  onClick={() => {
                    setShowPrivacyNotice(false);
                    localStorage.setItem('boss_privacy_notice_dismissed', 'true');
                  }}
                  className="opacity-50 hover:opacity-100 p-1 rounded-lg transition-opacity"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs leading-relaxed opacity-85">
                Welcome to <strong>Boss Aura AI</strong> (accessible from{' '}
                <a
                  href="https://boss-aura.ai.studio/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline font-semibold"
                >
                  https://boss-aura.ai.studio/
                </a>
                ). Your privacy is extremely important to us. This Privacy Policy document outlines
                the types of personal information that is collected and recorded by Boss Aura AI and
                how we use it. If you have additional questions or require more information about our
                Privacy Policy, do not hesitate to contact us.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="view-full-privacy-policy-btn"
                  onClick={() => setIsPrivacyOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-102 active:scale-98"
                >
                  View Privacy Policy
                </button>
                <button
                  id="dismiss-privacy-notice-btn"
                  onClick={() => {
                    setShowPrivacyNotice(false);
                    localStorage.setItem('boss_privacy_notice_dismissed', 'true');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-200'
                      : 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
