import { z } from 'zod';

/**
 * UNICO punto del codebase que lee process.env. Valida con Zod y falla rapido
 * (throw) al arrancar si la configuracion es invalida. Las API keys nunca salen
 * de aqui hacia domain/application: se inyectan via el container.
 */
export type AiAgentProvider = 'ollama' | 'huggingface' | 'flux' | 'krea' | 'hunyuan';

/** Modelos del nuevo VideoGenerator (por capacidad), enrutados por fal-ai. */
export type VideoModelId = 'wan' | 'hunyuan' | 'animatediff';

const envSchema = z
  .object({
    AI_AGENT_PROVIDER: z.enum(['ollama', 'huggingface', 'flux', 'krea', 'hunyuan']).default('ollama'),
    AI_AGENT_BASE_URL: z.string().url(),
    AI_AGENT_MODEL: z.string().min(1),
    AI_AGENT_API_KEY: z.string().min(1).optional(),
    // Speech-to-text (Whisper en HuggingFace). Independiente del proveedor de chat:
    // si falta la key, el adaptador falla en tiempo de llamada y la UI lo muestra.
    AI_STT_BASE_URL: z.string().url().default('https://router.huggingface.co/hf-inference/models'),
    AI_STT_MODEL: z.string().min(1).default('openai/whisper-large-v3'),
    AI_STT_API_KEY: z.string().min(1).optional(),
    // Generación de imágenes (FLUX vía HuggingFace serverless):
    AI_IMAGE_BASE_URL: z.string().url().default('https://router.huggingface.co/hf-inference/models'),
    AI_IMAGE_MODEL: z.string().min(1).default('black-forest-labs/FLUX.1-schnell'),
    // Generación de video (krea-realtime-video vía Colab/ngrok o endpoint propio):
    AI_VIDEO_BASE_URL: z.string().url().default('https://router.huggingface.co/hf-inference/models'),
    AI_VIDEO_MODEL: z.string().min(1).default('krea/krea-realtime-video'),
    // HunyuanVideo-1.5 vía fal-ai provider en HuggingFace router:
    AI_HUNYUAN_BASE_URL: z.string().url().default('https://router.huggingface.co/fal-ai'),
    AI_HUNYUAN_MODEL: z.string().min(1).default('hunyuan-video'),
    // Nuevo VideoGenerator (por capacidad): todos los modelos van por fal-ai en el router HF.
    AI_FAL_VIDEO_BASE_URL: z.string().url().default('https://router.huggingface.co/fal-ai'),
    AI_WAN_MODEL: z.string().min(1).default('Wan-AI/Wan2.1-T2V-1.3B'),
    AI_ANIMATEDIFF_MODEL: z.string().min(1).default('ByteDance/AnimateDiff-Lightning'),
  })
  .superRefine((data, ctx) => {
    const needsKey = ['huggingface', 'flux', 'hunyuan'] as const;
    if (
      needsKey.includes(data.AI_AGENT_PROVIDER as (typeof needsKey)[number]) &&
      data.AI_AGENT_API_KEY === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_AGENT_API_KEY'],
        message: 'AI_AGENT_API_KEY es requerida para el proveedor huggingface.',
      });
    }
  });

export interface EnvConfig {
  readonly aiAgentProvider: AiAgentProvider;
  readonly aiAgentBaseUrl: string;
  readonly aiAgentModel: string;
  readonly aiAgentApiKey?: string;
  readonly sttBaseUrl: string;
  readonly sttModel: string;
  readonly sttApiKey?: string;
  readonly imageBaseUrl: string;
  readonly imageModel: string;
  readonly videoBaseUrl: string;
  readonly videoModel: string;
  readonly hunyuanBaseUrl: string;
  readonly hunyuanModel: string;
  readonly falVideoBaseUrl: string;
  readonly wanModel: string;
  readonly animateDiffModel: string;
}

