import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, AuthState } from '@/types';
import { useFitnessStore } from './fitness-store';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  syncData: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AUTH_STORAGE_KEY = 'fitness_auth_user';
const API_BASE_URL = 'https://toolkit.rork.com';

export const [AuthProvider, useAuth] = createContextHook((): AuthContextValue => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const loadStoredUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Set user in fitness store and load their data
        const fitnessStore = useFitnessStore.getState();
        fitnessStore.setCurrentUser(userData.id);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user from storage on app start
  useEffect(() => {
    loadStoredUser();
  }, [loadStoredUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual authentication
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // For demo purposes, create a mock user if login fails
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        
        setUser(mockUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        
        // Set user in fitness store and load their data
        const fitnessStore = useFitnessStore.getState();
        fitnessStore.setCurrentUser(mockUser.id);
        
        return true;
      }

      const userData = await response.json();
      setUser(userData.user);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData.user));
      
      // Set user in fitness store and load their data
      const fitnessStore = useFitnessStore.getState();
      fitnessStore.setCurrentUser(userData.user.id);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // For demo purposes, create a mock user
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      
      // Set user in fitness store and load their data
      const fitnessStore = useFitnessStore.getState();
      fitnessStore.setCurrentUser(mockUser.id);
      
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual registration
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        // For demo purposes, create a mock user if signup fails
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          name,
          createdAt: new Date().toISOString(),
        };
        
        setUser(mockUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        
        // Set user in fitness store and load their data
        const fitnessStore = useFitnessStore.getState();
        fitnessStore.setCurrentUser(mockUser.id);
        
        return true;
      }

      const userData = await response.json();
      setUser(userData.user);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData.user));
      
      // Set user in fitness store and load their data
      const fitnessStore = useFitnessStore.getState();
      fitnessStore.setCurrentUser(userData.user.id);
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      // For demo purposes, create a mock user
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        createdAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      
      // Set user in fitness store and load their data
      const fitnessStore = useFitnessStore.getState();
      fitnessStore.setCurrentUser(mockUser.id);
      
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      
      // Clear user from fitness store
      const fitnessStore = useFitnessStore.getState();
      fitnessStore.setCurrentUser(null);
      
      // Clear all fitness data on logout
      await AsyncStorage.multiRemove([
        'fitness_clients',
        'fitness_exercises',
        'fitness_workouts',
        'fitness_personal_records',
        'fitness_workout_templates',
        'fitness_video_records',
        'fitness_measurement_settings',
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const syncData = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      console.log('Syncing data for user:', user.email);
      
      // Sync fitness data
      const fitnessStore = useFitnessStore.getState();
      await fitnessStore.syncAllData();
      
      // In a real implementation, you would also:
      // 1. Upload local data to server
      // 2. Download server data
      // 3. Merge conflicts if any
      // 4. Update local storage
    } catch (error) {
      console.error('Sync error:', error);
      setError('Failed to sync data');
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    syncData,
    clearError,
  }), [user, isAuthenticated, isLoading, error, login, signup, logout, syncData, clearError]);
});