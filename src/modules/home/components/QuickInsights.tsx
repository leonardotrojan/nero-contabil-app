import React, { useRef } from "react";
import { ScrollView, View, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/spacing";
import { springs } from "../../../theme/animations";
import { useInsightStore } from "../../../stores/insightStore";
import { useHaptics } from "../../../hooks/useHaptics";
import type { Insight, InsightSeverity } from "../../../types";

const severityConfig: Record<InsightSeverity, { border: string; icon: string; bg: string }> = {
  positive: { border: colors.accent.mint, icon: "↑", bg: colors.accent.mintMuted },
  warning: { border: colors.semantic.warning, icon: "⚠", bg: colors.semantic.warningMuted },
  info: { border: colors.accent.blue, icon: "◈", bg: colors.accent.blueMuted },
  neutral: { border: colors.base[600], icon: "◉", bg: colors.glass.light },
};

interface InsightCardProps {
  insight: Insight;
  index: number;
}

const InsightCard = React.memo<InsightCardProps>(({ insight, index }) => {
  const { markAsRead } = useInsightStore();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const config = severityConfig[insight.severity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(300 + index * 80)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.card,
          { borderColor: config.border, backgroundColor: config.bg },
        ]}
        onPressIn={() => {
          scale.value = withSpring(0.96, springs.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.gentle);
        }}
        onPress={() => {
          haptics.light();
          markAsRead(insight.id);
        }}
        accessible
        accessibilityLabel={insight.content}
      >
        <View style={[styles.iconWrapper, { backgroundColor: config.border + "25" }]}>
          <Typography variant="bodyMedium" style={{ color: config.border }}>
            {config.icon}
          </Typography>
        </View>
        <Typography variant="captionMedium" color="secondary" style={styles.text} numberOfLines={2}>
          {insight.content}
        </Typography>
        {!insight.read && <View style={styles.unreadDot} />}
      </Pressable>
    </Animated.View>
  );
});

InsightCard.displayName = "InsightCard";

export const QuickInsights = React.memo(() => {
  const { insights } = useInsightStore();

  if (insights.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography variant="h3" color="primary">
          Insights
        </Typography>
        <View style={styles.badge}>
          <Typography variant="label" color="blue">
            {insights.filter((i) => !i.read).length} novos
          </Typography>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        decelerationRate="fast"
        snapToInterval={220}
      >
        {insights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} index={i} />
        ))}
      </ScrollView>
    </View>
  );
});

QuickInsights.displayName = "QuickInsights";

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    backgroundColor: colors.accent.blueMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent.blue + "40",
  },
  list: {
    gap: 10,
    paddingRight: 20,
  },
  card: {
    width: 210,
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    position: "relative",
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.blue,
  },
});
