import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import type { VideoGenerator } from '@application/ports/VideoGenerator';
import type { Message } from '@domain/entities/Message';
import { Message as MessageEntity } from '@domain/entities/Message';
import { err, ok, type Result } from '@shared/result/Result';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';

/**
 * Puente entre la capacidad de video (VideoGenerator) y el flujo de chat: implementa
 * AssistantAgentPort para que un modelo de video se use como un agente más (mismo
 * `send()` optimista, persistencia, registry). Toma el último mensaje del usuario como
 * prompt, genera el video y lo devuelve como un Message de rol `assistant` con `videoUrl`.
 * Traduce los fallos del generador a AgentUnavailableError (el contrato del chat).
 */
export class VideoAssistantAdapter implements AssistantAgentPort {
  constructor(private readonly generator: VideoGenerator) {}

  async ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    const last = history.at(-1);
    if (last === undefined || last.role !== 'user') {
      return err(new AgentUnavailableError('Sin prompt de usuario para generar el video.'));
    }

    const result = await this.generator.generate({ prompt: last.text, image: last.imageUrl ? { dataUrl: last.imageUrl } : undefined });
    if (!result.ok) {
      return err(new AgentUnavailableError(result.error.message));
    }

    return ok(
      MessageEntity.create({
        role: 'assistant',
        text: '🎬 Video generado',
        videoUrl: result.value.url,
      }),
    );
  }
}
