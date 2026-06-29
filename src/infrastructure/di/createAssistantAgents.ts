import { OllamaLocalAgentAdapter } from '@adapters/ai-agents/OllamaLocalAgentAdapter';
import { HuggingFaceAgentAdapter } from '@adapters/ai-agents/HuggingFaceAgentAdapter';
import { HuggingFaceImageAdapter } from '@adapters/ai-agents/HuggingFaceImageAdapter';
import type { FetchLike, ImageDownload } from '@adapters/ai-agents/http';
import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import type { Message } from '@domain/entities/Message';
import type { Result } from '@shared/result/Result';
import { err } from '@shared/result/Result';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import type { AiAgentProvider, EnvConfig } from '../config/env';

const HF_DEFAULT_BASE = 'https://router.huggingface.co/hf-inference/models';

/** Devuelve inmediatamente un error descriptivo cuando el endpoint no está configurado. */
class NotConfiguredAgent implements AssistantAgentPort {
  constructor(private readonly hint: string) {}
  async ask(_history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    return err(new AgentUnavailableError(this.hint));
  }
}

/**
 * Construye un agente por cada proveedor soportado. El RoutingAssistantAgent usa
 * este record para cambiar de proveedor en runtime. Record exhaustivo: agregar un
 * AiAgentProvider obliga a contemplarlo aquí.
 */
export function createAssistantAgents(
  env: EnvConfig,
  fetchFn: FetchLike,
  imageDownload: ImageDownload,
): Record<AiAgentProvider, AssistantAgentPort> {
  const kreaConfigured = env.videoBaseUrl !== HF_DEFAULT_BASE;

  return {
    ollama: new OllamaLocalAgentAdapter({
      baseUrl: env.aiAgentBaseUrl,
      model: env.aiAgentModel,
      fetchFn,
    }),
    huggingface: new HuggingFaceAgentAdapter({
      baseUrl: env.aiAgentBaseUrl,
      model: env.aiAgentModel,
      apiKey: env.aiAgentApiKey ?? '',
      fetchFn,
    }),
    flux: new HuggingFaceImageAdapter({
      baseUrl: env.imageBaseUrl,
      model: env.imageModel,
      apiKey: env.aiAgentApiKey ?? '',
      download: imageDownload,
    }),
    krea: kreaConfigured
      ? new HuggingFaceImageAdapter({
          baseUrl: env.videoBaseUrl,
          model: env.videoModel,
          apiKey: env.aiAgentApiKey ?? '',
          download: imageDownload,
        })
      : new NotConfiguredAgent(
          'Krea Video necesita un endpoint propio.\n' +
          'Ejecutá el Colab con FastAPI+ngrok y añadí en .env.local:\n' +
          'EXPO_PUBLIC_AI_VIDEO_BASE_URL=https://tu-url.ngrok.io',
        ),
    hunyuan: new HuggingFaceImageAdapter({
      baseUrl: env.hunyuanBaseUrl,
      model: env.hunyuanModel,
      apiKey: env.aiAgentApiKey ?? '',
      download: imageDownload,
    }),
  };
}
