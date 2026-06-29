import { useCallback, useSyncExternalStore } from 'react';
import type { ChatState, ChatViewModel } from '../view-models/ChatViewModel';

export interface UseAssistant extends ChatState {
  readonly send: (text: string, imageUrl?: string) => void;
}

/**
 * Puente React <-> ChatViewModel. useSyncExternalStore se suscribe al store del
 * view-model y re-renderiza ante cada cambio de estado. La logica vive en el
 * view-model (testeable sin React); este hook solo la expone a la UI.
 */
export function useAssistant(viewModel: ChatViewModel): UseAssistant {
  const state = useSyncExternalStore(
    (onChange) => viewModel.subscribe(onChange),
    () => viewModel.getState(),
  );

  const send = useCallback(
    (text: string, imageUrl?: string) => {
      void viewModel.send(text, imageUrl);
    },
    [viewModel],
  );

  return { ...state, send };
}
