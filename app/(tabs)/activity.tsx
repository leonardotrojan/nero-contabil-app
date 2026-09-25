import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography } from "../../src/components/ui/Typography";
import { Input } from "../../src/components/ui/Input";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { colors } from "../../src/theme/colors";
import { radius, layout } from "../../src/theme/spacing";
import { useTransactions } from "../../src/hooks/transactions/useTransactions";
import { useCreditCard } from "../../src/hooks/creditCard/useCreditCard";
import { invoicePeriodFor } from "../../src/utils/invoicePeriod";
import { getCategoryById } from "../../src/constants/categories";
import { formatCurrency } from "../../src/utils/currency";
import { formatDate } from "../../src/utils/date";
import type { Transaction } from "../../src/types";

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { data: transactions = [] } = useTransactions();
  const { card } = useCreditCard();
  const [search, setSearch] = useState("");

  // Eixo competência: a lista mostra quando a compra aconteceu. O badge diz
  // em que fatura ela vai cair — derivado, nunca gravado na transação.
  const invoiceLabelFor = (t: Transaction): string | null => {
    if (t.paymentMethod !== "credit" || !card) return null;
    const period = invoicePeriodFor(
      new Date(t.date),
      card.closingDay,
      card.dueDay,
      card.timeZone,
    );
    const [, month] = period.key.split("-");
    return `fatura ${MONTHS_SHORT[Number(month) - 1]}`;
  };

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      getCategoryById(t.categoryId).name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Transaction[]> = {};
  filtered.forEach((t) => {
    const date = new Date(t.date);
    const key = date.toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Typography variant="h1" color="primary">
          Fluxo
        </Typography>
        <View style={styles.searchWrapper}>
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChangeText={setSearch}
            leftIcon={
              <Typography variant="body" color="tertiary">
                ⌕
              </Typography>
            }
          />
        </View>
      </View>

      <ScreenContainer paddingTop={0} paddingHorizontal={layout.screenPaddingH}>
        {Object.entries(grouped).map(([dateKey, txs], groupIndex) => (
          <Animated.View
            key={dateKey}
            entering={FadeInDown.duration(400).delay(groupIndex * 60)}
            style={styles.group}
          >
            <Typography variant="label" color="tertiary" style={styles.groupLabel}>
              {formatDate(txs[0].date)}
            </Typography>

            <View style={styles.groupItems}>
              {txs.map((t) => {
                const cat = getCategoryById(t.categoryId);
                const isExpense = t.type === "expense";
                const invoiceLabel = invoiceLabelFor(t);
                return (
                  <Pressable key={t.id} style={styles.item} accessible accessibilityLabel={t.description}>
                    <View style={[styles.iconBg, { backgroundColor: cat.color + "20" }]}>
                      <Typography variant="body">{cat.icon}</Typography>
                    </View>
                    <View style={styles.info}>
                      <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
                        {t.description}
                      </Typography>
                      <View style={styles.metaRow}>
                        <Typography variant="caption" color="tertiary">
                          {cat.name} · {t.paymentMethod.toUpperCase()}
                        </Typography>
                        {invoiceLabel && (
                          <View style={styles.invoiceBadge}>
                            <Typography
                              variant="caption"
                              style={{ color: colors.accent.blue }}
                            >
                              {invoiceLabel}
                            </Typography>
                          </View>
                        )}
                      </View>
                    </View>
                    <Typography
                      variant="amount"
                      style={{ color: isExpense ? colors.semantic.danger : colors.accent.mint }}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(t.amount, true)}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  searchWrapper: {},
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  invoiceBadge: {
    backgroundColor: colors.accent.blueMuted,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  group: {
    marginTop: 24,
    gap: 8,
  },
  groupLabel: {
    marginBottom: 4,
  },
  groupItems: {
    backgroundColor: colors.base[800],
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
