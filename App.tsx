import { enableScreens } from 'react-native-screens';
enableScreens(false);
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import EntryScreen from './screens/EntryScreen';
import { Colors } from './constants/theme';

export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Entry: { id: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: Colors.background },
              headerTintColor: Colors.textPrimary,
              headerShadowVisible: false,
              cardStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Record" component={RecordScreen} options={{ title: '', headerBackTitle: 'Back' }} />
            <Stack.Screen name="Entry" component={EntryScreen} options={{ title: '', headerBackTitle: 'Journal' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
