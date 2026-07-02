import { describe, it, expect } from 'vitest';
import { createVideoGenerators } from '@infrastructure/di/createVideoGenerators';
import { WanVideoAdapter } from '@adapters/ai-agents/WanVideoAdapter';
import type { VideoInference } from '@adapters/ai-agents/http';
import type { EnvConfig } from '@infrastructure/config/env';

const env = {
  aiAgentProvider: 'ollama',
  aiAgentBaseUrl: 'http://localhost:11434/api',
  aiAgentModel: 'llama3.2',
  aiAgentApiKey: 'hf_test',
  sttBaseUrl: 'https://router.huggingface.co/hf-inference/models',
  sttModel: 'openai/whisper-large-v3',
  imageBaseUrl: 'https://router.huggingface.co/hf-inference/models',
  imageModel: 'black-forest-labs/FLUX.1-schnell',
  videoBaseUrl: 'https://router.huggingface.co/hf-inference/models',
  videoModel: 'krea/krea-realtime-video',
  hunyuanBaseUrl: 'https://router.huggingface.co/fal-ai',
  hunyuanModel: 'hunyuan-video',
  falVideoBaseUrl: 'https://router.huggingface.co/fal-ai',
  wanModel: 'Wan-AI/Wan2.1-T2V-1.3B',
  animateDiffModel: 'ByteDance/AnimateDiff-Lightning',
} as const satisfies EnvConfig;

const noopInference: VideoInference = async () => ({ status: 200, url: 'x.mp4', body: '' });

describe('createVideoGenerators', () => {
  it('arma un record exhaustivo con un adapter por modelo de video', () => {
    const generators = createVideoGenerators(env, noopInference);

    expect(Object.keys(generators).sort()).toEqual(['animatediff', 'hunyuan', 'wan']);
    expect(generators.wan).toBeInstanceOf(WanVideoAdapter);
    expect(generators.hunyuan).toBeInstanceOf(WanVideoAdapter);
    expect(generators.animatediff).toBeInstanceOf(WanVideoAdapter);
  });
});
