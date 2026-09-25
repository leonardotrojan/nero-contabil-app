import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { formatCurrency } from "../../../utils/currency";
import { useSummary } from "../../../hooks/transactions/useSummary";
import { usePayInvoice } from "../../../hooks/creditCard/usePayInvoice";
import { useHaptics } from "../../../hooks/useHaptics";

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const formatShortDay = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

const daysUntil = (iso: string): number => {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
};

/**
 * O contrapeso do HeroCard. O Hero mostra caixa — o que sobrou de verdade.
 * Este mostra o que já foi gasto mas ainda não saiu. Juntos contam a história
 * inteira; sozinho, o Hero pareceria otimista demais.
 */
export const OpenInvoiceCard = React.memo(() => {
  const { data: summary } = useSummary();
  const { mutateAsync: payInvoice, isPending: isPaying } = usePayInvoice();
  const haptics = useHaptics();
  const creditCard = summary?.creditCard;

  const info = useMemo(() => {
    const open = creditCard?.openInvoice;
    if (!open) return null;

    return {
      total: open.total,
      count: open.count,
      closesLabel: formatShortDay(open.closesAt),
      closesIn: daysUntil(open.closesAt),
      dueLabel: formatShortDay(open.dueAt),
    };
  }, [creditCard]);

  const previousKey = creditCard?.previousInvoice?.periodKey;

  // Pagar move o valor do eixo competência para o caixa: cria a transação
  // consolidada e congela a fatura. Irreversível pela UI, então confirma antes.
  const handlePay = useCallback(() => {
    if (!previousKey) return;

    Alert.alert(
      "Pagar fatura",
      "A fatura vira uma despesa única e passa a pesar no seu saldo. As compras individuais continuam na análise por categoria.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pagar",
          style: "default",
          onPress: async () => {
            try {
              await payInvoice({ periodKey: previousKey });
              haptics.success();
            } catch (err) {
              haptics.error();
              Alert.alert(
                "Não foi possível pagar",
                err instanceof Error ? err.message : "Tente novamente.",
              );
            }
          },
        },
      ],
    );
  }, [previousKey, payInvoice, haptics]);

  // Sem cartão configurado não há fatura a mostrar — e o gate no Add garante
  // que não existem compras no crédito nesse estado.
  if (!creditCard?.configured || !info) return null;

  const previous = creditCard.previousInvoice;
  const hasUnpaidPrevious =
    previous !== null && previous.status === "unpaid" && previous.total > 0;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Typography variant="label" style={{ color: colors.base[300] }}>
            FATURA ABERTA
          </Typography>
          <View style={styles.badge}>
            <Typography variant="caption" style={{ color: colors.accent.blue }}>
              fecha em {info.closesIn}d
            </Typography>
          </View>
        </View>

        <Typography variant="balance" style={{ color: colors.base[50] }}>
          {formatCurrency(info.total)}
        </Typography>

        <Typography variant="caption" style={{ color: colors.base[300] }}>
          {info.count === 0
            ? "Nenhuma compra no crédito ainda"
            : `${info.count} ${info.count === 1 ? "compra" : "compras"} · não entra no saldo`}
        </Typography>
      </View>

      <View style={styles.divider} />

      <View style={styles.cycleRow}>
        <View style={styles.cycleItem}>
          <Typography variant="caption" style={{ color: colors.base[400] }}>
            Fecha
          </Typography>
          <Typography variant="captionMedium" style={{ color: colors.accent.blue }}>
            {info.closesLabel}
          </Typography>
        </View>
        <View style={styles.cycleItem}>
          <Typography variant="caption" style={{ color: colors.base[400] }}>
            Vence
          </Typography>
          <Typography variant="captionMedium" style={{ color: colors.accent.mint }}>
            {info.dueLabel}
          </Typography>
        </View>
      </View>

      {hasUnpaidPrevious && (
        <View style={styles.previous}>
          <View style={styles.previousText}>
            <Typography variant="caption" style={{ color: colors.semantic.warning }}>
              Fatura anterior em aberto
            </Typography>
            <Typography variant="amount" style={{ color: colors.semantic.warning }}>
              {formatCurrency(previous.total)}
            </Typography>
          </View>

          <Pressable
            onPress={handlePay}
            disabled={isPaying}
            style={styles.payButton}
            accessibilityRole="button"
            accessibilityLabel={`Pagar fatura de ${formatCurrency(previous.total)}`}
          >
            {isPaying ? (
              <ActivityIndicator size="small" color={colors.base[950]} />
            ) : (
              <Typography variant="captionMedium" style={{ color: colors.base[950] }}>
                Pagar
              </Typography>
            )}
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
});

OpenInvoiceCard.displayName = "OpenInvoiceCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.base[800],
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: spacing[5],
    gap: spacing[4],
  },
  header: {
    gap: spacing[2],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    backgroundColor: colors.accent.blueMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
  },
  cycleRow: {
    flexDirection: "row",
    gap: spacing[8],
  },
  cycleItem: {
    gap: spacing[1],
  },
  previous: {
    backgroundColor: colors.semantic.warningMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  previousText: {
    gap: 2,
    flexShrink: 1,
  },
  payButton: {
    backgroundColor: colors.semantic.warning,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    height: 32,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
});
