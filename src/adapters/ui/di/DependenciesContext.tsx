import { createContext, useContext, type ReactNode } from 'react';
import type { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import type { ListConversations } from '@application/use-cases/ListConversations';
import type { DeleteConversation } from '@application/use-cases/DeleteConversation';
import type { RenameConversation } from '@application/use-cases/RenameConversation';
import type { GetConversation } from '@application/use-cases/GetConversation';
import type { TranscribeAudio } from '@application/use-cases/TranscribeAudio';
import type { GetSettings } from '@application/use-cases/GetSettings';
import type { SaveSettings } from '@application/use-cases/SaveSettings';
import type { ChatViewModelRegistry } from '../registry/ChatViewModelRegistry';

/**
 * Dependencias que la UI necesita, expresadas en terminos de use-cases (capa
 * application). El container concreto (infrastructure) las satisface estructuralmente
 * al pasarse al Provider — la UI nunca importa infrastructure.
 */
/** Selector de agente de IA activo (cambia el proveedor en runtime). */
export interface AgentSelector {
  readonly available: readonly string[];
  readonly selected: string;
  /** Nombre corto del modelo configurado (ej. "gemma-3-12b-it"). Para el badge de la UI. */
  readonly model: string;
  select(provider: string): void;
}

export interface UiDependencies {
  readonly sendAssistantQuery: SendAssistantQuery;
  readonly listConversations: ListConversations;
  readonly deleteConversation: DeleteConversation;
  readonly renameConversation: RenameConversation;
  readonly getConversation: GetConversation;
  readonly transcribeAudio: TranscribeAudio;
  readonly agentSelector: AgentSelector;
  readonly hasCompletedOnboarding: () => Promise<boolean>;
  readonly completeOnboarding: () => Promise<void>;
  readonly resetOnboarding: () => Promise<void>;
  readonly getSettings: GetSettings;
  readonly saveSettings: SaveSettings;
  /** Recrea el container leyendo los ajustes guardados — llámalo después de SaveSettings. */
  readonly restartApp: () => void;
  /** Mantiene vivos los ChatViewModel por conversación (concurrencia en vivo, Fase B). */
  readonly chatViewModelRegistry: ChatViewModelRegistry;
}

const DependenciesContext = createContext<UiDependencies | null>(null);

interface ProviderProps {
  readonly deps: UiDependencies;
  readonly children: ReactNode;
}

export function DependenciesProvider({ deps, children }: ProviderProps) {
  return <DependenciesContext.Provider value={deps}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): UiDependencies {
  const deps = useContext(DependenciesContext);
  if (deps === null) {
    throw new Error('useDependencies debe usarse dentro de <DependenciesProvider>.');
  }
  return deps;
}
