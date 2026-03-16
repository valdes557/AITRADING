'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Crown,
  Shield,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { chatAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    plan: string;
  };
  type: 'text' | 'signal' | 'image';
  content: string;
  signalId?: {
    _id: string;
    asset: string;
    direction: 'BUY' | 'SELL';
    entry: number;
    stopLoss: number;
    takeProfit: number;
    timeframe: string;
    strategy: string;
    confidenceScore: number;
    riskReward: number;
    aiExplanation?: string;
  };
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user?.role === 'admin';
  const isPaidUser = ['basic', 'pro', 'vip'].includes(user?.plan || '');
  const hasAccess = isAdmin || isPaidUser;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async (pageNum: number, append = false) => {
    try {
      const { data } = await chatAPI.getMessages({ page: pageNum, limit: 50 });
      if (append) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(pageNum < data.pagination.pages);
    } catch (err: any) {
      if (err?.response?.status !== 403) {
        toast.error('Failed to load messages');
      }
    }
  }, []);

  const fetchOnline = useCallback(async () => {
    try {
      const { data } = await chatAPI.getOnline();
      setTotalSubscribers(data.totalSubscribers);
    } catch {}
  }, []);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(1), fetchOnline()]);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };
    init();

    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await chatAPI.getMessages({ page: 1, limit: 50 });
        setMessages(data.messages);
      } catch {}
    }, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [hasAccess, fetchMessages, fetchOnline, scrollToBottom]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage, true);
    setLoadingMore(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await chatAPI.sendMessage(newMessage.trim());
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
      setTimeout(scrollToBottom, 50);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await chatAPI.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (sender: ChatMessage['sender']) => {
    if (sender.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary-600/20 text-primary-400 font-semibold">
          <Shield className="w-2.5 h-2.5" />
          Admin
        </span>
      );
    }
    const planColors: Record<string, string> = {
      vip: 'bg-warning/15 text-warning',
      pro: 'bg-primary-500/15 text-primary-400',
      basic: 'bg-blue-500/15 text-blue-400',
    };
    return (
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase', planColors[sender.plan] || 'text-dark-500')}>
        {sender.plan}
      </span>
    );
  };

  // Access denied view
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('chat.locked')}</h2>
          <p className="text-dark-400 mb-4">{t('chat.lockedDesc')}</p>
          <a href="/dashboard/settings" className="btn-primary inline-flex items-center gap-2 px-6">
            <Crown className="w-4 h-4" />
            {t('chat.upgrade')}
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            {t('chat.title')}
          </h1>
          <p className="text-dark-400 text-sm">{t('chat.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <Users className="w-4 h-4" />
          <span>{totalSubscribers} {t('chat.members')}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-dark-900/50 border border-dark-700 rounded-xl p-3 sm:p-4 space-y-3"
      >
        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-primary-400 hover:underline flex items-center gap-1 mx-auto"
            >
              {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {t('chat.loadMore')}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-500">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p>{t('chat.empty')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?._id;

            return (
              <div
                key={msg._id}
                className={cn('flex gap-2 sm:gap-3 group', isMe && 'flex-row-reverse')}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold',
                  msg.sender.role === 'admin' ? 'bg-primary-600/30 text-primary-300' : 'bg-dark-700 text-dark-300'
                )}>
                  {msg.sender.avatar ? (
                    <img src={msg.sender.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    msg.sender.name?.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Message Bubble */}
                <div className={cn('max-w-[75%] sm:max-w-[65%]', isMe && 'text-right')}>
                  {/* Sender Info */}
                  <div className={cn('flex items-center gap-2 mb-1', isMe && 'flex-row-reverse')}>
                    <span className="text-xs font-semibold text-dark-200">{msg.sender.name}</span>
                    {getRoleBadge(msg.sender)}
                    <span className="text-[10px] text-dark-600">{formatTime(msg.createdAt)}</span>
                  </div>

                  {/* Message Content */}
                  {msg.type === 'signal' && msg.signalId ? (
                    <div className={cn(
                      'rounded-xl p-3 border',
                      'bg-dark-800 border-primary-500/30'
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        {msg.signalId.direction === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-buy" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-sell" />
                        )}
                        <span className={cn('font-bold text-sm', msg.signalId.direction === 'BUY' ? 'text-buy' : 'text-sell')}>
                          {msg.signalId.direction} {msg.signalId.asset}
                        </span>
                        <span className="text-[10px] text-dark-500">{msg.signalId.timeframe}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-dark-400">Entry: <span className="text-dark-200 font-mono">{msg.signalId.entry}</span></span>
                        <span className="text-dark-400">SL: <span className="text-sell font-mono">{msg.signalId.stopLoss}</span></span>
                        <span className="text-dark-400">TP: <span className="text-buy font-mono">{msg.signalId.takeProfit}</span></span>
                        <span className="text-dark-400">R/R: <span className="text-primary-400 font-mono">{msg.signalId.riskReward}</span></span>
                      </div>
                      <p className="text-xs text-dark-400 mt-2">{msg.signalId.strategy} | {msg.signalId.confidenceScore}%</p>
                    </div>
                  ) : (
                    <div className={cn(
                      'rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                      isMe
                        ? 'bg-primary-600/20 border border-primary-500/20 text-dark-100'
                        : msg.sender.role === 'admin'
                        ? 'bg-primary-900/30 border border-primary-600/20 text-dark-100'
                        : 'bg-dark-800 border border-dark-700 text-dark-200'
                    )}>
                      {msg.content}
                    </div>
                  )}

                  {/* Admin delete */}
                  {isAdmin && !isMe && (
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-dark-600 hover:text-sell"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          className="input-field flex-1"
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="btn-primary flex items-center gap-2 px-4 sm:px-6"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{t('chat.send')}</span>
        </button>
      </div>
    </div>
  );
}
