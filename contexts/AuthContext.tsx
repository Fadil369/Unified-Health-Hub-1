import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface User {
  id: string;
  username: string;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  memberId: string;
  email: string;
  phone: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: User = {
  id: 'patient-001',
  username: 'ahmed.hassan',
  nameAr: '\u0623\u062d\u0645\u062f \u062d\u0633\u0646',
  nameEn: 'Ahmed Hassan',
  nationalId: '****1234',
  memberId: 'MEM-2024-001',
  email: 'ahmed@example.com',
  phone: '+966 50 123 4567',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('brainsait_auth').then(data => {
      if (data) {
        setUser(JSON.parse(data));
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (username.length >= 3 && password.length >= 4) {
      const userData = { ...MOCK_USER, username };
      setUser(userData);
      await AsyncStorage.setItem('brainsait_auth', JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('brainsait_auth');
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout]);

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
