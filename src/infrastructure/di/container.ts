import { RoutingAssistantAgent } from '@adapters/ai-agents/RoutingAssistantAgent';
import { HuggingFaceTranscriptionAdapter } from '@adapters/ai-agents/HuggingFaceTranscriptionAdapter';
import type { BinaryUpload, FetchLike, ImageDownload } from '@adapters/ai-agents/http';
import {
  AsyncStorageConversationRepo,
  type KeyValueStorage,
} from '@adapters/persistence/AsyncStorageConversationRepo';
import type { AgentSelector } from '@adapters/ui/di/DependenciesContext';
import type { ConversationRepository } from '@application/ports/ConversationRepository';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { ListConversations } from '@application/use-cases/ListConversations';
import { DeleteConversation } from '@application/use-cases/DeleteConversation';
import { GetConversation } from '@application/use-cases/GetConversation';
import { RenameConversation } from '@application/use-cases/RenameConversation';
import { TranscribeAudio } from '@application/use-cases/TranscribeAudio';
import type { AiAgentProvider, EnvConfig } from '../config/env';
import { createAssistantAgents } from './createAssistantAgents';

/** Grafo de dependencias ya cableado que el resto de la app (UI) consume. */
export interface Container {
  readonly sendAssistantQuery: SendAssistantQuery;
  readonly listConversations: ListConversations;
  readonly deleteConversation: DeleteConversation;
  readonly renameConversation: RenameConversation;
  readonly getConversation: GetConversation;
  readonly transcribeAudio: TranscribeAudio;
  readonly conversationRepository: ConversationRepository;
  readonly agentSelector: AgentSelector;
  readonly hasCompletedOnboarding: () => Promise<boolean>;
  readonly completeOnboarding: () => Promise<void>;
}

/** Adapta el fetch global al FetchLike del adaptador (desacopla de los tipos DOM). */
const httpFetch: FetchLike = (url, init) => fetch(url, init);

/**
 * Composition Root: UNICO lugar donde se instancian las clases concretas y se
 * inyectan unas en otras. Recibe la config validada (loadEnv), el almacenamiento de
 * la plataforma (AsyncStorage en el runtime; un fake en los tests) y el uploader
 * binario para el audio (uploadAsync de expo-file-system en runtime; un fake en tests).
 */
export function createContainer(
  env: EnvConfig,
  storage: KeyValueStorage,
  binaryUpload: BinaryUpload,
  imageDownload: ImageDownload,
): Container {
  const routingAgent = new RoutingAssistantAgent(
    createAssistantAgents(env, httpFetch, imageDownload),
    env.aiAgentProvider,
  );
  const transcription = new HuggingFaceTranscriptionAdapter({
    baseUrl: env.sttBaseUrl,
    model: env.sttModel,
    apiKey: env.sttApiKey ?? '',
    upload: binaryUpload,
  });
  const conversationRepository = new AsyncStorageConversationRepo(storage);

  const modelLabel = env.aiAgentModel.split('/').pop() ?? env.aiAgentModel;
  const agentSelector: AgentSelector = {
    available: routingAgent.available,
    model: modelLabel,
    get selected() {
      return routingAgent.selected;
    },
    select: (provider) => {
      routingAgent.select(provider as AiAgentProvider);
    },
  };

  return {
    conversationRepository,
    agentSelector,
    sendAssistantQuery: new SendAssistantQuery(routingAgent, conversationRepository),
    listConversations: new ListConversations(conversationRepository),
    deleteConversation: new DeleteConversation(conversationRepository),
    renameConversation: new RenameConversation(conversationRepository),
    getConversation: new GetConversation(conversationRepository),
    transcribeAudio: new TranscribeAudio(transcription),
    hasCompletedOnboarding: () =>
      storage.getItem('onboarding:done').then((v) => v === '1'),
    completeOnboarding: () =>
      storage.setItem('onboarding:done', '1'),
  };
}
