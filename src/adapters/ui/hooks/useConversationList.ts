import { useMemo, useSyncExternalStore } from 'react';
import {
  ConversationListViewModel,
  type ConversationListState,
} from '../view-models/ConversationListViewModel';
import { useDependencies } from '../di/DependenciesContext';

export interface UseConversationList {
  readonly state: ConversationListState;
  readonly viewModel: ConversationListViewModel;
}

/** Crea el ConversationListViewModel desde las dependencias y lo enlaza a React. */
export function useConversationList(): UseConversationList {
  const deps = useDependencies();
  const viewModel = useMemo(
    () =>
      new ConversationListViewModel(
        deps.listConversations,
        deps.deleteConversation,
        deps.renameConversation,
      ),
    [deps],
  );
  const state = useSyncExternalStore(
    (onChange) => viewModel.subscribe(onChange),
    () => viewModel.getState(),
  );
  return { state, viewModel };
}
