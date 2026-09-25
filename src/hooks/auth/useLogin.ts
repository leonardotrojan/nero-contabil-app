import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api";

interface LoginState {
  isLoading: boolean;
  error: string | null;
}

export function useLogin() {
  const { login } = useAuth();
  const [state, setState] = useState<LoginState>({ isLoading: false, error: null });

  const execute = async (email: string, password: string): Promise<boolean> => {
    setState({ isLoading: true, error: null });
    try {
      await login(email.trim().toLowerCase(), password);
      setState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.isNetwork
            ? "Sem conexão com o servidor"
            : err.message
          : "Erro inesperado. Tente novamente.";
      setState({ isLoading: false, error: message });
      return false;
    }
  };

  const clearError = () => setState((s) => ({ ...s, error: null }));

  return { ...state, execute, clearError };
}
