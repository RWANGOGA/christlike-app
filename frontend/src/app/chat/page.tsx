'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  AlertCircle, Check, Download, FileText, Image as ImageIcon, Loader2,
  Paperclip, Send, Users, Video, WifiOff, X,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_id: number;
  sender_name?: string;
  content: string;
  content_type: string;
  file_id?: string | null;
  file_url?: string | null;
  file_name?: string;
  file_size?: number;
  file_content_type?: string;
  file_available?: boolean;
  timestamp: string;
  isMine?: boolean;
  kind?: 'message' | 'notice';
  pending?: boolean;
}

interface OnlineUser {
  user_id: number;
  username: string;
  is_admin?: boolean;
}

const CACHE_KEY = 'chat_messages';
const CACHE_LIMIT = 200;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// Derive the websocket URL from the API URL so HTTPS deployments get wss://
// automatically; NEXT_PUBLIC_WS_URL still wins when explicitly set.
function wsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const url = new URL(API_BASE, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.origin;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connState, setConnState] = useState<'connecting' | 'connected' | 'reconnecting' | 'closed'>('connecting');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showOnline, setShowOnline] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  const shouldReconnect = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // Server ids are authoritative: dedupe the live echo against the
      // cached/optimistic copy instead of rendering it twice.
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(next.slice(-CACHE_LIMIT)));
      } catch {
        // Quota exceeded is non-fatal; history still comes from the server.
      }
      return next;
    });
  }, []);

  const replaceMessages = useCallback((msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(msgs.slice(-CACHE_LIMIT)));
    } catch {
      // ignore cache write failures
    }
  }, []);

  // ---- Auth + cached history + server history ---------------------------
  useEffect(() => {
    let cancelled = false;

    const hydrate = async (cached: ChatMessage[]) => {
      try {
        const data = await api.get('/api/chat/history?limit=100');
        if (cancelled) return;
        const server: ChatMessage[] = (data.messages || []).map((m: ChatMessage) => ({ ...m }));
        const serverIds = new Set(server.map((m) => m.id));
        // Keep cached entries the server does not (yet) have, e.g. messages
        // sent while offline that never reached the socket.
        const orphans = cached.filter((m) => m.kind === 'message' && !serverIds.has(m.id));
        setMessages([...orphans, ...server]);
        replaceMessages([...orphans, ...server]);
        setOnlineUsers((await api.get('/api/chat/online')).online || []);
      } catch {
        if (!cancelled) setMessages(cached);
      }
    };

    const init = async () => {
      try {
        const userData = await api.get('/users/me');
        if (cancelled) return;
        setUser(userData);

        let cached: ChatMessage[] = [];
        try {
          cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
        } catch {
          cached = [];
        }
        await hydrate(cached);
      } catch {
        if (!cancelled) router.replace('/');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [router, replaceMessages]);

  // ---- Websocket with exponential-backoff reconnect ----------------------
  useEffect(() => {
    if (!user) return;
    shouldReconnect.current = true;

    const connect = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const socket = new WebSocket(
        `${wsBase()}/ws/chat/${user.id}?token=${encodeURIComponent(token)}`
      );
      wsRef.current = socket;

      socket.onopen = () => {
        setConnState('connected');
        retryDelay.current = 1000;
      };

      socket.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (data.type === 'system') {
          setMessages((prev) => [
            ...prev,
            { id: `sys-${Date.now()}`, kind: 'notice', content: data.content, timestamp: data.timestamp, sender_id: 0, content_type: 'system' },
          ]);
          return;
        }
        if (data.type === 'error') {
          setToast(data.content);
          return;
        }
        if (data.type === 'presence') {
          setOnlineUsers(data.online || []);
          return;
        }
        appendMessage({ ...data, isMine: data.sender_id === user.id });
      };

      socket.onclose = (event) => {
        setConnState('closed');
        wsRef.current = null;
        if (!shouldReconnect.current) return;
        if (event.code === 4001 || event.code === 4003) {
          setToast('Your session expired. Please sign in again.');
          return;
        }
        setConnState('reconnecting');
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
        reconnectTimer.current = setTimeout(connect, retryDelay.current);
      };

      socket.onerror = () => setConnState('reconnecting');
    };

    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [user, appendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshOnline = useCallback(async () => {
    try {
      setOnlineUsers((await api.get('/api/chat/online')).online || []);
    } catch {
      // keep the last known list
    }
  }, []);

  // ---- Sending ----------------------------------------------------------
  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !user) return;
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setToast('Not connected yet. Reconnecting...');
      setConnState('reconnecting');
      return;
    }
    socket.send(JSON.stringify({ content: text }));
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await api.upload('/api/chat/upload', file);
      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setToast('Not connected yet. Reconnecting...');
        setConnState('reconnecting');
        return;
      }
      socket.send(JSON.stringify({ content: '', file_id: data.file_id }));
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ---- Receiving files --------------------------------------------------
  const [busyDownload, setBusyDownload] = useState<string | null>(null);

  const fetchFileBlob = useCallback(async (fileUrl: string): Promise<Blob> => {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`${API_BASE}${fileUrl}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || 'This file is no longer available');
    }
    return res.blob();
  }, []);

  const downloadFile = async (msg: ChatMessage) => {
    if (!msg.file_url) return;
    try {
      setBusyDownload(msg.id);
      const blob = await fetchFileBlob(msg.file_url);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = msg.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setBusyDownload(null);
    }
  };

  // Image/video thumbnails are rendered inline once their bytes are fetched
  // with the auth header (a plain <img src> cannot send Authorization).
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  const isPreviewable = (m: ChatMessage) =>
    !!m.file_url && m.file_available !== false &&
    /^(image|video)\//.test(m.file_content_type || '');

  useEffect(() => {
    const previewable = messages.filter((m) => isPreviewable(m) && !mediaUrls[m.id]);
    if (previewable.length === 0) return;

    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const m of previewable) {
        if (mediaUrls[m.id]) continue;
        try {
          const blob = await fetchFileBlob(m.file_url!);
          if (!cancelled) next[m.id] = window.URL.createObjectURL(blob);
        } catch {
          if (!cancelled) setMessages((prev) => prev.map((p) => (p.id === m.id ? { ...p, file_available: false } : p)));
        }
      }
      if (!cancelled && Object.keys(next).length) {
        setMediaUrls((prev) => ({ ...prev, ...next }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, fetchFileBlob]);

  const getFileIcon = (fileContentType?: string) => {
    if (!fileContentType) return <FileText className="w-5 h-5" />;
    if (fileContentType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (fileContentType.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const connectionLabel =
    connState === 'connected' ? `${onlineUsers.length} online`
    : connState === 'connecting' ? 'Connecting...'
    : connState === 'reconnecting' ? 'Reconnecting...'
    : 'Disconnected';

  const nameFor = (msg: ChatMessage) =>
    msg.isMine ? 'You' : msg.sender_name || `User #${msg.sender_id}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-1px)] bg-[#FBF7EE]">
      {/* Online Users Sidebar (drawer on mobile, fixed column on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#23213A]/10 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          showOnline ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#23213A]/10">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Online
          </h2>
          <button onClick={() => setShowOnline(false)} className="md:hidden p-2 text-[#23213A]/50" aria-label="Close online list">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-4 py-2 text-xs text-[#23213A]/50 border-b border-[#23213A]/5">
          {onlineUsers.length} user{onlineUsers.length === 1 ? '' : 's'} connected
        </p>
        <div className="flex-1 overflow-y-auto">
          {onlineUsers.map((u) => (
            <div
              key={u.user_id}
              className={`w-full text-left px-4 py-3 hover:bg-[#FBF7EE] transition border-b border-[#23213A]/5 ${
                u.user_id === user?.id ? 'bg-[#E3A857]/10' : ''
              }`}
            >
              <p className="text-sm font-medium text-[#23213A] truncate">
                {u.username} {u.user_id === user?.id ? '(you)' : ''}
              </p>
              {u.is_admin && <p className="text-xs text-[#E3A857]">Admin</p>}
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p className="px-4 py-3 text-xs text-[#23213A]/40">No one else is online.</p>
          )}
        </div>
      </aside>

      {showOnline && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setShowOnline(false)} />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white border-b border-[#23213A]/10 px-3 md:px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-[family-name:var(--font-display)] text-base md:text-lg text-[#23213A] truncate">
              Community Chat
            </h3>
            <p className={`text-xs flex items-center gap-1 ${connState === 'connected' ? 'text-[#23213A]/50' : 'text-[#C99595]'}`}>
              {connState !== 'connected' && <WifiOff className="w-3 h-3" />}
              {connectionLabel}
            </p>
          </div>
          <button
            onClick={() => { setShowOnline((v) => !v); refreshOnline(); }}
            className="md:hidden relative p-2 rounded-full bg-[#F5EFE6] text-[#5A4A4A]"
            aria-label="Show online users"
          >
            <Users className="w-5 h-5" />
            {onlineUsers.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#E3A857] text-[10px] text-white flex items-center justify-center">
                {onlineUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {messages.map((msg) =>
            msg.kind === 'notice' ? (
              <p key={msg.id} className="text-center text-xs text-[#23213A]/40">{msg.content}</p>
            ) : (
              <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2.5 ${
                    msg.isMine
                      ? 'bg-[#23213A] text-[#FBF7EE]'
                      : 'bg-white border border-[#23213A]/10 text-[#23213A]'
                  }`}
                >
                  {msg.content_type === 'file' && msg.file_url && (
                    msg.file_available === false ? (
                      <div className="mb-2 p-3 rounded-lg bg-black/5 flex items-center gap-2 text-xs opacity-70">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        This file is no longer available
                      </div>
                    ) : (
                      <div className="mb-2">
                        {mediaUrls[msg.id] && (msg.file_content_type || '').startsWith('image/') ? (
                          <img
                            src={mediaUrls[msg.id]}
                            alt={msg.file_name || ''}
                            className="rounded-lg max-h-64 w-full object-cover mb-2"
                          />
                        ) : mediaUrls[msg.id] && (msg.file_content_type || '').startsWith('video/') ? (
                          <video src={mediaUrls[msg.id]} controls className="rounded-lg max-h-64 w-full mb-2" />
                        ) : (
                          <div className={`p-3 rounded-lg flex items-center gap-3 ${msg.isMine ? 'bg-white/10' : 'bg-[#F5EFE6]'}`}>
                            {getFileIcon(msg.file_content_type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{msg.file_name}</p>
                              <p className="text-xs opacity-70">{formatSize(msg.file_size)}</p>
                            </div>
                            <button
                              onClick={() => downloadFile(msg)}
                              disabled={busyDownload === msg.id}
                              className="p-2 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                              aria-label={`Download ${msg.file_name}`}
                            >
                              {busyDownload === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                  <p className={`text-xs mt-1.5 ${msg.isMine ? 'text-[#FBF7EE]/50' : 'text-[#23213A]/40'}`}>
                    {nameFor(msg)} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.isMine && <Check className="w-3 h-3 inline ml-1" />}
                  </p>
                </div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-[#23213A]/10 p-3 md:p-4">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp3,.wav,.ogg,.txt,.md,.json"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || connState !== 'connected'}
              className="p-3 md:p-3 rounded-full bg-[#F5EFE6] text-[#5A4A4A] hover:bg-[#E3A857]/10 transition disabled:opacity-50 flex-shrink-0 min-w-11 min-h-11"
              aria-label="Attach file"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={connState === 'connected' ? 'Type a message...' : 'Reconnecting...'}
              className="flex-1 px-4 py-3 rounded-full border border-[#23213A]/15 text-sm focus:outline-none focus:border-[#D4A5A5] focus:ring-1 focus:ring-[#D4A5A5] min-w-0"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || connState !== 'connected'}
              className="p-3 md:p-3 rounded-full bg-[#D4A5A5] text-white hover:bg-[#C99595] transition disabled:opacity-50 flex-shrink-0 min-w-11 min-h-11"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] bg-[#23213A] text-[#FBF7EE] text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
