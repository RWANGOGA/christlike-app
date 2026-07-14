'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { User, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const u = await api.get('/users/me');
        setUser(u); setEmail(u.email); setStage(u.faith_journey_stage || '');
      } catch {}
    };
    load();
  }, []);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    try {
      await api.patch('/users/me', { email, faith_journey_stage: stage });
      setMessage('Profile updated successfully!');
    } catch (err: any) { setMessage(err.message); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    try {
      await api.patch('/users/me', { current_password: currentPwd, new_password: newPwd });
      setMessage('Password changed successfully!');
      setCurrentPwd(''); setNewPwd('');
    } catch (err: any) { setMessage(err.message); }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-[#FBF7EE]"><div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" /></div>;

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-3xl mx-auto">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A] mb-8">Account Settings</h1>
        
        {message && <p className="text-sm text-[#23213A]/70 bg-[#E3A857]/10 border border-[#E3A857]/20 rounded-lg px-4 py-2.5 mb-6">{message}</p>}

        <form onSubmit={handleProfile} className="bg-white p-6 rounded-xl border border-[#23213A]/10 mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-2"><User className="w-5 h-5 text-[#E3A857]" /> <h2 className="font-semibold text-[#23213A]">Profile Information</h2></div>
          <input required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm">
            <option value="">Select Faith Stage...</option>
            <option value="Seeker">Seeker</option>
            <option value="New Believer">New Believer</option>
            <option value="Growing">Growing</option>
            <option value="Mature">Mature</option>
          </select>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium">Save Profile</button>
        </form>

        <form onSubmit={handlePassword} className="bg-white p-6 rounded-xl border border-[#23213A]/10 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Lock className="w-5 h-5 text-[#E3A857]" /> <h2 className="font-semibold text-[#23213A]">Change Password</h2></div>
          <input type="password" required placeholder="Current Password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
          <input type="password" required placeholder="New Password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium">Update Password</button>
        </form>
      </div>
    </div>
  );
}
