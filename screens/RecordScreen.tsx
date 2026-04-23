import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Storage } from '../lib/storage';
import { transcribeAudio, processEntry } from '../lib/api';
import { hasCrisisSignal } from '../lib/crisis';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { NavScreen } from '../App';

type Props = { navigate: (s: NavScreen) => void; goBack: () => void };
type RecordState = 'idle' | 'recording' | 'processing' | 'error';

const MAX_DURATION_MS = 10 * 60 * 1000;

export default function RecordScreen({ navigate, goBack }: Props) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const [state, setState] = useState<RecordState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Tap to begin speaking');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync();
    return () => {
      stopTimer();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (state === 'recording') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [state]);

  const startTimer = () => {
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs((prev) => {
        if (prev + 1000 >= MAX_DURATION_MS) stopRecording();
        return prev + 1000;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setState('recording');
      setStatusMessage('Listening… speak from the heart');
      startTimer();
    } catch {
      Alert.alert('Microphone Error', 'Please check your microphone permissions in Settings.');
    }
  };

  const stopRecording = useCallback(async () => {
    stopTimer();
    const rec = recordingRef.current;
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No audio file');
      setState('processing');
      setStatusMessage('Transcribing your words…');
      const transcript = await transcribeAudio(uri);
      const isCrisisLocal = hasCrisisSignal(transcript);
      setStatusMessage('Preparing your reflection…');
      const result = await processEntry(transcript);
      const entry = Storage.createEntry(uri, elapsedMs);
      entry.transcript = transcript;
      entry.emotionTags = result.emotionTags;
      entry.response = result.response;
      entry.isCrisis = isCrisisLocal || result.isCrisis;
      await Storage.save(entry);
      navigate({ name: 'Entry', id: entry.id });
    } catch {
      setState('error');
      setStatusMessage('Something went wrong. Please try again.');
    }
  }, [elapsedMs, navigate]);

  const handlePress = () => {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecording();
  };

  const isActive = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backLabel}>← Back</Text>
      </Pressable>

      <View style={styles.promptArea}>
        <Text style={styles.promptLabel}>TODAY'S PROMPT</Text>
        <Text style={styles.prompt}>"What are you carrying today that you haven't said out loud yet?"</Text>
      </View>

      <View style={styles.buttonArea}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          </View>
        ) : (
          <Pressable onPress={handlePress} disabled={isProcessing}>
            <Animated.View style={[styles.outerRing, isActive && styles.outerRingActive, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.recordButton, isActive && styles.recordButtonActive]}>
                <View style={[styles.recordIcon, isActive && styles.stopIcon]} />
              </View>
            </Animated.View>
          </Pressable>
        )}
        {isActive && <Text style={styles.timer}>{formatTime(elapsedMs)}</Text>}
      </View>

      <Text style={[styles.statusMessage, state === 'error' && styles.statusError]}>{statusMessage}</Text>
      <Text style={styles.hint}>
        {isActive ? 'Tap to finish and receive your reflection' : 'Your entry is completely private'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl },
  backButton: { paddingVertical: Spacing.md },
  backLabel: { ...Typography.body, color: Colors.accent },
  promptArea: { backgroundColor: Colors.accentSoft, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  promptLabel: { ...Typography.label, color: Colors.accent, marginBottom: Spacing.sm },
  prompt: { ...Typography.body, fontStyle: 'italic', lineHeight: 26 },
  buttonArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  processingContainer: { alignItems: 'center', gap: Spacing.lg },
  outerRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  outerRingActive: { borderColor: Colors.recordingRed, backgroundColor: Colors.recordingRedGlow },
  recordButton: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  recordButtonActive: { backgroundColor: Colors.recordingRed },
  recordIcon: { width: 18, height: 24, borderRadius: 9, backgroundColor: Colors.textInverse },
  stopIcon: { width: 24, height: 24, borderRadius: 4 },
  timer: { ...Typography.title, color: Colors.recordingRed },
  statusMessage: { ...Typography.subtitle, textAlign: 'center', color: Colors.textSecondary, marginBottom: Spacing.sm },
  statusError: { color: Colors.crisis },
  hint: { ...Typography.caption, textAlign: 'center', color: Colors.textMuted, paddingBottom: Spacing.xxl },
});
