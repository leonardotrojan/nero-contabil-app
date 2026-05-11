import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Typography } from "../../src/components/ui/Typography";
import { Input } from "../../src/components/ui/Input";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { colors } from "../../src/theme/colors";
import { radius, layout } from "../../src/theme/spacing";
import { useTransactionStore } from "../../src/stores/transactionStore";
import { getCategoryById } from "../../src/constants/categories";
import { formatCurrency } from "../../src/utils/currency";
import { formatDate } from "../../src/utils/date";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactionStore();
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      getCategoryById(t.categoryId).name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, typeof transactions> = {};
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
                return (
                  <Pressable key={t.id} style={styles.item} accessible accessibilityLabel={t.description}>
                    <View style={[styles.iconBg, { backgroundColor: cat.color + "20" }]}>
                      <Typography variant="body">{cat.icon}</Typography>
                    </View>
                    <View style={styles.info}>
                      <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
                        {t.description}
                      </Typography>
                      <Typography variant="caption" color="tertiary">
                        {cat.name} · {t.paymentMethod.toUpperCase()}
                      </Typography>
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
