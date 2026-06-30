import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useConversationList } from '../hooks/useConversationList';
import { useDependencies } from '../di/DependenciesContext';
import { filterConversations } from '../view-models/filterConversations';
import { colors, font, glow, radius, spacing } from '../theme/theme';

interface HistoryDrawerProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelect: (conversationId: string) => void;
  readonly onNew: () => void;
}

/**
 * Menú lateral derecho translúcido con el historial de conversaciones. Overlay propio
 * (sin @react-navigation/drawer): slide one-shot con Animated.timing (no deja loop de
 * rAF en web). Reutiliza el ConversationListViewModel ya testeado.
 */
export function HistoryDrawer({ visible, onClose, onSelect, onNew }: HistoryDrawerProps) {
  const { state, viewModel } = useConversationList();
  const { chatViewModelRegistry } = useDependencies();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(340, width * 0.84);
  const progress = useRef(new Animated.Value(0)).current;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deletingItem, setDeletingItem] = useState<{ id: string; label: string } | null>(null);
  const [query, setQuery] = useState('');

  const visibleItems = filterConversations(state.items, query);
  const isSearching = query.trim().length > 0;

  const confirmRename = (): void => {
    if (renamingId !== null && renameText.trim().length > 0) {
      void viewModel.rename(renamingId, renameText);
    }
    setRenamingId(null);
  };

  const confirmDelete = (): void => {
    if (deletingItem !== null) {
      chatViewModelRegistry.evict(deletingItem.id); // descarta el VM vivo de la charla borrada
      void viewModel.remove(deletingItem.id);
    }
    setDeletingItem(null);
  };

  useEffect(() => {
    if (visible) {
      void viewModel.load();
    } else {
      setQuery(''); // arranca limpio la proxima vez que se abre
    }
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [visible, progress, viewModel]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [panelWidth, 0] });

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? 'auto' : 'none' }]}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar historial" />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: panelWidth, transform: [{ translateX }] }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.panelTint} pointerEvents="none" />

        <Text style={styles.title}>Historial</Text>

        <Pressable style={styles.newButton} onPress={onNew}>
          <Text style={styles.newButtonText}>+ Nueva conversación</Text>
        </Pressable>

        {state.items.length > 0 ? (
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar en el historial…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {isSearching ? (
              <Pressable hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Limpiar búsqueda">
                <Text style={styles.searchClear}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {state.status === 'error' ? <Text style={styles.error}>{state.error}</Text> : null}

        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            state.status !== 'idle' ? null : (
              <Text style={styles.empty}>
                {isSearching ? `Sin resultados para "${query.trim()}".` : 'Sin conversaciones.'}
              </Text>
            )
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onSelect(item.id)}>
              <View style={styles.rowText}>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.title ?? item.preview}
                </Text>
                <Text style={styles.meta}>{item.messageCount} mensajes</Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setRenameText(item.title ?? '');
                    setRenamingId(item.id);
                  }}
                >
                  <Text style={styles.rename}>Renombrar</Text>
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => setDeletingItem({ id: item.id, label: item.title ?? item.preview })}
                >
                  <Text style={styles.delete}>Borrar</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      </Animated.View>

      {/* Modal de confirmación de borrado. */}
      <Modal
        visible={deletingItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingItem(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeletingItem(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>¿Borrar conversación?</Text>
            <Text style={styles.deleteBody} numberOfLines={2}>
              {deletingItem?.label}
            </Text>
            <Text style={styles.deleteHint}>Esta acción no se puede deshacer.</Text>
            <View style={styles.modalActions}>
              <Pressable hitSlop={8} onPress={() => setDeletingItem(null)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={confirmDelete}>
                <Text style={styles.modalDelete}>Borrar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de renombrado: TextInput propio (Alert.prompt es solo iOS / no cross-platform). */}
      <Modal
        visible={renamingId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenamingId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRenamingId(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Renombrar conversación</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Nombre de la conversación"
              placeholderTextColor={colors.textMuted}
              autoFocus
              onSubmitEditing={confirmRename}
            />
            <View style={styles.modalActions}>
              <Pressable hitSlop={8} onPress={() => setRenamingId(null)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={confirmRename} disabled={renameText.trim().length === 0}>
                <Text
                  style={[
                    styles.modalSave,
                    renameText.trim().length === 0 && styles.modalSaveDisabled,
                  ]}
                >
                  Guardar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...glow('#000000', 0.6, 18),
  },
  panelTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,20,34,0.45)',
  },
  title: {
    color: colors.textPrimary,
    fontSize: font.heading,
    fontFamily: font.displayBold,
    marginBottom: spacing.md,
  },
  newButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...glow(colors.primary, 0.5, 12),
  },
  newButtonText: { color: colors.onPrimary, fontWeight: font.bold, fontSize: font.small },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.md,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: font.small, height: '100%' },
  searchClear: { color: colors.textMuted, fontSize: font.body, fontWeight: font.bold },
  error: { color: colors.danger, marginBottom: spacing.sm },
  listContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, marginRight: spacing.sm },
  preview: { fontSize: font.small, fontWeight: font.semibold, color: colors.textPrimary },
  meta: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rename: { color: colors.cyan, fontWeight: font.bold, fontSize: font.small },
  delete: { color: colors.danger, fontWeight: font.bold, fontSize: font.small },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...glow('#000000', 0.6, 18),
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: font.heading,
    fontFamily: font.displayBold,
    marginBottom: spacing.md,
  },
  modalInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  modalCancel: { color: colors.textMuted, fontWeight: font.semibold, fontSize: font.small },
  modalSave: { color: colors.primaryBright, fontWeight: font.bold, fontSize: font.small },
  modalSaveDisabled: { color: colors.textMuted, opacity: 0.6 },
  deleteBody: {
    color: colors.textPrimary,
    fontSize: font.body,
    marginBottom: spacing.sm,
  },
  deleteHint: {
    color: colors.textMuted,
    fontSize: font.small,
    marginBottom: spacing.sm,
  },
  modalDelete: { color: colors.danger, fontWeight: font.bold, fontSize: font.small },
});
