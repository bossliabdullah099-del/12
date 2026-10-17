import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Search,
  Edit2,
  Check,
  X,
  User as UserIcon,
  Code2,
  Coins,
  Compass,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { ActiveTab, User, ChatConversation } from '../types';
import { isGuestUser } from '../lib/credits';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewChat: () => void;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onOpenFindChat: () => void;
  onOpenPolyglot?: () => void;
  onClearHistory: () => void;
  currentUser: User | null;
  isDarkMode: boolean;
  credits?: number;
  onOpenDailyCredits?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenFindChat,
  onOpenPolyglot,
  onClearHistory,
  currentUser,
  isDarkMode,
  credits = 15,
  onOpenDailyCredits,
  onOpenPrivacy,
  onOpenAuth,
}) => {
  const [inlineFilter, setInlineFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = inlineFilter.trim()
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(inlineFilter.toLowerCase()) ||
          c.messages.some((m) =>
            m.content.toLowerCase().includes(inlineFilter.toLowerCase())
          )
      )
    : conversations;

  const handleStartRename = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (convId: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return 'Recent';
    if (hours < 24) return `${hours}h`;
    if (days === 1) return '1d';
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  return (
    <aside
      className={`relative transition-all duration-300 ease-in-out border-r flex flex-col z-30 ${
        isOpen ? 'w-64' : 'w-16'
      } ${
        isDarkMode
          ? 'bg-[#18191a] border-[#2e2f33] text-gray-200'
          : 'bg-[#f0f4f9] border-gray-200 text-gray-800'
      }`}
    >
      {/* Toggle collapse button */}
      <button
        id="sidebar-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute -right-3 top-20 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center text-xs transition-colors z-40 ${
          isDarkMode
            ? 'bg-[#28292a] border-[#3e4042] text-gray-300 hover:bg-[#353739]'
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
        }`}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Top actions: New Chat & Find Chat */}
      <div className="p-3 space-y-2">
        <button
          id="new-chat-btn"
          onClick={() => {
            onNewChat();
            setActiveTab('chat');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
            isDarkMode
              ? 'bg-[#28292a] hover:bg-[#333537] text-white border border-[#37393b]'
              : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
          }`}
          title="Start fresh conversation"
        >
          <Plus className="w-4 h-4 text-blue-500 shrink-0" />
          {isOpen && <span className="truncate">New Chat</span>}
        </button>

        {/* Find Old Chats Button */}
        <button
          id="find-chat-btn"
          onClick={onOpenFindChat}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            isDarkMode
              ? 'hover:bg-white/5 text-gray-300 border border-[#2b2c30]'
              : 'hover:bg-white text-gray-700 border border-gray-200/80 bg-white/60'
          }`}
          title="Find past conversations (Search)"
        >
          <Search className="w-4 h-4 text-amber-500 shrink-0" />
          {isOpen && (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">Find Chats...</span>
              <span className="text-[10px] text-gray-500 font-mono">⌘K</span>
            </div>
          )}
        </button>

        {/* Coding Studio Button (Renamed from Polyglot Studio) */}
        {onOpenPolyglot && (
          <button
            id="sidebar-coding-studio-btn"
            onClick={onOpenPolyglot}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isDarkMode
                ? 'hover:bg-blue-950/30 text-blue-300 border border-blue-500/20 bg-blue-950/10'
                : 'hover:bg-blue-50 text-blue-700 border border-blue-200/80 bg-blue-50/40'
            }`}
            title="Open Coding Studio (Watch Ad or 1 Credit for all 25+ languages)"
          >
            <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
            {isOpen && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate font-semibold">Coding Studio</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 font-mono font-bold text-blue-400">
                  25+
                </span>
              </div>
            )}
          </button>
        )}

        {/* Credit Button */}
        {onOpenDailyCredits && (
          <button
            id="sidebar-daily-credit-btn"
            onClick={onOpenDailyCredits}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isDarkMode
                ? 'hover:bg-amber-950/30 text-amber-300 border border-amber-500/20 bg-amber-950/10'
                : 'hover:bg-amber-50 text-amber-800 border border-amber-200/80 bg-amber-50/40'
            }`}
            title="Credit: Claim hourly refills, daily check-ins, and missions"
          >
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            {isOpen && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate font-semibold">Credit</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 font-mono font-bold text-amber-400">
                  {credits} CR
                </span>
              </div>
            )}
          </button>
        )}
      </div>

      {/* ChatGPT-style Chat History Section */}
      <div className="flex-1 overflow-y-auto px-2 py-3 mt-2">
        {isOpen && (
          <div className="flex items-center justify-between px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>Chat History</span>
              {!isGuestUser(currentUser) && conversations.length > 0 && (
                <span className="text-[10px] font-normal opacity-70">({conversations.length})</span>
              )}
            </span>
            {!isGuestUser(currentUser) && conversations.length > 0 && (
              <button
                onClick={onClearHistory}
                className="opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity"
                title="Clear all chat history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {isOpen && isGuestUser(currentUser) ? (
          /* Guest mode: No saved chat notice */
          <div className="px-2 py-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                isDarkMode
                  ? 'bg-amber-950/20 border-amber-500/25 text-gray-300'
                  : 'bg-amber-50 border-amber-200 text-gray-700'
              } shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Guest Mode: No Saved Chat</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                Whenever a person starts with guest, they have no saved chat history. Guest sessions start clean and are not saved.
              </p>
              {onOpenAuth && (
                <button
                  id="sidebar-guest-login-btn"
                  onClick={onOpenAuth}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Log In to Save Chats</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {isOpen && currentUser?.email && (
              <div className="px-3 pb-2 text-[10px] text-blue-400 font-mono truncate opacity-80" title={`Chat history for ${currentUser.email}`}>
                👤 {currentUser.email}
              </div>
            )}

            {/* Quick inline search when sidebar is open and has chats */}
            {isOpen && conversations.length > 4 && (
              <div className="px-2 mb-2">
                <div className="relative flex items-center">
                  <Search className="w-3 h-3 absolute left-2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={inlineFilter}
                    onChange={(e) => setInlineFilter(e.target.value)}
                    placeholder="Ask something to Boss Aura"
                    className={`w-full pl-6 pr-6 py-1 text-[11px] rounded-lg outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#202124] border border-[#303134] text-gray-200 focus:border-blue-500'
                        : 'bg-white border border-gray-200 text-gray-800 focus:border-blue-500'
                    }`}
                  />
                  {inlineFilter && (
                    <button
                      onClick={() => setInlineFilter('')}
                      className="absolute right-1.5 text-[10px] text-gray-400 hover:text-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {isOpen && conversations.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-gray-400 italic mb-2">No past chats yet</p>
                <button
                  onClick={() => {
                    onNewChat();
                    setActiveTab('chat');
                  }}
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
                >
                  + Start your first chat
                </button>
              </div>
            )}

            {/* Chat List Items */}
            {isOpen && (
              <div className="space-y-0.5">
                {filteredConversations.map((conv) => {
                  const isActive = activeTab === 'chat' && conv.id === activeConversationId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        if (!isEditing) {
                          onSelectConversation(conv.id);
                          setActiveTab('chat');
                        }
                      }}
                      className={`group relative flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? isDarkMode
                            ? 'bg-blue-600/25 text-blue-400 font-semibold'
                            : 'bg-blue-50 text-blue-600 font-semibold'
                          : isDarkMode
                          ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-200/70 hover:text-gray-900'
                      }`}
                      title={conv.title}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className={`w-full px-1.5 py-0.5 text-xs rounded border outline-none ${
                              isDarkMode
                                ? 'bg-[#292a2e] border-blue-500 text-white'
                                : 'bg-white border-blue-500 text-gray-900'
                            }`}
                          />
                          <button
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="p-1 hover:text-emerald-400"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:text-gray-400"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">{conv.title}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {/* Relative time when not hovered */}
                            <span className="text-[10px] text-gray-400 group-hover:hidden">
                              {formatRelativeTime(conv.updatedAt || conv.createdAt)}
                            </span>

                            {/* Hover action icons */}
                            <div className="hidden group-hover:flex items-center gap-0.5">
                              <button
                                onClick={(e) => handleStartRename(conv, e)}
                                className="p-1 hover:text-blue-400 rounded transition-colors"
                                title="Rename"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                }}
                                className="p-1 hover:text-red-400 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* View all in search modal link */}
            {isOpen && conversations.length > 5 && (
              <button
                onClick={onOpenFindChat}
                className="w-full text-center mt-3 py-1.5 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                Find & Search all {conversations.length} chats →
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className={`p-3 border-t ${isDarkMode ? 'border-[#2e2f33]' : 'border-gray-200'}`}>
        {currentUser?.isSuperAdmin ? (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              {isOpen && <span>Admin Root Access</span>}
            </div>
            {isOpen && (
              <div className="text-[10px] text-amber-400/80 mt-1 truncate">
                {currentUser.email}
              </div>
            )}
          </div>
        ) : currentUser?.isGuest ? (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {isOpen && <span className="truncate">Guest Explorer</span>}
              </div>
              {isOpen && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                  Guest
                </span>
              )}
            </div>
            {isOpen && (
              <div className="text-[10px] opacity-70 mt-0.5 truncate text-emerald-400/80">
                Instant Session Active
              </div>
            )}
          </div>
        ) : currentUser ? (
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-400">
              <UserIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {isOpen && <span className="truncate">{currentUser.name}</span>}
            </div>
            {isOpen && (
              <div className="text-[10px] opacity-70 mt-0.5 truncate text-gray-400">
                {currentUser.email}
              </div>
            )}
          </div>
        ) : (
          isOpen && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>BOSS AURA AI · Free</span>
            </div>
          )
        )}

        {/* Privacy Policy Link */}
        {onOpenPrivacy && (
          <div className="mt-2 pt-2 border-t border-gray-500/10 flex items-center justify-between">
            <button
              id="sidebar-privacy-policy-btn"
              onClick={onOpenPrivacy}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:underline ${
                isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
              } ${!isOpen ? 'justify-center w-full' : ''}`}
              title="Privacy Policy · boss-aura.ai.studio"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {isOpen && <span>Privacy Policy</span>}
            </button>
            {isOpen && (
              <span className="text-[9px] opacity-40">v2.4</span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
