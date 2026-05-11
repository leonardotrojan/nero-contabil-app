import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/spacing";

interface TimelineEvent {
  id: string;
  label: string;
  icon: string;
  day: number;
  amount: number;
  type: "income" | "expense";
}

const MOCK_EVENTS: TimelineEvent[] = [
  { id: "e1", label: "Spotify", icon: "🎵", day: 10, amount: 29.9, type: "expense" },
  { id: "e2", label: "Aluguel", icon: "🏠", day: 15, amount: 1200, type: "expense" },
  { id: "e3", label: "Salário", icon: "💼", day: 5, amount: 8500, type: "income" },
  { id: "e4", label: "Netflix", icon: "🎬", day: 18, amount: 55.9, type: "expense" },
  { id: "e5", label: "Freelance", icon: "💻", day: 20, amount: 1500, type: "income" },
  { id: "e6", label: "Internet", icon: "📡", day: 22, amount: 99.9, type: "expense" },
];

const today = new Date().getDate();

export const FutureTimeline = React.memo(() => {
  const upcoming = MOCK_EVENTS.filter((e) => e.day >= today).sort(
    (a, b) => a.day - b.day
  );

  return (
    <Animated.View entering={FadeIn.duration(500).delay(350)} style={styles.section}>
      <View style={styles.header}>
        <Typography variant="h3" color="primary">
          Próximos eventos
        </Typography>
        <Typography variant="caption" color="tertiary">
          Restante do mês
        </Typography>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        decelerationRate="fast"
      >
        {upcoming.map((event) => {
          const isToday = event.day === today;
          const isPast = event.day < today;
          const isIncome = event.type === "income";

          return (
            <View
              key={event.id}
              style={[
                styles.eventCard,
                isToday && styles.todayCard,
                isPast && styles.pastCard,
              ]}
            >
              <View style={styles.dayRow}>
                <Typography
                  variant="label"
                  style={{
                    color: isToday
                      ? colors.accent.blue
                      : isPast
                      ? colors.base[600]
                      : colors.base[300],
                  }}
                >
                  DIA {event.day}
                </Typography>
                {isToday && (
                  <View style={styles.todayBadge}>
                    <Typography variant="label" color="blue">
                      HOJE
                    </Typography>
                  </View>
                )}
              </View>

              <Typography variant="body" style={styles.icon}>
                {event.icon}
              </Typography>

              <Typography variant="captionMedium" color="secondary" numberOfLines={1}>
                {event.label}
              </Typography>
              <Typography
                variant="amount"
                style={{
                  color: isIncome ? colors.accent.mint : colors.semantic.danger,
                  fontSize: 13,
                }}
              >
                {isIncome ? "+" : "-"}R$ {event.amount.toFixed(0)}
              </Typography>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});

FutureTimeline.displayName = "FutureTimeline";

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  list: {
    gap: 10,
    paddingRight: 20,
  },
  eventCard: {
    width: 104,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.base[800],
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: 6,
  },
  todayCard: {
    borderColor: colors.accent.blue + "60",
    backgroundColor: colors.accent.blueMuted,
  },
  pastCard: {
    opacity: 0.4,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  todayBadge: {
    backgroundColor: colors.accent.blueMuted,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
  },
});
