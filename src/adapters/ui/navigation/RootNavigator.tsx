import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useDependencies } from '../di/DependenciesContext';
import { colors, font } from '../theme/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Defines the root stack navigator for onboarding, chat, and settings.
 *
 * Waits for the onboarding status before selecting the initial route.
 */
export function RootNavigator() {
  const { hasCompletedOnboarding } = useDependencies();
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Chat' | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then((done) =>
      setInitialRoute(done ? 'Chat' : 'Onboarding'),
    );
  }, [hasCompletedOnboarding]);

  if (initialRoute === null) return null;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgFrom },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: font.displayBold, color: colors.textPrimary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bgFrom },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Asistente IA' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Stack.Navigator>
  );
}
