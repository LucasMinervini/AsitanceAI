import { describe, it, expect } from 'vitest';
import { createContainer } from '@infrastructure/di/container';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { TranscribeAudio } from '@application/use-cases/TranscribeAudio';
import { RenameConversation } from '@application/use-cases/RenameConversation';
import { AsyncStorageConversationRepo } from '@adapters/persistence/AsyncStorageConversationRepo';
import type { BinaryUpload, ImageDownload, VideoInference } from '@adapters/ai-agents/http';
import { FakeKeyValueStorage } from '../fakes/FakeKeyValueStorage';

const env = {
  aiAgentProvider: 'ollama',
  aiAgentBaseUrl: 'http://localhost:11434/api',
  aiAgentModel: 'llama3.2',
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
} as const;

const noopUpload: BinaryUpload = async () => ({ status: 200, body: '{"text":"ok"}' });
const noopDownload: ImageDownload = async () => ({ status: 200, dataUrl: '', body: '' });
const noopVideo: VideoInference = async () => ({ status: 200, url: 'x.mp4', body: '' });

describe('createContainer', () => {
  it('cablea el use-case SendAssistantQuery', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);

    expect(container.sendAssistantQuery).toBeInstanceOf(SendAssistantQuery);
  });

  it('expone un ConversationRepository respaldado por el storage inyectado', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);

    expect(container.conversationRepository).toBeInstanceOf(AsyncStorageConversationRepo);
  });

  it('cablea el use-case TranscribeAudio', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);

    expect(container.transcribeAudio).toBeInstanceOf(TranscribeAudio);
  });

  it('cablea el use-case RenameConversation', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);

    expect(container.renameConversation).toBeInstanceOf(RenameConversation);
  });

  it('expone un selector de agentes con el proveedor configurado', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);

    expect(container.agentSelector.available).toContain('ollama');
    expect(container.agentSelector.available).toContain('flux');
    expect(container.agentSelector.available).toContain('krea');
    expect(container.agentSelector.available).toContain('hunyuan');
    expect(container.agentSelector.selected).toBe('ollama');
  });

  it('expone un selector de video con los modelos disponibles y GenerateVideo cableado', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);

    expect([...container.videoSelector.available].sort()).toEqual(['animatediff', 'hunyuan', 'wan']);
    expect(container.videoSelector.selected).toBe('wan');
    expect(container.generateVideo).toBeDefined();
  });

  it('el model del selector refleja el modelo del agente ACTIVO (no siempre el de chat)', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload, noopVideo);
    const { agentSelector } = container;

    // Arranca en ollama → modelo de chat.
    expect(agentSelector.model).toBe('llama3.2');

    // Al cambiar de proveedor, el badge muestra el modelo de ESE agente (label corto).
    agentSelector.select('flux');
    expect(agentSelector.model).toBe('FLUX.1-schnell');

    agentSelector.select('hunyuan');
    expect(agentSelector.model).toBe('hunyuan-video');
  });
});
