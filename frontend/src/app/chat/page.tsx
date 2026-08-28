'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MessageCircle, Send, Paperclip, Globe, Users, X, Download, FileText, Video, Image as ImageIcon } from 'lucide-react';

interface Message {
  id: string;
  sender_id: number;
  recipient_id: number;
  content: string;
  original_content?: string;
  source_language?: string;
  target_language?: string;
  content_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reference_content_type?: string;
  reference_content_id?: number;
  timestamp: string;
  isMine: boolean;
}

interface OnlineUser {
  user_id: number;
  language: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'sw', name: 'Swahili' },
];

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [myLanguage, setMyLanguage] = useState('en');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await api.get('/users/me');
        setUser(userData);
        setMyLanguage('en');

        const stored = localStorage.getItem('chat_messages');
        if (stored) {
          setMessages(JSON.parse(stored));
        }

        const onlineData = await api.get('/api/chat/online');
        setOnlineUsers(onlineData.online || []);
      } catch {
        router.replace('/');
      }
    };
    init();
  }, [router]);

  const saveMessages = useCallback((msgs: Message[]) => {
    localStorage.setItem('chat_messages', JSON.stringify(msgs));
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8002'}/ws/chat/${user.id}?token=${token}&language=${myLanguage}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnected(true);
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        const msg: Message = {
          ...data,
          isMine: data.sender_id === user.id,
        };
        setMessages((prev) => {
          const updated = [...prev, msg];
          saveMessages(updated);
          return updated;
        });
      }
    };

    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    return () => socket.close();
  }, [user, myLanguage, saveMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !ws) return;
    ws.send(
      JSON.stringify({
        recipient_id: selectedUser,
        content: newMessage,
        content_type: 'text',
      })
    );
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'}/api/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      if (ws) {
        ws.send(
          JSON.stringify({
            recipient_id: selectedUser,
            content: '',
            content_type: 'file',
            file_url: data.file_url,
            file_name: data.filename,
            file_size: data.size,
          })
        );
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const token = localStorage.getItem('token') || '';
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'}${fileUrl}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
  };

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return <FileText className="w-5 h-5" />;
    if (contentType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (contentType.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const selectedMessages = selectedUser
    ? messages.filter(
        (m) =>
          (m.sender_id === user?.id && m.recipient_id === selectedUser) ||
          (m.sender_id === selectedUser && m.recipient_id === user?.id)
      )
    : [];

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#FBF7EE]">
      {/* Online Users Sidebar */}
      <div className="w-64 bg-white border-r border-[#23213A]/10 flex flex-col">
        <div className="p-4 border-b border-[#23213A]/10">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Online
          </h2>
          <p className="text-xs text-[#23213A]/50 mt-1">{onlineUsers.length} users online</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {onlineUsers.map((u) => (
            <button
              key={u.user_id}
              onClick={() => setSelectedUser(u.user_id)}
              className={`w-full text-left px-4 py-3 hover:bg-[#FBF7EE] transition border-b border-[#23213A]/5 ${
                selectedUser === u.user_id ? 'bg-[#E3A857]/10' : ''
              }`}
            >
              <p className="text-sm font-medium text-[#23213A]">User #{u.user_id}</p>
              <p className="text-xs text-[#23213A]/50 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {u.language}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-[#23213A]/40">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a user to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-[#23213A]/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg text-[#23213A]">
                  Chat with User #{selectedUser}
                </h3>
                <p className="text-xs text-[#23213A]/50">
                  {connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg hover:bg-[#F5EFE6] transition"
              >
                <X className="w-5 h-5 text-[#5A4A4A]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.isMine
                        ? 'bg-[#23213A] text-[#FBF7EE]'
                        : 'bg-white border border-[#23213A]/10 text-[#23213A]'
                    }`}
                  >
                    {msg.content_type === 'file' && msg.file_url && (
                      <div className="mb-2 p-3 rounded-lg bg-white/10 flex items-center gap-3">
                        {getFileIcon(msg.content_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{msg.file_name}</p>
                          <p className="text-xs opacity-70">{formatSize(msg.file_size)}</p>
                        </div>
                        <button
                          onClick={() => downloadFile(msg.file_url!, msg.file_name || 'download')}
                          className="p-2 rounded-lg hover:bg-white/20 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.original_content && msg.original_content !== msg.content && (
                      <p className="text-xs opacity-50 mt-1 italic">
                        Original: {msg.original_content}
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${msg.isMine ? 'text-[#FBF7EE]/50' : 'text-[#23213A]/40'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-[#23213A]/10 p-4">
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md,.json"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-3 rounded-full bg-[#F5EFE6] text-[#5A4A4A] hover:bg-[#E3A857]/10 transition disabled:opacity-50"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full border border-[#23213A]/15 text-sm focus:outline-none focus:border-[#D4A5A5] focus:ring-1 focus:ring-[#D4A5A5]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 rounded-full bg-[#D4A5A5] text-white hover:bg-[#C99595] transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
