import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { JournalEntry, Storage } from '../lib/storage';
import { APP_NAME, Colors, Radius, Spacing, Typography } from '../constants/theme';
import EntryCard from '../components/EntryCard';
import { NavScreen } from '../App';

type Props = { navigate: (s: NavScreen) => void };

export default function HomeScreen({ navigate }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadEntries = useCallback(async () => {
    const all = await Storage.getAll();
    setEntries(all);
    setLoaded(true);
  }, []);

  if (!loaded) { loadEntries(); }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{greeting()}</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎙</Text>
          <Text style={styles.emptyTitle}>Your journal is waiting</Text>
          <Text style={styles.emptyBody}>
            Tap the button below and speak freely. This is your safe space — no judgment, no rush.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          ListHeaderComponent={<Text style={styles.sectionLabel}>YOUR ENTRIES</Text>}
          renderItem={({ item }) => (
            <EntryCard entry={item} onPress={() => navigate({ name: 'Entry', id: item.id })} />
          )}
        />
      )}

      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => navigate({ name: 'Record' })}
        >
          <Text style={styles.fabLabel}>● Record Entry</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appName: { ...Typography.hero, color: Colors.accent, letterSpacing: 3 },
  tagline: { ...Typography.subtitle, marginTop: 2 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 120, paddingTop: Spacing.md },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingBottom: 100 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.title, textAlign: 'center', marginBottom: Spacing.md },
  emptyBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  fabContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 32, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  fab: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  fabLabel: { ...Typography.subtitle, color: Colors.textInverse, fontWeight: '600' },
});
