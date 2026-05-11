import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Typography } from "./Typography";
import { colors } from "../../theme/colors";
import { shadows } from "../../theme/shadows";
import { springs, durations } from "../../theme/animations";
import { useHaptics } from "../../hooks/useHaptics";
import { useUIStore } from "../../stores/uiStore";

interface FABAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface FABProps {
  actions?: FABAction[];
}

const DEFAULT_ACTIONS: FABAction[] = [
  { id: "expense", label: "Gasto", icon: "↓", color: colors.semantic.danger, onPress: () => {} },
  { id: "income", label: "Receita", icon: "↑", color: colors.accent.mint, onPress: () => {} },
  { id: "transfer", label: "Transferência", icon: "⇄", color: colors.accent.blue, onPress: () => {} },
  { id: "subscription", label: "Assinatura", icon: "↺", color: colors.accent.purple, onPress: () => {} },
  { id: "objective", label: "Objetivo", icon: "◎", color: colors.semantic.warning, onPress: () => {} },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Sub-component so hooks are called at top level of a component ──
interface FABActionItemProps {
  action: FABAction;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}

const FABActionItem = React.memo<FABActionItemProps>(({ action, index, progress, onPress }) => {
  const haptics = useHaptics();
  const angle = -90 - index * 36;
  const radians = (angle * Math.PI) / 180;
  const distance = 90;

  const actionStyle = useAnimatedStyle(() => {
    const x = Math.cos(radians) * distance * progress.value;
    const y = Math.sin(radians) * distance * progress.value;
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: progress.value,
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.View style={[styles.actionContainer, actionStyle]}>
      <Pressable
        style={[styles.actionButton, { backgroundColor: action.color }]}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        accessible
        accessibilityLabel={action.label}
      >
        <Typography variant="body" style={{ color: colors.base[950], fontWeight: "700" }}>
          {action.icon}
        </Typography>
      </Pressable>
      <Animated.View style={[styles.actionLabel, labelStyle]}>
        <Typography variant="captionMedium" color="secondary">
          {action.label}
        </Typography>
      </Animated.View>
    </Animated.View>
  );
});

FABActionItem.displayName = "FABActionItem";

// ── Main FAB ──

export const FloatingActionButton = React.memo<FABProps>(({ actions = DEFAULT_ACTIONS }) => {
  const { isFabOpen, setFabOpen } = useUIStore();
  const haptics = useHaptics();
  const progress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(isFabOpen ? 1 : 0, springs.snappy);
    backdropOpacity.value = withTiming(isFabOpen ? 1 : 0, { duration: durations.normal });
  }, [isFabOpen]);

  const toggle = () => {
    haptics.medium();
    setFabOpen(!isFabOpen);
  };

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <>
      {/* Backdrop */}
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents={isFabOpen ? "auto" : "none"}
        onPress={() => setFabOpen(false)}
      />

      <View style={styles.container} pointerEvents="box-none">
        {/* Radial actions */}
        {actions.map((action, index) => (
          <FABActionItem
            key={action.id}
            action={action}
            index={index}
            progress={progress}
            onPress={() => {
              setFabOpen(false);
              action.onPress();
            }}
          />
        ))}

        {/* Main FAB */}
        <Pressable
          onPress={toggle}
          style={styles.fabWrapper}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Adicionar transação"
        >
          <BlurView intensity={40} tint="dark" style={styles.fab}>
            <View style={[StyleSheet.absoluteFill, styles.fabOverlay]} />
            <Animated.Text style={[styles.fabIcon, rotateStyle]}>+</Animated.Text>
          </BlurView>
        </Pressable>
      </View>
    </>
  );
});

FloatingActionButton.displayName = "FloatingActionButton";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 32,
    right: 24,
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    zIndex: 100,
  },
  backdrop: {
    backgroundColor: "rgba(5, 5, 5, 0.7)",
    zIndex: 90,
  },
  fabWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    ...shadows.blue,
  },
  fab: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  fabOverlay: {
    backgroundColor: colors.accent.blueMuted,
    borderRadius: 30,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.base[50],
    fontWeight: "200",
    lineHeight: 34,
  },
  actionContainer: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  actionLabel: {
    backgroundColor: colors.base[800],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
