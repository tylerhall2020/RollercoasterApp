import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { JournalEntry, Storage } from '../lib/storage';
import { CRISIS_RESOURCES } from '../lib/crisis';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import CrisisAlert from '../components/CrisisAlert';

type Props = { id: string; goBack: () => void };

export default function EntryScreen({ id, goBack }: Props) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => { Storage.getById(id).then(setEntry); }, [id]);
  useEffect(() => { return () => { sound?.unloadAsync().catch(() => {}); }; }, [sound]);

  const togglePlayback = async () => {
    if (!entry?.audioUri) return;
    if (sound) {
      if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
      else { await sound.playAsync(); setIsPlaying(true); }
      return;
    }
    const { sound: s } = await Audio.Sound.createAsync({ uri: entry.audioUri }, { shouldPlay: true });
    s.setOnPlaybackStatusUpdate((st) => { if (st.isLoaded && st.didJustFinish) setIsPlaying(false); });
    setSound(s);
    setIsPlaying(true);
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'This entry will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { if (entry) await Storage.remove(entry.id); goBack(); } },
    ]);
  };

  if (!entry) return <View style={styles.loading}><Text>Loading…</Text></View>;

  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(entry.createdAt));
  const durationSec = Math.round(entry.durationMs / 1000);
  const durationLabel = durationSec >= 60 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : `${durationSec}s`;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backLabel}>← Journal</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {entry.isCrisis && <CrisisAlert resources={CRISIS_RESOURCES} />}

        <View style={styles.audioCard}>
          <View style={styles.audioMeta}>
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.durationText}>{durationLabel}</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.8 }]} onPress={togglePlayback}>
            <Text style={styles.playLabel}>{isPlaying ? '⏸ Pause' : '▶ Play My Entry'}</Text>
          </Pressable>
        </View>

        {entry.emotionTags.length > 0 && (
          <View style={styles.tagsRow}>
            {entry.emotionTags.map((tag) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}

        {entry.transcript ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHAT YOU SAID</Text>
            <Text style={styles.transcript}>{entry.transcript}</Text>
          </View>
        ) : null}

        {entry.response && (
          <>
            <View style={[styles.section, styles.hostCard]}>
              <Text style={styles.sectionLabel}>A MESSAGE FOR YOU</Text>
              <Text style={styles.hostMessage}>{entry.response.hostMessage}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR REFLECTION</Text>
              <Text style={styles.body}>{entry.response.reflection}</Text>
            </View>
            <View style={[styles.section, styles.quoteCard]}>
              <Text style={styles.quoteText}>"{entry.response.quote}"</Text>
              <Text style={styles.quoteAuthor}>— {entry.response.quoteAuthor}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>A GENTLE SUGGESTION</Text>
              <Text style={styles.body}>{entry.response.guidance}</Text>
            </View>
          </>
        )}

        <Pressable style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]} onPress={handleDelete}>
          <Text style={styles.deleteLabel}>Delete Entry</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backLabel: { ...Typography.body, color: Colors.accent },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  audioCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  audioMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  durationText: { ...Typography.caption, color: Colors.textMuted },
  playButton: { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, alignSelf: 'flex-start' },
  playLabel: { ...Typography.caption, color: Colors.textInverse, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { backgroundColor: Colors.accentSoft, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  tagText: { ...Typography.caption, color: Colors.accent, fontWeight: '600', textTransform: 'capitalize' },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.label, color: Colors.textMuted },
  transcript: { ...Typography.body, color: Colors.textSecondary, lineHeight: 26, fontStyle: 'italic' },
  hostCard: { backgroundColor: Colors.accentSoft, borderRadius: Radius.lg, padding: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  hostMessage: { ...Typography.body, lineHeight: 27 },
  body: { ...Typography.body, lineHeight: 27 },
  quoteCard: { backgroundColor: Colors.sageSoft, borderRadius: Radius.lg, padding: Spacing.lg },
  quoteText: { ...Typography.body, fontStyle: 'italic', lineHeight: 27, marginBottom: Spacing.sm },
  quoteAuthor: { ...Typography.caption, color: Colors.sage, fontWeight: '600', textAlign: 'right' },
  deleteButton: { alignSelf: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  deleteLabel: { ...Typography.caption, color: Colors.textMuted, textDecorationLine: 'underline' },
});
