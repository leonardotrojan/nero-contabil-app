import React, { useCallback, useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { formatCurrency } from "../../../utils/currency";
import { useHaptics } from "../../../hooks/useHaptics";
import {
  useRecurringAgenda,
  useResolveOccurrence,
} from "../../../hooks/recurring/useRecurring";
import type { AgendaItem } from "../../../types";

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const formatShortDay = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

interface PendingRowProps {
  item: AgendaItem;
  isBusy: boolean;
  onResolve: (item: AgendaItem, status: "confirmed" | "skipped") => void;
}

const PendingRow = React.memo<PendingRowProps>(({ item, isBusy, onResolve }) => {
  const isIncome = item.type === "income";

  return (
    <View style={styles.row}>
      <View style={[styles.iconBg, { backgroundColor: item.color + "20" }]}>
        <Typography variant="body">{item.icon}</Typography>
      </View>

      <View style={styles.info}>
        <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
          {item.description}
        </Typography>
        <Typography variant="caption" color="tertiary">
          venceu {formatShortDay(item.date)}
        </Typography>
      </View>

      <View style={styles.actions}>
        <Typography
          variant="amount"
          style={{
            color: isIncome ? colors.accent.mint : colors.semantic.danger,
            fontSize: 13,
          }}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(item.amount, true)}
        </Typography>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => onResolve(item, "skipped")}
            disabled={isBusy}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel={`Ignorar ${item.description}`}
          >
            <Typography variant="caption" style={{ color: colors.base[300] }}>
              Ignorar
            </Typography>
          </Pressable>

          <Pressable
            onPress={() => onResolve(item, "confirmed")}
            disabled={isBusy}
            style={styles.confirmButton}
            accessibilityRole="button"
            accessibilityLabel={`Confirmar ${item.description}`}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.base[950]} />
            ) : (
              <Typography variant="captionMedium" style={{ color: colors.base[950] }}>
                Confirmar
              </Typography>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
});

PendingRow.displayName = "PendingRow";

/**
 * Eventos de data fixa que já venceram. Nada entra no extrato sozinho — é
 * aqui que uma previsão vira fato, e só com confirmação explícita.
 */
export const PendingEventsCard = React.memo(() => {
  const { pending } = useRecurringAgenda();
  const { mutateAsync: resolve } = useResolveOccurrence();
  const haptics = useHaptics();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleResolve = useCallback(
    async (item: AgendaItem, status: "confirmed" | "skipped") => {
      const id = `${item.ruleId}:${item.periodKey}`;
      setBusyId(id);
      try {
        await resolve({ ruleId: item.ruleId, periodKey: item.periodKey, status });
        haptics.success();
      } catch (err) {
        haptics.error();
        Alert.alert(
          "Não foi possível registrar",
          err instanceof Error ? err.message : "Tente novamente.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [resolve, haptics],
  );

  if (pending.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.card}>
      <View style={styles.header}>
        <Typography variant="h3" color="primary">
          Aconteceu?
        </Typography>
        <Typography variant="caption" color="tertiary">
          {pending.length} {pending.length === 1 ? "evento" : "eventos"}
        </Typography>
      </View>

      <Typography variant="caption" style={{ color: colors.base[300] }}>
        Estes eventos venceram. Nada entra no seu saldo até você confirmar.
      </Typography>

      <View style={styles.list}>
        {pending.slice(0, 4).map((item) => (
          <PendingRow
            key={`${item.ruleId}:${item.periodKey}`}
            item={item}
            isBusy={busyId === `${item.ruleId}:${item.periodKey}`}
            onResolve={handleResolve}
          />
        ))}
      </View>

      {pending.length > 4 && (
        <Typography variant="caption" color="tertiary">
          e mais {pending.length - 4} aguardando
        </Typography>
      )}
    </Animated.View>
  );
});

PendingEventsCard.displayName = "PendingEventsCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.base[800],
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.accent.blue + "40",
    padding: spacing[5],
    gap: spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  list: {
    gap: spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  actions: {
    alignItems: "flex-end",
    gap: spacing[2],
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  skipButton: {
    paddingHorizontal: spacing[3],
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    height: 28,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
});
