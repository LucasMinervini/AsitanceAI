import { useEffect, useRef, useState } from 'react';
import { ChatViewModel } from '../view-models/ChatViewModel';
import { useDependencies } from '../di/DependenciesContext';

/**
 * Devuelve el ChatViewModel de la conversación, tomándolo del registry (Fase B): si ya
 * existe una instancia viva para ese id, se reutiliza —con su estado en vivo, incluido un
 * envío en vuelo— en vez de reconstruirla desde el repo. `peek` sincrónico evita el flash
 * de "cargando" al volver a una charla ya abierta; si no está cacheada, se crea (async).
 *
 * Para el caso sin id explícito (primer arranque sin params) se usa un id estable por la
 * vida de la pantalla, así esa charla también queda cacheada y conserva su estado.
 */
export function useChatViewModel(conversationId?: string): ChatViewModel | null {
  const { chatViewModelRegistry } = useDependencies();
  const fallbackId = useRef(`conv-${Date.now()}`).current;
  const id = conversationId ?? fallbackId;

  const [viewModel, setViewModel] = useState<ChatViewModel | null>(() =>
    chatViewModelRegistry.peek(id) ?? null,
  );

  useEffect(() => {
    let active = true;
    const cached = chatViewModelRegistry.peek(id);
    if (cached !== undefined) {
      setViewModel(cached);
      return;
    }
    // No cacheada: limpiar mientras carga y resolver async.
    setViewModel(null);
    void chatViewModelRegistry.getOrCreate(id).then((vm) => {
      if (active) {
        setViewModel(vm);
      }
    });
    return () => {
      active = false;
    };
  }, [id, chatViewModelRegistry]);

  return viewModel;
}
