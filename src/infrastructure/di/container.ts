import { RoutingAssistantAgent } from '@adapters/ai-agents/RoutingAssistantAgent';
import { RoutingVideoGenerator } from '@adapters/ai-agents/RoutingVideoGenerator';
import { HuggingFaceTranscriptionAdapter } from '@adapters/ai-agents/HuggingFaceTranscriptionAdapter';
import type { BinaryUpload, FetchLike, ImageDownload, VideoInference } from '@adapters/ai-agents/http';
import {
  AsyncStorageConversationRepo,
  type KeyValueStorage,
} from '@adapters/persistence/AsyncStorageConversationRepo';
import { AsyncStorageSettingsAdapter } from '@adapters/persistence/AsyncStorageSettingsAdapter';
import type { AgentSelector, VideoSelector } from '@adapters/ui/di/DependenciesContext';
import type { ConversationRepository } from '@application/ports/ConversationRepository';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { ListConversations } from '@application/use-cases/ListConversations';
import { DeleteConversation } from '@application/use-cases/DeleteConversation';
import { GetConversation } from '@application/use-cases/GetConversation';
import { RenameConversation } from '@application/use-cases/RenameConversation';
import { TranscribeAudio } from '@application/use-cases/TranscribeAudio';
import { GenerateVideo } from '@application/use-cases/GenerateVideo';
import { GetSettings } from '@application/use-cases/GetSettings';
import { SaveSettings } from '@application/use-cases/SaveSettings';
import type { AiAgentProvider, EnvConfig, VideoModelId } from '../config/env';
import { createAssistantAgents } from './createAssistantAgents';
import { createVideoGenerators } from './createVideoGenerators';

/** Grafo de dependencias ya cableado que el resto de la app (UI) consume. */
export interface Container {
  readonly sendAssistantQuery: SendAssistantQuery;
  readonly listConversations: ListConversations;
  readonly deleteConversation: DeleteConversation;
  readonly renameConversation: RenameConversation;
  readonly getConversation: GetConversation;
  readonly transcribeAudio: TranscribeAudio;
  readonly generateVideo: GenerateVideo;
  readonly conversationRepository: ConversationRepository;
  readonly agentSelector: AgentSelector;
  readonly videoSelector: VideoSelector;
  readonly hasCompletedOnboarding: () => Promise<boolean>;
  readonly completeOnboarding: () => Promise<void>;
  readonly resetOnboarding: () => Promise<void>;
  readonly getSettings: GetSettings;
  readonly saveSettings: SaveSettings;
}

/** Adapta el fetch global al FetchLike del adaptador (desacopla de los tipos DOM). */
const httpFetch: FetchLike = (url, init) => fetch(url, init);

/**
 * Creates the application container and wires its concrete dependencies.
 *
 * @param env - Validated runtime configuration.
 * @param storage - Key-value storage used for persistence and onboarding state.
 * @param binaryUpload - Upload function used by audio transcription.
 * @param imageDownload - Download function used by assistant agents.
 * @returns The assembled application container.
 */
export function createContainer(
  env: EnvConfig,
  storage: KeyValueStorage,
  binaryUpload: BinaryUpload,
  imageDownload: ImageDownload,
  videoInference: VideoInference,
): Container {
  const routingAgent = new RoutingAssistantAgent(
    createAssistantAgents(env, httpFetch, imageDownload),
    env.aiAgentProvider,
  );
  const routingVideo = new RoutingVideoGenerator<VideoModelId>(
    createVideoGenerators(env, videoInference),
    'wan',
  );
  const transcription = new HuggingFaceTranscriptionAdapter({
    baseUrl: env.sttBaseUrl,
    model: env.sttModel,
    apiKey: env.sttApiKey ?? '',
    upload: binaryUpload,
  });
  const conversationRepository = new AsyncStorageConversationRepo(storage);
  const settingsAdapter = new AsyncStorageSettingsAdapter(storage);

  // Modelo por proveedor: el badge debe mostrar el del agente ACTIVO, no siempre el de
  // chat (antes mostraba "gemma" aun con FLUX/Hunyuan seleccionado).
  const modelByProvider: Record<AiAgentProvider, string> = {
    ollama: env.aiAgentModel,
    huggingface: env.aiAgentModel,
    flux: env.imageModel,
    krea: env.videoModel,
    hunyuan: env.hunyuanModel,
  };
  const shortLabel = (model: string): string => model.split('/').pop() ?? model;

  const agentSelector: AgentSelector = {
    available: routingAgent.available,
    get model() {
      return shortLabel(modelByProvider[routingAgent.selected]);
    },
    get selected() {
      return routingAgent.selected;
    },
    select: (provider) => {
      routingAgent.select(provider as AiAgentProvider);
    },
  };

  const videoSelector: VideoSelector = {
    available: routingVideo.available,
    get selected() {
      return routingVideo.selected;
    },
    select: (model) => {
      routingVideo.select(model as VideoModelId);
    },
  };

  return {
    conversationRepository,
    agentSelector,
    videoSelector,
    generateVideo: new GenerateVideo(routingVideo),
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
    resetOnboarding: () =>
      storage.removeItem('onboarding:done'),
    getSettings: new GetSettings(settingsAdapter),
    saveSettings: new SaveSettings(settingsAdapter),
  };
}
