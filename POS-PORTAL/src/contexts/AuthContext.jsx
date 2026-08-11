import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/auth.api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthCallbacks,
} from '../services/client';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (
    getAccessToken() || getRefreshToken() ? getStoredUser() : null
  ));
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    async function init() {
      if (didInit.current) return;
      didInit.current = true;

      const token = getAccessToken();
      const refresh = getRefreshToken();

      if (token || refresh) {
        try {
          const profile = await authAPI.getProfile();
          setUser(profile);
          if (getAccessToken()) connectSocket(getAccessToken());
        } catch {
          clearTokens();
          setUser(null);
        }
      } else {
        clearTokens();
        setUser(null);
      }

      setLoading(false);
    }
    init();
  }, []);

  // Register callback for token refresh failure
  useEffect(() => {
    setAuthCallbacks({
      onRefreshFailed: () => {
        setUser(null);
        disconnectSocket();
      },
    });
  }, []);

  const login = useCallback(async (username, password, rememberMe = false) => {
    const data = await authAPI.login(username, password, null, rememberMe);
    setUser(data.user);
    // Connect WebSocket after login
    connectSocket(data.accessToken);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    disconnectSocket();
    await authAPI.logout();
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    disconnectSocket();
    await authAPI.logoutAll();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    await authAPI.updateProfile(data);
    const profile = await authAPI.getProfile();
    setUser(profile);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    logoutAll,
    updateProfile,
  };

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
