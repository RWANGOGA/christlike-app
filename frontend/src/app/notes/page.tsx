'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { FileText, Plus, Edit2, Trash2, Download, X, Save } from 'lucide-react';

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // 👇 NEW: Track authentication status
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/users/me');
        setIsAuthed(true);
        loadNotes();
      } catch {
        setIsAuthed(false);
        setLoading(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await api.get('/api/notes');
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setShowEditor(true);
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.note_text);
    setShowEditor(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await api.patch(`/api/notes/${editingNote.id}`, { title, note_text: content });
      } else {
        await api.post('/api/notes', { title, note_text: content });
      }
      setShowEditor(false);
      loadNotes();
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete note');
    }
  };

  const handleDownload = (format: 'txt' | 'md' | 'json') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(notes, null, 2);
      filename = 'my-notes.json';
      mimeType = 'application/json';
    } else if (format === 'md') {
      content = notes.map(n => `# ${n.title}\n\n${n.note_text}\n\n---\n`).join('\n');
      filename = 'my-notes.md';
      mimeType = 'text/markdown';
    } else {
      content = notes.map(n => `${n.title}\n${'='.repeat(n.title.length)}\n\n${n.note_text}\n\n`).join('\n');
      filename = 'my-notes.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 👇 Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF7EE]">
        <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
      </div>
    );
  }

  // 👇 Show login prompt if not authenticated
  if (!isAuthed) {
    return (
      <div className="flex bg-[#FBF7EE] min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="bg-white p-12 rounded-2xl border border-[#23213A]/10 text-center max-w-md">
            <FileText className="w-12 h-12 text-[#E3A857]/40 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#23213A]/70 mb-4">Please log in to access your notes.</p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="px-6 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF7EE]">
        <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-5xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">My Notes</h1>
            <p className="text-[#23213A]/50 mt-1">Capture your thoughts and insights.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#23213A]/15 text-[#23213A] text-sm font-medium hover:bg-[#FBF7EE] transition">
                <Download className="w-4 h-4" /> Export
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-[#23213A]/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleDownload('txt')} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FBF7EE]">Plain Text (.txt)</button>
                <button onClick={() => handleDownload('md')} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FBF7EE]">Markdown (.md)</button>
                <button onClick={() => handleDownload('json')} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FBF7EE]">JSON (.json)</button>
              </div>
            </div>
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#23213A]/10 text-center">
            <FileText className="w-12 h-12 text-[#23213A]/20 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#23213A]/50 mb-4">No notes yet. Start capturing your thoughts!</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition"
            >
              Create Your First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white p-6 rounded-xl border border-[#23213A]/10 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-[family-name:var(--font-display)] text-lg text-[#23213A] line-clamp-1">{note.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 rounded-lg hover:bg-[#23213A]/5 text-[#23213A]/60 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#23213A]/70 line-clamp-4 mb-4 whitespace-pre-wrap">{note.note_text}</p>
                <p className="text-xs text-[#23213A]/40">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Editor Modal */}
        {showEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-[#23213A]/10">
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A]">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h2>
                <button onClick={() => setShowEditor(false)} className="p-2 rounded-lg hover:bg-[#23213A]/5">
                  <X className="w-5 h-5 text-[#23213A]" />
                </button>
              </div>
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#23213A]/70 mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm focus:outline-none focus:border-[#E3A857]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#23213A]/70 mb-1.5">Content</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts..."
                    rows={12}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm focus:outline-none focus:border-[#E3A857] resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="px-5 py-2.5 rounded-lg border border-[#23213A]/15 text-[#23213A] text-sm font-medium hover:bg-[#FBF7EE] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition"
                  >
                    <Save className="w-4 h-4" /> Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}