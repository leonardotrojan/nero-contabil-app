import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { BottomSheet } from "../ui/BottomSheet";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { useHaptics } from "../../hooks/useHaptics";
import { useCreditCard, useSaveCreditCard } from "../../hooks/creditCard/useCreditCard";
import { deviceTimeZone, invoicePeriodFor } from "../../utils/invoicePeriod";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const formatDay = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
};

type Field = "closing" | "due";

interface FieldTabProps {
  label: string;
  hint: string;
  day: number;
  accent: string;
  isActive: boolean;
  onPress: () => void;
}

const FieldTab = React.memo<FieldTabProps>(
  ({ label, hint, day, accent, isActive, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.fieldTab,
        isActive && { borderColor: accent, backgroundColor: accent + "14" },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label}, dia ${day}`}
    >
      <Typography variant="label" style={{ color: isActive ? accent : colors.base[400] }}>
        {label}
      </Typography>
      <Typography variant="balance" style={{ color: isActive ? accent : colors.base[200] }}>
        {day}
      </Typography>
      <Typography variant="caption" style={{ color: colors.base[400] }}>
        {hint}
      </Typography>
    </Pressable>
  ),
);

FieldTab.displayName = "FieldTab";

interface CreditCardSetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado só quando a config foi realmente salva, não ao dispensar. */
  onSaved?: () => void;
}

export const CreditCardSetupSheet = React.memo<CreditCardSetupSheetProps>(
  ({ isOpen, onClose, onSaved }) => {
    const { card } = useCreditCard();
    const { mutateAsync, isPending } = useSaveCreditCard();
    const haptics = useHaptics();

    const [closingDay, setClosingDay] = useState(card?.closingDay ?? 10);
    const [dueDay, setDueDay] = useState(card?.dueDay ?? 17);
    // Um campo por vez: duas grades de 31 dias não cabem na tela.
    const [editing, setEditing] = useState<Field>("closing");

    useEffect(() => {
      if (isOpen && card) {
        setClosingDay(card.closingDay);
        setDueDay(card.dueDay);
        setEditing("closing");
      }
    }, [isOpen, card]);

    // Torna a configuração abstrata concreta antes de salvar.
    const preview = useMemo(() => {
      const tz = card?.timeZone ?? deviceTimeZone();
      const period = invoicePeriodFor(new Date(), closingDay, dueDay, tz);
      return {
        closesAt: formatDay(period.closesAt.toISOString()),
        dueAt: formatDay(period.dueAt.toISOString()),
      };
    }, [closingDay, dueDay, card?.timeZone]);

    const selectedDay = editing === "closing" ? closingDay : dueDay;
    const accent = editing === "closing" ? colors.accent.blue : colors.accent.mint;

    const pickDay = useCallback(
      (day: number) => {
        haptics.selection();
        if (editing === "closing") setClosingDay(day);
        else setDueDay(day);
      },
      [editing, haptics],
    );

    const handleSave = useCallback(async () => {
      await mutateAsync({ closingDay, dueDay });
      haptics.success();
      onSaved?.();
      onClose();
    }, [closingDay, dueDay, mutateAsync, haptics, onSaved, onClose]);

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} snapHeight={660}>
        {/* Conteúdo rola; o botão fica ancorado para nunca sair da tela. */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Typography variant="h3">Ciclo do cartão</Typography>
            <Typography variant="caption" style={{ color: colors.base[300] }}>
              Compras no crédito não saem do saldo no dia da compra — elas entram
              na fatura e pesam quando ela vence.
            </Typography>
          </View>

          <View style={styles.fieldTabs}>
            <FieldTab
              label="VIRADA"
              hint="fatura fecha"
              day={closingDay}
              accent={colors.accent.blue}
              isActive={editing === "closing"}
              onPress={() => setEditing("closing")}
            />
            <FieldTab
              label="VENCIMENTO"
              hint="dinheiro sai"
              day={dueDay}
              accent={colors.accent.mint}
              isActive={editing === "due"}
              onPress={() => setEditing("due")}
            />
          </View>

          <View style={styles.grid} accessibilityRole="radiogroup">
            {DAYS.map((day) => {
              const isActive = day === selectedDay;
              return (
                <Pressable
                  key={day}
                  onPress={() => pickDay(day)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Dia ${day}`}
                  style={[
                    styles.dayCell,
                    isActive && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  <Typography
                    variant="captionMedium"
                    style={{ color: isActive ? colors.base[950] : colors.base[200] }}
                  >
                    {day}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.preview}>
            <Typography variant="caption" style={{ color: colors.base[300] }}>
              A fatura atual fecha em{" "}
              <Typography variant="captionMedium" style={{ color: colors.accent.blue }}>
                {preview.closesAt}
              </Typography>{" "}
              e vence em{" "}
              <Typography variant="captionMedium" style={{ color: colors.accent.mint }}>
                {preview.dueAt}
              </Typography>
              .
            </Typography>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Salvar ciclo"
            onPress={handleSave}
            loading={isPending}
            fullWidth
          />
        </View>
      </BottomSheet>
    );
  },
);

CreditCardSetupSheet.displayName = "CreditCardSetupSheet";

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[4],
  },
  footer: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  header: {
    gap: spacing[2],
  },
  fieldTabs: {
    flexDirection: "row",
    gap: spacing[3],
  },
  fieldTab: {
    flex: 1,
    gap: 2,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.light,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  dayCell: {
    width: 40,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  preview: {
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: spacing[4],
  },
});
