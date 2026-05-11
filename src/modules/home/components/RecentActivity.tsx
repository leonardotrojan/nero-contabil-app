import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Typography } from "../../../components/ui/Typography";
import { Card } from "../../../components/ui/Card";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/spacing";
import { springs } from "../../../theme/animations";
import { useTransactionStore } from "../../../stores/transactionStore";
import { useHaptics } from "../../../hooks/useHaptics";
import { getCategoryById } from "../../../constants/categories";
import { formatCurrency } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import type { Transaction } from "../../../types";

interface ActivityItemProps {
  transaction: Transaction;
  index: number;
}

const ActivityItem = React.memo<ActivityItemProps>(({ transaction, index }) => {
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const category = getCategoryById(transaction.categoryId);
  const isExpense = transaction.type === "expense";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify()}
      style={animatedStyle}
    >
      <Pressable
        style={styles.item}
        onPressIn={() => {
          scale.value = withSpring(0.98, springs.snappy);
          haptics.light();
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.gentle);
        }}
        accessible
        accessibilityLabel={`${transaction.description}, ${formatCurrency(transaction.amount)}`}
      >
        {/* Icon */}
        <View style={[styles.iconBg, { backgroundColor: category.color + "20" }]}>
          <Typography variant="body" style={{ fontSize: 18 }}>
            {category.icon}
          </Typography>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
            {transaction.description}
          </Typography>
          <View style={styles.meta}>
            <Typography variant="caption" color="tertiary">
              {category.name}
            </Typography>
            {transaction.isRecurring && (
              <>
                <View style={styles.metaDot} />
                <Typography variant="caption" color="tertiary">
                  Recorrente
                </Typography>
              </>
            )}
            <View style={styles.metaDot} />
            <Typography variant="caption" color="tertiary">
              {formatDate(transaction.date)}
            </Typography>
          </View>
        </View>

        {/* Amount */}
        <Typography
          variant="amount"
          style={{
            color: isExpense ? colors.semantic.danger : colors.accent.mint,
          }}
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(transaction.amount, true)}
        </Typography>
      </Pressable>
    </Animated.View>
  );
});

ActivityItem.displayName = "ActivityItem";

export const RecentActivity = React.memo(() => {
  const { getRecentTransactions } = useTransactionStore();
  const recent = getRecentTransactions(5);

  return (
    <Card padding={0} style={styles.card}>
      <View style={styles.header}>
        <Typography variant="h3" color="primary">
          Recentes
        </Typography>
        <Pressable accessible accessibilityRole="link" accessibilityLabel="Ver todos">
          <Typography variant="captionMedium" color="blue">
            Ver todos
          </Typography>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body" style={{ fontSize: 28, textAlign: "center" }}>
            ◌
          </Typography>
          <Typography variant="captionMedium" color="tertiary" align="center">
            Nenhuma transação ainda.{"\n"}Adicione a primeira pelo botão +
          </Typography>
        </View>
      ) : (
        <View>
          {recent.map((t, i) => (
            <React.Fragment key={t.id}>
              <ActivityItem transaction={t} index={i} />
              {i < recent.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </Card>
  );
});

RecentActivity.displayName = "RecentActivity";

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.base[600],
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
});
