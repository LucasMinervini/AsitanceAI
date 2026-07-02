import { describe, it, expect } from 'vitest';
import { VideoAssistantAdapter } from '@adapters/ai-agents/VideoAssistantAdapter';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import { MessageBuilder } from '../../builders/MessageBuilder';
import { GeneratedVideoBuilder } from '../../builders/GeneratedVideoBuilder';
import { FakeVideoGenerator } from '../../fakes/FakeVideoGenerator';

const history = [MessageBuilder.aMessage().withText('un gato surfeando').build()];

describe('VideoAssistantAdapter', () => {
  it('genera un video y lo devuelve como Message de assistant con videoUrl', async () => {
    const generator = FakeVideoGenerator.thatReturns(
      GeneratedVideoBuilder.aVideo().withUrl('https://cdn/out.mp4').build(),
    );
    const adapter = new VideoAssistantAdapter(generator);

    const result = await adapter.ask(history);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe('assistant');
      expect(result.value.videoUrl).toBe('https://cdn/out.mp4');
      expect(result.value.text.length).toBeGreaterThan(0);
    }
    // Pasa el último prompt del usuario al generador.
    expect(generator.receivedRequest?.prompt).toBe('un gato surfeando');
  });

  it('sin prompt del usuario devuelve AgentUnavailableError', async () => {
    const adapter = new VideoAssistantAdapter(
      FakeVideoGenerator.thatReturns(GeneratedVideoBuilder.aVideo().build()),
    );

    const result = await adapter.ask([]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AgentUnavailableError);
    }
  });

  it('traduce un fallo del generador a AgentUnavailableError', async () => {
    const adapter = new VideoAssistantAdapter(FakeVideoGenerator.thatIsUnavailable());

    const result = await adapter.ask(history);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AgentUnavailableError);
    }
  });
});
