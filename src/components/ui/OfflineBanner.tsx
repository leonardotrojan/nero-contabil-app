import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "./Typography";
import { colors } from "../../theme/colors";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { triggerSync } from "../../services/sync/syncEngine";

export const OfflineBanner = React.memo(() => {
  const { isConnected, isInternetReachable, isChecking } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-60);
  const wasOffline = useRef(false);

  const isOffline = !isChecking && (!isConnected || !isInternetReachable);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
    } else {
      translateY.value = withTiming(-60, { duration: 300 });
      // When coming back online, trigger sync
      if (wasOffline.current) {
        wasOffline.current = false;
        triggerSync();
      }
    }
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.banner, { paddingTop: insets.top + 4 }, animatedStyle]}
      pointerEvents="none"
    >
      <Typography variant="captionMedium" style={styles.text}>
        ◌ Sem conexão — dados locais ativos
      </Typography>
    </Animated.View>
  );
});

OfflineBanner.displayName = "OfflineBanner";

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: colors.semantic.warning + "EE",
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: "center",
  },
  text: {
    color: "#1a1200",
  },
});
