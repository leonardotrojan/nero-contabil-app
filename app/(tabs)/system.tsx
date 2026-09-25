import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { Card } from "../../src/components/ui/Card";
import { Typography } from "../../src/components/ui/Typography";
import { colors } from "../../src/theme/colors";
import { layout, radius } from "../../src/theme/spacing";
import { CreditCardSetupSheet } from "../../src/components/creditCard/CreditCardSetupSheet";
import { RecurringRulesSheet } from "../../src/components/recurring/RecurringRulesSheet";
import { useCreditCard } from "../../src/hooks/creditCard/useCreditCard";
import { useRecurringRules } from "../../src/hooks/recurring/useRecurring";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  index?: number;
}

const SettingRow = React.memo<SettingRowProps>(({ icon, label, value, onPress, index = 0 }) => (
  <Animated.View entering={FadeInDown.duration(350).delay(index * 50)}>
    <Pressable
      style={styles.settingRow}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.settingIcon}>
        <Typography variant="body">{icon}</Typography>
      </View>
      <Typography variant="bodyMedium" color="secondary" style={{ flex: 1 }}>
        {label}
      </Typography>
      {value && (
        <Typography variant="captionMedium" color="tertiary">
          {value}
        </Typography>
      )}
      <Typography variant="captionMedium" color="tertiary">
        ›
      </Typography>
    </Pressable>
  </Animated.View>
));

SettingRow.displayName = "SettingRow";

export default function SystemScreen() {
  const insets = useSafeAreaInsets();
  const { card, isConfigured } = useCreditCard();
  const [isCardSheetOpen, setCardSheetOpen] = useState(false);
  const { data: rules = [] } = useRecurringRules();
  const [isRulesSheetOpen, setRulesSheetOpen] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Typography variant="h1" color="primary">
          Sistema
        </Typography>
      </View>

      <ScreenContainer paddingTop={24} paddingHorizontal={layout.screenPaddingH}>
        {/* Profile card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.profileCard}
        >
          <View style={styles.avatarLarge}>
            <LinearGradient
              colors={[colors.accent.blue, colors.accent.purple]}
              style={StyleSheet.absoluteFill}
            />
            <Typography variant="h2" color="primary" style={{ fontWeight: "800" }}>
              L
            </Typography>
          </View>
          <View style={styles.profileInfo}>
            <Typography variant="h3" color="primary">
              Leo Trojan
            </Typography>
            <Typography variant="caption" color="tertiary">
              lucas@commandix.tech
            </Typography>
          </View>
        </Animated.View>

        {/* Account */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="tertiary">
              Conta
            </Typography>
          </View>
          <SettingRow icon="🔐" label="Biometria" value="Ativada" index={0} />
          <View style={styles.divider} />
          <SettingRow icon="📱" label="Dispositivos" index={1} />
          <View style={styles.divider} />
          <SettingRow icon="🔑" label="Alterar senha" index={2} />
        </Card>

        {/* Credit card cycle */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="tertiary">
              Cartão de crédito
            </Typography>
          </View>
          <SettingRow
            icon="💳"
            label="Ciclo da fatura"
            value={
              isConfigured && card
                ? `fecha ${card.closingDay} · vence ${card.dueDay}`
                : "Configurar"
            }
            onPress={() => setCardSheetOpen(true)}
            index={0}
          />
        </Card>

        {/* Recurring events */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="tertiary">
              Eventos fixos
            </Typography>
          </View>
          <SettingRow
            icon="🔁"
            label="Gastos e entradas fixas"
            value={
              rules.length === 0
                ? "Configurar"
                : `${rules.length} ${rules.length === 1 ? "evento" : "eventos"}`
            }
            onPress={() => setRulesSheetOpen(true)}
            index={0}
          />
        </Card>

        {/* Data */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="tertiary">
              Dados
            </Typography>
          </View>
          <SettingRow icon="📤" label="Exportar dados" index={0} />
          <View style={styles.divider} />
          <SettingRow icon="☁️" label="Backup na nuvem" index={1} />
          <View style={styles.divider} />
          <SettingRow icon="🔄" label="Sincronização" value="Ativa" index={2} />
        </Card>

        {/* Appearance */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="tertiary">
              Aparência
            </Typography>
          </View>
          <SettingRow icon="🌑" label="Tema" value="Dark" index={0} />
          <View style={styles.divider} />
          <SettingRow icon="✦" label="Animações" value="Ativadas" index={1} />
          <View style={styles.divider} />
          <SettingRow icon="⬡" label="Blur" value="Médio" index={2} />
        </Card>

        {/* IA */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="tertiary">
              Inteligência
            </Typography>
          </View>
          <SettingRow icon="◈" label="Nível de insights" value="Alto" index={0} />
          <View style={styles.divider} />
          <SettingRow icon="🛡️" label="Privacidade dos dados" index={1} />
          <View style={styles.divider} />
          <SettingRow icon="⚙️" label="Processamento" value="Local" index={2} />
        </Card>

        <View style={styles.version}>
          <Typography variant="caption" color="tertiary" align="center">
            N.E.R.O. Contábil · v1.0.0
          </Typography>
          <Typography variant="caption" color="tertiary" align="center">
            Sistema operacional financeiro pessoal
          </Typography>
        </View>
      </ScreenContainer>

      <CreditCardSetupSheet
        isOpen={isCardSheetOpen}
        onClose={() => setCardSheetOpen(false)}
      />

      <RecurringRulesSheet
        isOpen={isRulesSheetOpen}
        onClose={() => setRulesSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.base[800],
    borderRadius: radius["2xl"],
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    gap: 4,
  },
  sectionCard: {
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.base[700],
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginHorizontal: 20,
  },
  version: {
    gap: 4,
    paddingVertical: 8,
    marginBottom: 8,
  },
});
