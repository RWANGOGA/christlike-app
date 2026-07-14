// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  // Login and save token
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  // Register user
  register: async (email: string, username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  // Fetch authenticated data
  get: async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}${url}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  },

  // Post authenticated data (Fixed: Added back!)
  post: async (url: string, body: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Request failed');
    }
    return res.json();
  },

  // Patch authenticated data (Fixed: Now uses method: 'PATCH')
  patch: async (url: string, body: any) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}${url}`, {
      method: 'PATCH', // FIXED: Was incorrectly set to POST
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Request failed');
    }
    return res.json();
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
};