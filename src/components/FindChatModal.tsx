import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  MessageSquare,
  Clock,
  Trash2,
  Edit2,
  Check,
  Plus,
  ChevronRight,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { ChatConversation, User } from '../types';
import { isGuestUser } from '../lib/credits';

interface FindChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  isDarkMode: boolean;
  currentUser?: User | null;
  currentUserEmail?: string;
  onOpenAuth?: () => void;
}

export const FindChatModal: React.FC<FindChatModalProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  isDarkMode,
  currentUser,
  currentUserEmail,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setEditingId(null);
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, editingId, onClose]);

  // Filter conversations based on search query and user email
  const filteredConversations = useMemo(() => {
    const normalizedEmail = (currentUserEmail || '').trim().toLowerCase();
    const emailScoped = normalizedEmail
      ? conversations.filter(
          (c) => !c.userEmail || c.userEmail.toLowerCase() === normalizedEmail
        )
      : conversations;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return emailScoped;

    return emailScoped.filter((conv) => {
      // Match title
      if (conv.title.toLowerCase().includes(query)) return true;
      // Match messages content
      return conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, currentUserEmail]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

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

  const handleDelete = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === convId) {
      onDeleteConversation(convId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(convId);
      setTimeout(() => {
        setConfirmDeleteId(null);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="find-chat-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="find-chat-modal-container"
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all animate-scaleUp ${
          isDarkMode
            ? 'bg-[#18191b] border-[#2e2f33] text-gray-100 shadow-black/80'
            : 'bg-white border-gray-200 text-gray-800 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-[#28292c]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <span>Find Old Chats</span>
                  {currentUserEmail && (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono truncate max-w-[180px] sm:max-w-xs">
                      {currentUserEmail}
                    </span>
                  )}
                </h3>
              </div>
            </div>
            <button
              id="close-find-chat-modal"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
            <input
              id="find-chat-search-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask something to Boss Aura"
              className={`w-full pl-10 pr-24 py-2.5 rounded-xl text-sm outline-none transition-all ${
                isDarkMode
                  ? 'bg-[#222326] border border-[#333538] focus:border-blue-500 text-white placeholder-gray-500'
                  : 'bg-gray-100 border border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Action: Start New Chat */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
          isDarkMode ? 'bg-[#1b1c1e] border-[#28292c]' : 'bg-gray-50 border-gray-200'
        }`}>
          <span className="text-xs text-gray-400 font-medium">
            {filteredConversations.length}{' '}
            {filteredConversations.length === 1 ? 'chat found' : 'chats found'}
          </span>
          <button
            id="modal-new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-transparent">
          {isGuestUser(currentUser) ? (
            <div className="py-12 text-center flex flex-col items-center justify-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 border border-amber-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-200 mb-1">
                Guest Mode: No Saved Chats
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mb-5 leading-relaxed">
                When you start with guest, there is no saved chat history. Guest sessions are temporary. Log in with your email account to save, search, and restore your chats anytime.
              </p>
              {onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Log In to Save Chats</span>
                </button>
              )}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <MessageSquare className="w-10 h-10 text-gray-500 mb-3 opacity-40" />
              <p className="text-sm font-medium text-gray-400 mb-1">
                {searchQuery ? `No chats matching "${searchQuery}"` : 'No past chats recorded yet'}
              </p>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                Start chatting with Boss AI and your conversations will be securely indexed here.
              </p>
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
              >
                Start New Chat Now
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingId === conv.id;
              const lastMessage = conv.messages[conv.messages.length - 1];
              const hasImages = conv.messages.some(
                (m) => m.attachedImage || m.mediaType === 'image'
              );

              return (
                <div
                  key={conv.id}
                  id={`chat-item-${conv.id}`}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectConversation(conv.id);
                      onClose();
                    }
                  }}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-blue-950/30 border-blue-600/50 shadow-sm'
                        : 'bg-blue-50/80 border-blue-300 shadow-sm'
                      : isDarkMode
                      ? 'bg-[#1e1f21] hover:bg-[#25262a] border-[#2b2c30]'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      {isEditing ? (
                        <div
                          className="flex items-center gap-2 mb-1.5"
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
                            className={`flex-1 px-2.5 py-1 text-xs rounded-lg border outline-none ${
                              isDarkMode
                                ? 'bg-[#292a2e] border-blue-500 text-white'
                                : 'bg-white border-blue-500 text-gray-900'
                            }`}
                          />
                          <button
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="p-1 rounded bg-gray-600 text-white hover:bg-gray-500"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-blue-400' : 'text-gray-400'
                            }`}
                          />
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isActive
                                ? 'text-blue-400'
                                : isDarkMode
                                ? 'text-gray-100 group-hover:text-white'
                                : 'text-gray-800 group-hover:text-gray-900'
                            }`}
                          >
                            {conv.title}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 shrink-0">
                              Active
                            </span>
                          )}
                          {hasImages && (
                            <span
                              title="Contains images"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 shrink-0 flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      )}

                      {/* Snippet from last message */}
                      {lastMessage && (
                        <p className="text-xs text-gray-400 line-clamp-1 mb-2 font-normal">
                          <span className="font-semibold text-gray-500">
                            {lastMessage.role === 'user' ? 'You: ' : 'Boss AI: '}
                          </span>
                          {lastMessage.content.replace(/[#*`_]/g, '')}
                        </p>
                      )}

                      {/* Footer tags */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(conv.updatedAt || conv.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{conv.messages.length} messages</span>
                      </div>
                    </div>

                    {/* Action buttons (Rename / Delete) */}
                    <div
                      className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
                            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'
                        }`}
                        title="Rename chat"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          confirmDeleteId === conv.id
                            ? 'bg-rose-600 text-white'
                            : isDarkMode
                            ? 'hover:bg-rose-500/20 text-gray-400 hover:text-rose-400'
                            : 'hover:bg-rose-50 text-gray-500 hover:text-rose-600'
                        }`}
                        title={confirmDeleteId === conv.id ? 'Click to confirm delete' : 'Delete chat'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors ml-1" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-4 py-3 border-t flex items-center justify-between text-xs text-gray-500 ${
          isDarkMode ? 'bg-[#151618] border-[#28292c]' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Stored in Cloud Firestore & Local Cache</span>
          </div>
          <span className="text-[11px] text-gray-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[10px]">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
