import React, { useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated as RNAnimated,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Typography } from "../../src/components/ui/Typography";
import { FloatingActionButton } from "../../src/components/ui/FloatingActionButton";
import { HeroCard } from "../../src/modules/home/components/HeroCard";
import { RadialChart } from "../../src/modules/home/components/RadialChart";
import { QuickInsights } from "../../src/modules/home/components/QuickInsights";
import { RecentActivity } from "../../src/modules/home/components/RecentActivity";
import { FutureTimeline } from "../../src/modules/home/components/FutureTimeline";
import { colors } from "../../src/theme/colors";
import { layout, spacing } from "../../src/theme/spacing";
import { getGreeting, formatMonthYear } from "../../src/utils/date";

const HEADER_HEIGHT = 80;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const headerBlurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      {/* Floating header blur on scroll */}
      <Animated.View
        style={[
          styles.headerBlur,
          { paddingTop: insets.top },
          headerBlurStyle,
        ]}
        pointerEvents="none"
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15, 17, 21, 0.75)" }]} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 110,
          },
        ]}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.pageHeader, { paddingHorizontal: layout.screenPaddingH }]}
        >
          <View>
            <Typography variant="captionMedium" color="tertiary">
              {getGreeting()}
            </Typography>
            <Typography variant="h2" color="primary">
              Leo
            </Typography>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.monthPill}>
              <Typography variant="captionMedium" color="secondary">
                {formatMonthYear()}
              </Typography>
            </View>
            <Pressable
              style={styles.avatar}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Perfil"
            >
              <LinearGradient
                colors={[colors.accent.blue, colors.accent.purple]}
                style={StyleSheet.absoluteFill}
              />
              <Typography variant="bodyMedium" color="primary" style={{ fontWeight: "700" }}>
                L
              </Typography>
            </Pressable>
          </View>
        </Animated.View>

        {/* Content sections */}
        <View style={styles.sections}>
          <View style={styles.section}>
            <HeroCard />
          </View>

          <View style={styles.section}>
            <QuickInsights />
          </View>

          <View style={styles.section}>
            <RadialChart />
          </View>

          <View style={styles.section}>
            <FutureTimeline />
          </View>

          <View style={styles.section}>
            <RecentActivity />
          </View>
        </View>
      </Animated.ScrollView>

      {/* FAB */}
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 50,
    overflow: "hidden",
  },
  scroll: {
    flexGrow: 1,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monthPill: {
    backgroundColor: colors.base[800],
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.accent.blue + "60",
  },
  sections: {
    paddingHorizontal: layout.screenPaddingH,
    gap: 24,
  },
  section: {},
});
