import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";
import { Typography } from "../../../components/ui/Typography";
import { Card } from "../../../components/ui/Card";
import { colors } from "../../../theme/colors";
import { useTransactions } from "../../../hooks/transactions/useTransactions";
import { getCategoryById } from "../../../constants/categories";
import { formatCurrency } from "../../../utils/currency";

const SIZE = 160;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Segment {
  name: string;
  color: string;
  amount: number;
}

export const RadialChart = React.memo(() => {
  const { data: transactions = [] } = useTransactions();

  const now = new Date();
  const monthly = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === "expense" &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const totalExpenses = monthly.reduce((s, t) => s + t.amount, 0);

  const categoryTotals = monthly.reduce<Record<string, Segment>>((acc, t) => {
    const cat = getCategoryById(t.categoryId);
    if (!acc[t.categoryId]) {
      acc[t.categoryId] = { amount: 0, color: cat.color, name: cat.name };
    }
    acc[t.categoryId].amount += t.amount;
    return acc;
  }, {});

  const segments: Segment[] = Object.values(categoryTotals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  let cumulativePercent = 0;

  return (
    <Animated.View entering={FadeIn.duration(600).delay(250)}>
      <Card>
        <View style={styles.header}>
          <Typography variant="h3" color="primary">
            Distribuição
          </Typography>
          <Typography variant="caption" color="tertiary">
            Este mês
          </Typography>
        </View>

        <View style={styles.body}>
          {/* Donut SVG */}
          <View style={styles.chartWrapper}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={colors.base[700]}
                  strokeWidth={STROKE}
                  fill="none"
                />
                {totalExpenses > 0 &&
                  segments.map((seg, i) => {
                    const percent = seg.amount / totalExpenses;
                    const dashArray = percent * CIRCUMFERENCE;
                    const offset = -cumulativePercent * CIRCUMFERENCE;
                    cumulativePercent += percent;
                    return (
                      <Circle
                        key={i}
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        stroke={seg.color}
                        strokeWidth={STROKE}
                        fill="none"
                        strokeDasharray={`${dashArray} ${CIRCUMFERENCE}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    );
                  })}
              </G>
            </Svg>
            <View style={styles.chartCenter}>
              <Typography variant="captionMedium" color="tertiary">
                Total
              </Typography>
              <Typography variant="bodyMedium" color="primary">
                {formatCurrency(totalExpenses, true)}
              </Typography>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {segments.length === 0 ? (
              <Typography variant="caption" color="tertiary" align="center">
                Nenhum gasto{"\n"}este mês
              </Typography>
            ) : (
              segments.map((seg, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                  <View style={styles.legendText}>
                    <Typography variant="captionMedium" color="secondary">
                      {seg.name}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                      {formatCurrency(seg.amount, true)}
                    </Typography>
                  </View>
                  <Typography variant="captionMedium" color="tertiary">
                    {totalExpenses > 0
                      ? `${Math.round((seg.amount / totalExpenses) * 100)}%`
                      : "0%"}
                  </Typography>
                </View>
              ))
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
});

RadialChart.displayName = "RadialChart";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  body: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  chartWrapper: {
    position: "relative",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    gap: 2,
  },
  legend: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    gap: 1,
  },
});
