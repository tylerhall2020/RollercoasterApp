import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import EntryScreen from './screens/EntryScreen';
import { Colors } from './constants/theme';

export type NavScreen =
  | { name: 'Home' }
  | { name: 'Record' }
  | { name: 'Entry'; id: string };

export default function App() {
  const [screen, setScreen] = useState<NavScreen>({ name: 'Home' });

  const navigate = (s: NavScreen) => setScreen(s);
  const goBack = () => setScreen({ name: 'Home' });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {screen.name === 'Home' && <HomeScreen navigate={navigate} />}
      {screen.name === 'Record' && <RecordScreen navigate={navigate} goBack={goBack} />}
      {screen.name === 'Entry' && <EntryScreen id={screen.id} goBack={goBack} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
