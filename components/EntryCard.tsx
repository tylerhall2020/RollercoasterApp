import { Pressable, StyleSheet, Text, View } from 'react-native';
import { JournalEntry } from '../lib/storage';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
}

const EMOTION_COLORS: Record<string, string> = {
  grief: '#C0605A',
  anger: '#D4724A',
  sadness: '#6A8DB0',
  anxiety: '#A07CC0',
  loneliness: '#7A8C9E',
  hope: '#5A9E7A',
  gratitude: '#7A9E5A',
  numbness: '#9E9E9E',
  fear: '#8A6080',
  love: '#C07080',
};

export default function EntryCard({ entry, onPress }: Props) {
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(entry.createdAt));

  const durationSec = Math.round(entry.durationMs / 1000);
  const durationLabel =
    durationSec >= 60
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : `${durationSec}s`;

  const snippet = entry.response?.hostMessage
    ? entry.response.hostMessage.slice(0, 100) + '…'
    : entry.transcript
    ? entry.transcript.slice(0, 100) + '…'
    : 'Processing…';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Journal entry from ${date}`}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.rightMeta}>
          {entry.isCrisis && <View style={styles.crisisDot} />}
          <Text style={styles.duration}>{durationLabel}</Text>
        </View>
      </View>

      <Text style={styles.snippet} numberOfLines={2}>
        {snippet}
      </Text>

      {entry.emotionTags.length > 0 && (
        <View style={styles.tagsRow}>
          {entry.emotionTags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                { backgroundColor: (EMOTION_COLORS[tag] ?? Colors.accent) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: EMOTION_COLORS[tag] ?? Colors.accent },
                ]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  crisisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.crisis,
  },
  duration: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  snippet: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
