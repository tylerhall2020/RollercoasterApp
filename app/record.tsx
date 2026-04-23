import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Storage } from '../lib/storage';
import { transcribeAudio, processEntry } from '../lib/api';
import { hasCrisisSignal } from '../lib/crisis';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

type RecordState = 'idle' | 'recording' | 'processing' | 'error';

const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export default function RecordScreen() {
  const router = useRouter();
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
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // Pulse animation while recording
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
        if (prev + 1000 >= MAX_DURATION_MS) {
          stopRecording();
        }
        return prev + 1000;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setState('recording');
      setStatusMessage('Listening… speak from the heart');
      startTimer();
    } catch {
      Alert.alert('Microphone Error', 'Could not start recording. Please check your microphone permissions in Settings.');
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

      if (!uri) throw new Error('No audio file produced');

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
      router.replace(`/entry/${entry.id}`);
    } catch (err) {
      setState('error');
      setStatusMessage('Something went wrong. Please try again.');
    }
  }, [elapsedMs, router]);

  const handlePress = () => {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecording();
  };

  const isActive = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Prompts */}
        <View style={styles.promptArea}>
          <Text style={styles.promptLabel}>Today's Prompt</Text>
          <Text style={styles.prompt}>
            "What are you carrying today that you haven't said out loud yet?"
          </Text>
        </View>

        {/* Recording button */}
        <View style={styles.buttonArea}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
          ) : (
            <Pressable
              onPress={handlePress}
              disabled={isProcessing}
              accessibilityLabel={isActive ? 'Stop recording' : 'Start recording'}
              accessibilityRole="button"
            >
              <Animated.View
                style={[
                  styles.outerRing,
                  isActive && styles.outerRingActive,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={[styles.recordButton, isActive && styles.recordButtonActive]}>
                  <View style={[styles.recordIcon, isActive && styles.stopIcon]} />
                </View>
              </Animated.View>
            </Pressable>
          )}

          {isActive && (
            <Text style={styles.timer}>{formatTime(elapsedMs)}</Text>
          )}
        </View>

        {/* Status text */}
        <Text style={[styles.statusMessage, state === 'error' && styles.statusError]}>
          {statusMessage}
        </Text>

        <Text style={styles.hint}>
          {isActive
            ? 'Tap to finish and receive your reflection'
            : 'Your entry is completely private'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  promptArea: {
    width: '100%',
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  promptLabel: {
    ...Typography.label,
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  prompt: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  buttonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.lg,
  },
  processingContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  outerRingActive: {
    borderColor: Colors.recordingRed,
    backgroundColor: Colors.recordingRedGlow,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: Colors.recordingRed,
    shadowColor: Colors.recordingRed,
  },
  recordIcon: {
    width: 18,
    height: 24,
    borderRadius: 9,
    backgroundColor: Colors.textInverse,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  timer: {
    ...Typography.title,
    color: Colors.recordingRed,
  },
  statusMessage: {
    ...Typography.subtitle,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  statusError: {
    color: Colors.crisis,
  },
  hint: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textMuted,
  },
});
