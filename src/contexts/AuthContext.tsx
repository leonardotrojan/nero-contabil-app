import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authStorage } from "../services/api/authStorage";
import { apiClient } from "../services/api/apiClient";
import { ENDPOINTS } from "../services/api/endpoints";
import { queryClient } from "../services/queryClient";

interface AuthUser {
  userId: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore session on mount
  useEffect(() => {
    async function restore() {
      try {
        const [token, userId] = await Promise.all([
          authStorage.getAccessToken(),
          authStorage.getUserId(),
        ]);

        if (token && userId) {
          setState({ user: { userId }, isAuthenticated: true, isLoading: false });
        } else {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string; userId: string }>(
      ENDPOINTS.auth.login,
      { email, password }
    );
    await authStorage.saveSession(data.accessToken, data.userId);
    setState({ user: { userId: data.userId }, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string; userId: string }>(
      ENDPOINTS.auth.register,
      { name, email, password }
    );
    await authStorage.saveSession(data.accessToken, data.userId);
    setState({ user: { userId: data.userId }, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await authStorage.clearSession();
    queryClient.clear();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
