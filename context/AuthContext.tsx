import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user.ts';
import { loginUser, registerUser, getCurrentUser } from '../services/authService.ts';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For web storage when SecureStore is not available
const tokenStorageKey = 'docChatAuthToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        // Get token from storage
        const token = await getToken();
        
        if (token) {
          // Get user data with token
          const userData = await getCurrentUser(token);
          setUser(userData);
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserFromToken();
  }, []);

  const saveToken = async (token: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(tokenStorageKey, token);
      } else {
        await SecureStore.setItemAsync(tokenStorageKey, token);
      }
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const getToken = async () => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(tokenStorageKey);
      } else {
        return await SecureStore.getItemAsync(tokenStorageKey);
      }
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const removeToken = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(tokenStorageKey);
      } else {
        await SecureStore.deleteItemAsync(tokenStorageKey);
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.token) {
        await saveToken(response.token);
      } else {
        throw new Error('No token received from server.');
      }
      setUser(response.user);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await registerUser(name, email, password);
      if (response.token) {
        await saveToken(response.token);
      } else {
        throw new Error('No token received from server.');
      }
      setUser(response.user);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await removeToken();
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}