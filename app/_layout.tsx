import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="record"
          options={{
            title: '',
            headerBackTitle: 'Back',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="entry/[id]"
          options={{
            title: '',
            headerBackTitle: 'Journal',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
          }}
        />
      </Stack>
    </>
  );
}
