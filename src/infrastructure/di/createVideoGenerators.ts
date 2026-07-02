import { WanVideoAdapter } from '@adapters/ai-agents/WanVideoAdapter';
import type { VideoInference } from '@adapters/ai-agents/http';
import type { VideoGenerator } from '@application/ports/VideoGenerator';
import type { EnvConfig, VideoModelId } from '../config/env';

/**
 * Construye un VideoGenerator por cada modelo soportado. El RoutingVideoGenerator usa
 * este record para cambiar de modelo en runtime. Record exhaustivo: agregar un
 * VideoModelId obliga a contemplarlo aquí. Todos van por fal-ai (router HF) con el token
 * de HuggingFace; el `WanVideoAdapter` está parametrizado por modelo (mismo provider,
 * distinto slug), y puede reemplazarse por un adapter dedicado si un modelo necesita un
 * mapeo de request/response propio.
 */
export function createVideoGenerators(
  env: EnvConfig,
  videoInference: VideoInference,
): Record<VideoModelId, VideoGenerator> {
  const apiKey = env.aiAgentApiKey ?? '';
  const make = (model: string): VideoGenerator =>
    new WanVideoAdapter({ baseUrl: env.falVideoBaseUrl, model, apiKey, videoInference });

  return {
    wan: make(env.wanModel),
    hunyuan: make(env.hunyuanModel),
    animatediff: make(env.animateDiffModel),
  };
}
