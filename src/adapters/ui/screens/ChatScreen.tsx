import { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HistoryDrawer } from '../components/HistoryDrawer';
import { useChatViewModel } from '../hooks/useChatViewModel';
import { ChatView } from './ChatView';
import { colors, font } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

/**
 * Renders the chat screen for the current conversation and its history drawer.
 */
export function ChatScreen({ route, navigation }: Props) {
  const conversationId = route.params?.conversationId;
  const viewModel = useChatViewModel(conversationId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10} style={styles.menuButton}>
          <Text style={styles.menuIcon}>⚙️</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => setDrawerOpen(true)} hitSlop={10} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const selectConversation = (id: string): void => {
    setDrawerOpen(false);
    navigation.setParams({ conversationId: id });
  };

  const newConversation = (): void => {
    setDrawerOpen(false);
    navigation.setParams({ conversationId: `conv-${Date.now()}` });
  };

  return (
    <View style={styles.root}>
      {viewModel === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primaryBright} />
        </View>
      ) : (
        <ChatView viewModel={viewModel} />
      )}

      <HistoryDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={selectConversation}
        onNew={newConversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgFrom },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgFrom },
  menuButton: { paddingHorizontal: 6 },
  menuIcon: { color: colors.textPrimary, fontSize: 22, fontWeight: font.bold },
});
