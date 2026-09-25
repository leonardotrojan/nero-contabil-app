import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api";

interface RegisterState {
  isLoading: boolean;
  error: string | null;
}

export function useRegister() {
  const { register } = useAuth();
  const [state, setState] = useState<RegisterState>({ isLoading: false, error: null });

  const execute = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setState({ isLoading: true, error: null });
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
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
