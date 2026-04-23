import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CRISIS_RESOURCES } from '../lib/crisis';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface Props {
  resources: typeof CRISIS_RESOURCES;
}

export default function CrisisAlert({ resources }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're Not Alone</Text>
      <Text style={styles.body}>
        It sounds like you might be going through something really heavy right now. Please reach out — support is available right now, for free.
      </Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
          onPress={() => Linking.openURL(`tel:${resources.hotline}`)}
          accessibilityLabel={`Call ${resources.hotlineLabel}`}
        >
          <Text style={styles.buttonLabel}>📞 Call {resources.hotline}</Text>
          <Text style={styles.buttonSub}>{resources.hotlineLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.buttonOutline, pressed && { opacity: 0.8 }]}
          onPress={() => Linking.openURL('sms:741741?body=HOME')}
          accessibilityLabel="Text HOME to Crisis Text Line"
        >
          <Text style={styles.buttonOutlineLabel}>💬 {resources.text}</Text>
          <Text style={styles.buttonOutlineSub}>{resources.textLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.crisisBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.crisis,
    gap: Spacing.md,
  },
  title: {
    ...Typography.subtitle,
    color: Colors.crisis,
    fontWeight: '700',
  },
  body: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  actions: {
    gap: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.crisis,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonLabel: {
    ...Typography.subtitle,
    color: Colors.textInverse,
    fontWeight: '700',
  },
  buttonSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: Colors.crisis,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonOutlineLabel: {
    ...Typography.subtitle,
    color: Colors.crisis,
    fontWeight: '600',
  },
  buttonOutlineSub: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
