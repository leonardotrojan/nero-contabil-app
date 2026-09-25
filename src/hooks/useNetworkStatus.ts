import { useEffect, useState } from "react";
import * as Network from "expo-network";

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  isChecking: boolean;
}

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    isChecking: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const status = await Network.getNetworkStateAsync();
        if (!cancelled) {
          setState({
            isConnected: status.isConnected ?? true,
            isInternetReachable: status.isInternetReachable ?? true,
            isChecking: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({ isConnected: true, isInternetReachable: true, isChecking: false });
        }
      }
    }

    check();

    // Poll every 10s — expo-network doesn't have a real-time listener
    const interval = setInterval(check, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
