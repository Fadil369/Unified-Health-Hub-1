import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiUrl } from '@/lib/query-client';

interface User {
  id: number;
  username: string;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  memberId: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  githubConnected?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;
  register: (data: { email: string; password: string; nameEn?: string; nameAr?: string; phone?: string }) => Promise<boolean>;
  updateProfile: (data: { nameEn?: string; nameAr?: string; phone?: string; nationalId?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_TOKEN_KEY = 'brainsait_auth_token';
const AUTH_USER_KEY = 'brainsait_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

        if (token && savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);

          try {
            const apiUrl = getApiUrl();
            const res = await fetch(new URL('/api/auth/me', apiUrl).toString(), {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
            } else {
              await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
              await AsyncStorage.removeItem(AUTH_USER_KEY);
              setUser(null);
            }
          } catch (e) {}
        }
      } catch (e) {}
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/login', apiUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const loginWithGitHub = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/github', apiUrl).toString());

      if (!res.ok) return false;

      const data = await res.json();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const register = useCallback(async (regData: { email: string; password: string; nameEn?: string; nameAr?: string; phone?: string }) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/register', apiUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Registration failed');
      }

      const data = await res.json();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const updateProfile = useCallback(async (profileData: { nameEn?: string; nameAr?: string; phone?: string; nationalId?: string }) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return false;

      const apiUrl = getApiUrl();
      const res = await fetch(new URL('/api/auth/profile', apiUrl).toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setUser(data.user);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const apiUrl = getApiUrl();
        fetch(new URL('/api/auth/logout', apiUrl).toString(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch (e) {}
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGitHub,
    register,
    updateProfile,
    logout,
  }), [user, isLoading, login, loginWithGitHub, register, updateProfile, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
