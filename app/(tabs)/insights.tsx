import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { Card } from "../../src/components/ui/Card";
import { Typography } from "../../src/components/ui/Typography";
import { colors } from "../../src/theme/colors";
import { layout, radius } from "../../src/theme/spacing";
import { useInsightStore } from "../../src/stores/insightStore";
import type { InsightSeverity } from "../../src/types";

const severityLabel: Record<InsightSeverity, { label: string; color: string }> = {
  positive: { label: "Positivo", color: colors.accent.mint },
  warning: { label: "Atenção", color: colors.semantic.warning },
  info: { label: "Info", color: colors.accent.blue },
  neutral: { label: "Neutro", color: colors.base[300] },
};

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { insights } = useInsightStore();

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Typography variant="h1" color="primary">
          Insights
        </Typography>
        <View style={styles.statusPill}>
          <View style={styles.dot} />
          <Typography variant="captionMedium" color="mint">
            Padrão estável
          </Typography>
        </View>
      </View>

      <ScreenContainer paddingTop={24} paddingHorizontal={layout.screenPaddingH}>
        {insights.map((insight, i) => {
          const sev = severityLabel[insight.severity];
          return (
            <Animated.View
              key={insight.id}
              entering={FadeInDown.duration(400).delay(i * 70)}
              style={styles.cardWrapper}
            >
              <Card>
                <View style={styles.insightHeader}>
                  <View style={[styles.sevPill, { backgroundColor: sev.color + "20" }]}>
                    <Typography variant="label" style={{ color: sev.color }}>
                      {sev.label}
                    </Typography>
                  </View>
                  {!insight.read && <View style={styles.unreadDot} />}
                </View>
                <Typography variant="bodyMedium" color="primary" style={styles.insightText}>
                  {insight.content}
                </Typography>
              </Card>
            </Animated.View>
          );
        })}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.mint,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sevPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.blue,
  },
  insightText: {
    lineHeight: 22,
  },
});
