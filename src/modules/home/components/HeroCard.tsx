import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/spacing";
import { shadows } from "../../../theme/shadows";
import { springs } from "../../../theme/animations";
import { useUIStore } from "../../../stores/uiStore";
import { useHaptics } from "../../../hooks/useHaptics";
import { useSummary } from "../../../hooks/transactions/useSummary";
import { formatCurrency } from "../../../utils/currency";
import { daysRemainingInMonth } from "../../../utils/date";

const SkeletonBar = ({ width, height = 12 }: { width: number; height?: number }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        style,
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: colors.base[600],
        },
      ]}
    />
  );
};

export const HeroCard = React.memo(() => {
  const { isBalanceVisible, toggleBalanceVisibility } = useUIStore();
  const haptics = useHaptics();
  const { data: summary, isLoading } = useSummary();

  const balance = summary?.balance ?? 0;
  const expenses = summary?.expenses ?? 0;
  const income = summary?.income ?? 0;
  const stabilityRatio = income > 0 ? Math.min(1 - expenses / income, 1) : 0;
  const daysLeft = daysRemainingInMonth();

  const balanceOpacity = useSharedValue(1);
  const stabilityWidth = useSharedValue(0);

  useEffect(() => {
    stabilityWidth.value = withSpring(stabilityRatio, { damping: 20, stiffness: 80, mass: 1 });
  }, [stabilityRatio]);

  const balanceStyle = useAnimatedStyle(() => ({
    opacity: balanceOpacity.value,
  }));

  const stabilityStyle = useAnimatedStyle(() => ({
    width: `${stabilityWidth.value * 100}%` as any,
  }));

  const stabilityColor =
    stabilityRatio > 0.6
      ? colors.accent.mint
      : stabilityRatio > 0.3
      ? colors.semantic.warning
      : colors.semantic.danger;

  const handleToggle = () => {
    haptics.light();
    balanceOpacity.value = withSequence(
      withTiming(0, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    setTimeout(() => toggleBalanceVisibility(), 100);
  };

  return (
    <Animated.View entering={FadeIn.duration(600).delay(100)} style={[styles.wrapper, shadows.lg]}>
      <LinearGradient
        colors={[colors.base[800], colors.base[850]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={[StyleSheet.absoluteFill, styles.glowOverlay]} />
      <View style={[StyleSheet.absoluteFill, styles.border]} />

      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <Typography variant="captionMedium" color="tertiary">
            Saldo seguro
          </Typography>
          <Pressable
            onPress={handleToggle}
            accessible
            accessibilityLabel="Ocultar saldo"
            style={styles.eyeButton}
          >
            <Typography variant="captionMedium" color="tertiary">
              {isBalanceVisible ? "◎" : "◉"}
            </Typography>
          </Pressable>
        </View>

        {/* Balance */}
        <Animated.View style={[balanceStyle, styles.balanceRow]}>
          {isLoading ? (
            <SkeletonBar width={180} height={44} />
          ) : isBalanceVisible ? (
            <Typography variant="heroBalance" color="primary">
              {formatCurrency(balance)}
            </Typography>
          ) : (
            <View style={styles.balanceMask}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.maskDot} />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Projection */}
        <Typography variant="caption" color="tertiary" style={styles.projection}>
          Projeção até fim do mês · {daysLeft} dias
        </Typography>

        {/* Stability bar */}
        <View style={styles.stabilityContainer}>
          <View style={styles.stabilityTrack}>
            <Animated.View
              style={[
                styles.stabilityFill,
                { backgroundColor: stabilityColor },
                stabilityStyle,
              ]}
            />
          </View>
          <Typography variant="caption" color="tertiary">
            {Math.round(stabilityRatio * 100)}% estável
          </Typography>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Typography variant="caption" color="tertiary">
              Entradas
            </Typography>
            {isLoading ? (
              <SkeletonBar width={80} height={14} />
            ) : (
              <Typography variant="amount" color="mint">
                +{formatCurrency(income, true)}
              </Typography>
            )}
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Typography variant="caption" color="tertiary">
              Saídas
            </Typography>
            {isLoading ? (
              <SkeletonBar width={80} height={14} />
            ) : (
              <Typography variant="amount" color="danger">
                -{formatCurrency(expenses, true)}
              </Typography>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

HeroCard.displayName = "HeroCard";

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius["3xl"],
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  glowOverlay: {
    borderRadius: radius["3xl"],
    backgroundColor: colors.accent.blueMuted,
    opacity: 0.3,
  },
  border: {
    borderRadius: radius["3xl"],
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  content: {
    padding: 24,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyeButton: {
    padding: 4,
  },
  balanceRow: {
    minHeight: 52,
    justifyContent: "center",
  },
  balanceMask: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    height: 52,
  },
  maskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.base[500],
  },
  projection: {
    marginTop: -4,
  },
  stabilityContainer: {
    gap: 8,
    marginTop: 4,
  },
  stabilityTrack: {
    height: 3,
    backgroundColor: colors.base[700],
    borderRadius: 2,
    overflow: "hidden",
  },
  stabilityFill: {
    height: "100%",
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.glass.border,
    marginVertical: 12,
  },
});