export function loadEnv(source: Record<string, string | undefined> = process.env): EnvConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Configuracion de entorno invalida: ${parsed.error.message}`);
  }

  return {
    aiAgentProvider: parsed.data.AI_AGENT_PROVIDER,
    aiAgentBaseUrl: parsed.data.AI_AGENT_BASE_URL,
    aiAgentModel: parsed.data.AI_AGENT_MODEL,
    aiAgentApiKey: parsed.data.AI_AGENT_API_KEY,
    sttBaseUrl: parsed.data.AI_STT_BASE_URL,
    sttModel: parsed.data.AI_STT_MODEL,
    sttApiKey: parsed.data.AI_STT_API_KEY,
    imageBaseUrl: parsed.data.AI_IMAGE_BASE_URL,
    imageModel: parsed.data.AI_IMAGE_MODEL,
    videoBaseUrl: parsed.data.AI_VIDEO_BASE_URL,
    videoModel: parsed.data.AI_VIDEO_MODEL,
    hunyuanBaseUrl: parsed.data.AI_HUNYUAN_BASE_URL,
    hunyuanModel: parsed.data.AI_HUNYUAN_MODEL,
    falVideoBaseUrl: parsed.data.AI_FAL_VIDEO_BASE_URL,
    wanModel: parsed.data.AI_WAN_MODEL,
    animateDiffModel: parsed.data.AI_ANIMATEDIFF_MODEL,
  };
}

/**
 * Fuente de configuracion para el runtime de Expo. En RN no hay un .env: las vars
 * EXPO_PUBLIC_* las inyecta Babel en tiempo de build. Provee defaults locales para
 * que la app arranque contra un Ollama local sin configuracion adicional.
 */
export function expoEnvSource(): Record<string, string | undefined> {
  return {
    AI_AGENT_PROVIDER: process.env.EXPO_PUBLIC_AI_AGENT_PROVIDER ?? 'ollama',
    AI_AGENT_BASE_URL: process.env.EXPO_PUBLIC_AI_AGENT_BASE_URL ?? 'http://localhost:11434/api',
    AI_AGENT_MODEL: process.env.EXPO_PUBLIC_AI_AGENT_MODEL ?? 'llama3.2',
    AI_AGENT_API_KEY: process.env.EXPO_PUBLIC_AI_AGENT_API_KEY,
    AI_STT_BASE_URL:
      process.env.EXPO_PUBLIC_AI_STT_BASE_URL ?? 'https://router.huggingface.co/hf-inference/models',
    AI_STT_MODEL: process.env.EXPO_PUBLIC_AI_STT_MODEL ?? 'openai/whisper-large-v3',
    AI_STT_API_KEY: process.env.EXPO_PUBLIC_AI_STT_API_KEY ?? process.env.EXPO_PUBLIC_AI_AGENT_API_KEY,
    AI_IMAGE_BASE_URL:
      process.env.EXPO_PUBLIC_AI_IMAGE_BASE_URL ??
      'https://router.huggingface.co/hf-inference/models',
    AI_IMAGE_MODEL:
      process.env.EXPO_PUBLIC_AI_IMAGE_MODEL ?? 'black-forest-labs/FLUX.1-schnell',
    // VIDEO_BASE_URL la setea el usuario con la URL de ngrok que imprime el Colab.
    AI_VIDEO_BASE_URL:
      process.env.EXPO_PUBLIC_AI_VIDEO_BASE_URL ??
      'https://router.huggingface.co/hf-inference/models',
    AI_VIDEO_MODEL:
      process.env.EXPO_PUBLIC_AI_VIDEO_MODEL ?? 'krea/krea-realtime-video',
    // HunyuanVideo usa fal-ai provider en el router de HF: funciona con el token de HF.
    AI_HUNYUAN_BASE_URL:
      process.env.EXPO_PUBLIC_AI_HUNYUAN_BASE_URL ?? 'https://router.huggingface.co/fal-ai',
    AI_HUNYUAN_MODEL:
      process.env.EXPO_PUBLIC_AI_HUNYUAN_MODEL ?? 'hunyuan-video',
    // Nuevo VideoGenerator (Wan / Hunyuan / AnimateDiff) — todos por fal-ai.
    AI_FAL_VIDEO_BASE_URL:
      process.env.EXPO_PUBLIC_AI_FAL_VIDEO_BASE_URL ?? 'https://router.huggingface.co/fal-ai',
    AI_WAN_MODEL: process.env.EXPO_PUBLIC_AI_WAN_MODEL ?? 'Wan-AI/Wan2.1-T2V-1.3B',
    AI_ANIMATEDIFF_MODEL:
      process.env.EXPO_PUBLIC_AI_ANIMATEDIFF_MODEL ?? 'ByteDance/AnimateDiff-Lightning',
  };
}
