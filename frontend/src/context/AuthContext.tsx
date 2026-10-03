import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { apiRequest, setAccessToken, getStoredAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: { email: string; password: string; first_name: string; last_name: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiRequest<User>('/users/me');
      setUser(profile);
    } catch {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    }
  }, []);

  // On initial mount, attempt to hydrate profile if token exists or via refresh cookie
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const stored = getStoredAccessToken();
      if (stored) {
        setToken(stored);
        try {
          const profile = await apiRequest<User>('/users/me');
          setUser(profile);
        } catch {
          // If stored token expired, try silent refresh
          try {
            const refreshRes = await apiRequest<{ accessToken: string }>('/auth/refresh', {
              method: 'POST',
              skipAuthRefresh: true,
            });
            setAccessToken(refreshRes.accessToken);
            setToken(refreshRes.accessToken);
            const profile = await apiRequest<User>('/users/me');
            setUser(profile);
          } catch {
            setAccessToken(null);
            setToken(null);
            setUser(null);
          }
        }
      } else {
        // Check if an active refresh cookie is present
        try {
          const refreshRes = await apiRequest<{ accessToken: string }>('/auth/refresh', {
            method: 'POST',
            skipAuthRefresh: true,
          });
          setAccessToken(refreshRes.accessToken);
          setToken(refreshRes.accessToken);
          const profile = await apiRequest<User>('/users/me');
          setUser(profile);
        } catch {
          // Normal guest state
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRefresh: true,
    });

    setAccessToken(res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const signup = async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<User> => {
    const res = await apiRequest<{ accessToken: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthRefresh: true,
    });

    setAccessToken(res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Clean up client state regardless of server response
    }
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
