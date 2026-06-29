import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
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

  // Suscripción al VM (tolera null) para que el botón compartir se habilite en cuanto
  // la conversación tiene mensajes, sin esperar a cambiar de charla.
  const subscribe = useCallback(
    (onChange: () => void) => (viewModel ? viewModel.subscribe(onChange) : () => undefined),
    [viewModel],
  );
  const getMessageCount = useCallback(
    () => (viewModel ? viewModel.getState().messages.length : 0),
    [viewModel],
  );
  const canShare = useSyncExternalStore(subscribe, getMessageCount) > 0;

  const shareConversation = async (): Promise<void> => {
    if (viewModel === null || !viewModel.hasMessages) {
      return;
    }
    try {
      await Share.share({ message: viewModel.exportText() });
    } catch {
      // El usuario canceló el share sheet (o la plataforma no lo soporta): sin acción.
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10} style={styles.menuButton}>
          <Text style={styles.menuIcon}>⚙️</Text>
        </Pressable>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => void shareConversation()}
            hitSlop={10}
            style={styles.menuButton}
            disabled={!canShare}
            accessibilityLabel="Compartir conversación"
          >
            <Text style={[styles.menuIcon, !canShare && styles.menuIconDisabled]}>📤</Text>
          </Pressable>
          <Pressable onPress={() => setDrawerOpen(true)} hitSlop={10} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </View>
      ),
    });
    // canShare/viewModel en deps: el botón refleja la conversación activa y si tiene mensajes.
  }, [navigation, viewModel, canShare]);

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
        <ChatView
          viewModel={viewModel}
          activeConversationId={conversationId}
          onSelectConversation={selectConversation}
          onNewConversation={newConversation}
        />
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuButton: { paddingHorizontal: 6 },
  menuIcon: { color: colors.textPrimary, fontSize: 22, fontWeight: font.bold },
  menuIconDisabled: { opacity: 0.35 },
});
