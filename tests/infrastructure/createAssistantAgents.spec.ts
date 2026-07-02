import { describe, it, expect } from 'vitest';
import { createAssistantAgents } from '@infrastructure/di/createAssistantAgents';
import { OllamaLocalAgentAdapter } from '@adapters/ai-agents/OllamaLocalAgentAdapter';
import { HuggingFaceAgentAdapter } from '@adapters/ai-agents/HuggingFaceAgentAdapter';
import { HuggingFaceImageAdapter } from '@adapters/ai-agents/HuggingFaceImageAdapter';
import { VideoAssistantAdapter } from '@adapters/ai-agents/VideoAssistantAdapter';
import type { FetchLike, ImageDownload, VideoInference } from '@adapters/ai-agents/http';

const noopFetch: FetchLike = async () => ({ ok: true, status: 200, json: async () => ({}) });
const noopDownload: ImageDownload = async () => ({ status: 200, dataUrl: '', body: '' });
const noopVideo: VideoInference = async () => ({ status: 200, url: 'x.mp4', body: '' });

const env = {
  aiAgentProvider: 'ollama',
  aiAgentBaseUrl: 'http://localhost:11434/api',
  aiAgentModel: 'llama3.2',
  aiAgentApiKey: 'hf_token',
  sttBaseUrl: 'https://router.huggingface.co/hf-inference/models',
  sttModel: 'openai/whisper-large-v3',
  imageBaseUrl: 'https://router.huggingface.co/hf-inference/models',
  imageModel: 'black-forest-labs/FLUX.1-schnell',
  videoBaseUrl: 'https://abc123.ngrok.io',
  videoModel: 'generate',
  hunyuanBaseUrl: 'https://router.huggingface.co/fal-ai',
  hunyuanModel: 'hunyuan-video',
  falVideoBaseUrl: 'https://router.huggingface.co/fal-ai',
  wanModel: 'Wan-AI/Wan2.1-T2V-1.3B',
  animateDiffModel: 'ByteDance/AnimateDiff-Lightning',
} as const;

describe('createAssistantAgents', () => {
  it('construye un adaptador por proveedor soportado', () => {
    const agents = createAssistantAgents(env, noopFetch, noopDownload, noopVideo);

    expect(agents.ollama).toBeInstanceOf(OllamaLocalAgentAdapter);
    expect(agents.huggingface).toBeInstanceOf(HuggingFaceAgentAdapter);
    expect(agents.flux).toBeInstanceOf(HuggingFaceImageAdapter);
    // krea y hunyuan ahora generan videos reales (VideoGenerator adaptado al chat).
    expect(agents.krea).toBeInstanceOf(VideoAssistantAdapter);
    expect(agents.hunyuan).toBeInstanceOf(VideoAssistantAdapter);
  });
});
