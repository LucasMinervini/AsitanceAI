import { OllamaLocalAgentAdapter } from '@adapters/ai-agents/OllamaLocalAgentAdapter';
import { HuggingFaceAgentAdapter } from '@adapters/ai-agents/HuggingFaceAgentAdapter';
import { HuggingFaceImageAdapter } from '@adapters/ai-agents/HuggingFaceImageAdapter';
import { WanVideoAdapter } from '@adapters/ai-agents/WanVideoAdapter';
import { VideoAssistantAdapter } from '@adapters/ai-agents/VideoAssistantAdapter';
import type { FetchLike, ImageDownload, VideoInference } from '@adapters/ai-agents/http';
import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import type { AiAgentProvider, EnvConfig } from '../config/env';

/**
 * Construye un agente por cada proveedor soportado. El RoutingAssistantAgent usa
 * este record para cambiar de proveedor en runtime. Record exhaustivo: agregar un
 * AiAgentProvider obliga a contemplarlo aquí.
 *
 * Los proveedores de **video** (krea, hunyuan) se surften al chat vía
 * `VideoAssistantAdapter(WanVideoAdapter)`: usan el mismo flujo de `send()` y devuelven
 * un Message con `videoUrl` (el core de la capacidad vive en el Port VideoGenerator).
 */
export function createAssistantAgents(
  env: EnvConfig,
  fetchFn: FetchLike,
  imageDownload: ImageDownload,
  videoInference: VideoInference,
): Record<AiAgentProvider, AssistantAgentPort> {
  const apiKey = env.aiAgentApiKey ?? '';

  const videoAgent = (model: string): AssistantAgentPort =>
    new VideoAssistantAdapter(
      new WanVideoAdapter({ baseUrl: env.falVideoBaseUrl, model, apiKey, videoInference }),
    );

  return {
    ollama: new OllamaLocalAgentAdapter({
      baseUrl: env.aiAgentBaseUrl,
      model: env.aiAgentModel,
      fetchFn,
    }),
    huggingface: new HuggingFaceAgentAdapter({
      baseUrl: env.aiAgentBaseUrl,
      model: env.aiAgentModel,
      apiKey,
      fetchFn,
    }),
    flux: new HuggingFaceImageAdapter({
      baseUrl: env.imageBaseUrl,
      model: env.imageModel,
      apiKey,
      download: imageDownload,
    }),
    krea: videoAgent(env.videoModel),
    hunyuan: videoAgent(env.hunyuanModel),
  };
}
