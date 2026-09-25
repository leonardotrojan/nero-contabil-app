import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { colors } from "../../../theme/colors";
import { radius, spacing } from "../../../theme/spacing";
import { useRecurringAgenda } from "../../../hooks/recurring/useRecurring";
import { formatCurrency } from "../../../utils/currency";

export const FutureTimeline = React.memo(() => {
  const { upcoming } = useRecurringAgenda();

  // Sem regras configuradas não há o que projetar; a seção some em vez de
  // mostrar um esqueleto vazio.
  if (upcoming.length === 0) return null;

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
          const eventDate = new Date(event.date);
          const day = eventDate.getDate();
          const isToday = eventDate.toDateString() === new Date().toDateString();
          const isPast = false;
          const isIncome = event.type === "income";

          return (
            <View
              key={`${event.ruleId}:${event.periodKey}`}
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
                  DIA {day}
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
                {event.description}
              </Typography>
              <Typography
                variant="amount"
                style={{
                  color: isIncome ? colors.accent.mint : colors.semantic.danger,
                  fontSize: 13,
                }}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(event.amount, true)}
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
