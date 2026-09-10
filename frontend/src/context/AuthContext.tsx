import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  desk: string;
  clientFirm: string;
  avatarInitials: string;
  loginTime: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (userData: Partial<AuthUser>) => void;
  logout: () => void;
}

const STORAGE_KEY = 'bse_tradeops_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function login(data: Partial<AuthUser>) {
    const fullUser: AuthUser = {
      id: data.id || `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name || 'Arjun Mehta',
      email: data.email || 'arjun.mehta@ashokacapital.in',
      role: data.role || 'Senior Execution Trader',
      desk: data.desk || 'Institutional Equities Desk 1',
      clientFirm: data.clientFirm || 'Ashoka Capital',
      avatarInitials: data.avatarInitials || (data.name ? data.name.substring(0, 2).toUpperCase() : 'AM'),
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setUser(fullUser);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
