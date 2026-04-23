import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JournalEntry, Storage } from '../../lib/storage';
import { CRISIS_RESOURCES } from '../../lib/crisis';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import CrisisAlert from '../../components/CrisisAlert';

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (id) Storage.getById(id).then(setEntry);
  }, [id]);

  useEffect(() => {
    return () => {
      sound?.unloadAsync().catch(() => {});
    };
  }, [sound]);

  const togglePlayback = async () => {
    if (!entry?.audioUri) return;
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: entry.audioUri },
      { shouldPlay: true }
    );
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
    setSound(newSound);
    setIsPlaying(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure? This entry and its reflection will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (entry) await Storage.remove(entry.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!entry) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={Typography.body}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(entry.createdAt));

  const durationSec = Math.round(entry.durationMs / 1000);
  const durationLabel =
    durationSec >= 60
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : `${durationSec}s`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Crisis alert at top if needed */}
        {entry.isCrisis && <CrisisAlert resources={CRISIS_RESOURCES} />}

        {/* Entry meta + playback */}
        <View style={styles.audioCard}>
          <View style={styles.audioMeta}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.durationText}>{durationLabel}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.8 }]}
            onPress={togglePlayback}
            accessibilityLabel={isPlaying ? 'Pause recording' : 'Play recording'}
          >
            <View style={[styles.playIcon, isPlaying && styles.pauseIcon]} />
            <Text style={styles.playLabel}>{isPlaying ? 'Pause' : 'Play My Entry'}</Text>
          </Pressable>
        </View>

        {/* Emotion tags */}
        {entry.emotionTags.length > 0 && (
          <View style={styles.tagsRow}>
            {entry.emotionTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Transcript (collapsible hint) */}
        {entry.transcript ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What You Said</Text>
            <Text style={styles.transcript}>{entry.transcript}</Text>
          </View>
        ) : null}

        {/* AI Response */}
        {entry.response && (
          <>
            {/* Host message */}
            <View style={[styles.section, styles.hostCard]}>
              <Text style={styles.sectionLabel}>A Message For You</Text>
              <Text style={styles.hostMessage}>{entry.response.hostMessage}</Text>
            </View>

            {/* Reflection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Reflection</Text>
              <Text style={styles.reflectionText}>{entry.response.reflection}</Text>
            </View>

            {/* Quote */}
            <View style={[styles.section, styles.quoteCard]}>
              <Text style={styles.quoteText}>"{entry.response.quote}"</Text>
              <Text style={styles.quoteAuthor}>— {entry.response.quoteAuthor}</Text>
            </View>

            {/* Guidance */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>A Gentle Suggestion</Text>
              <Text style={styles.guidanceText}>{entry.response.guidance}</Text>
            </View>
          </>
        )}

        {/* Delete */}
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
          onPress={handleDelete}
          accessibilityLabel="Delete this entry"
        >
          <Text style={styles.deleteLabel}>Delete Entry</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  audioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  durationText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: Colors.textInverse,
  },
  pauseIcon: {
    width: 12,
    height: 14,
    borderRadius: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    // Use backgroundColor approach for pause — two bars
    backgroundColor: 'transparent',
  },
  playLabel: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  transcript: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  hostCard: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  hostMessage: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 27,
  },
  reflectionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 27,
  },
  quoteCard: {
    backgroundColor: Colors.sageSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  quoteText: {
    ...Typography.body,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    lineHeight: 27,
    marginBottom: Spacing.sm,
  },
  quoteAuthor: {
    ...Typography.caption,
    color: Colors.sage,
    fontWeight: '600',
    textAlign: 'right',
  },
  guidanceText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 27,
  },
  deleteButton: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  deleteLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
