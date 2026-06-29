import { describe, it, expect } from 'vitest';
import { createContainer } from '@infrastructure/di/container';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { TranscribeAudio } from '@application/use-cases/TranscribeAudio';
import { RenameConversation } from '@application/use-cases/RenameConversation';
import { AsyncStorageConversationRepo } from '@adapters/persistence/AsyncStorageConversationRepo';
import type { BinaryUpload, ImageDownload } from '@adapters/ai-agents/http';
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
} as const;

const noopUpload: BinaryUpload = async () => ({ status: 200, body: '{"text":"ok"}' });
const noopDownload: ImageDownload = async () => ({ status: 200, dataUrl: '', body: '' });

describe('createContainer', () => {
  it('cablea el use-case SendAssistantQuery', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload);

    expect(container.sendAssistantQuery).toBeInstanceOf(SendAssistantQuery);
  });

  it('expone un ConversationRepository respaldado por el storage inyectado', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload);

    expect(container.conversationRepository).toBeInstanceOf(AsyncStorageConversationRepo);
  });

  it('cablea el use-case TranscribeAudio', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload);

    expect(container.transcribeAudio).toBeInstanceOf(TranscribeAudio);
  });

  it('cablea el use-case RenameConversation', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload);

    expect(container.renameConversation).toBeInstanceOf(RenameConversation);
  });

  it('expone un selector de agentes con el proveedor configurado', () => {
    const container = createContainer(env, new FakeKeyValueStorage(), noopUpload, noopDownload);

    expect(container.agentSelector.available).toContain('ollama');
    expect(container.agentSelector.available).toContain('flux');
    expect(container.agentSelector.available).toContain('krea');
    expect(container.agentSelector.available).toContain('hunyuan');
    expect(container.agentSelector.selected).toBe('ollama');
  });
});
