import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useDependencies } from '../di/DependenciesContext';
import { colors, font } from '../theme/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Stack raiz: Onboarding (primera vez) → Chat; el historial vive en HistoryDrawer. */
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
    </Stack.Navigator>
  );
}
