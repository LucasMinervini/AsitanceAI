import { z } from 'zod';
import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import { Message } from '@domain/entities/Message';
import { ok, err, type Result } from '@shared/result/Result';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import type { FetchLike } from './http';

export interface OllamaConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly fetchFn: FetchLike;
}

/** Solo validamos los campos que el dominio necesita; el resto del DTO se ignora. */
const OllamaChatResponse = z.object({
  message: z.object({
    role: z.string(),
    content: z.string().min(1),
  }),
});

/**
 * Adaptador del agente de IA Ollama (local, gratuito). Implementa AssistantAgentPort:
 * arma el request /api/chat, parsea el DTO crudo con Zod y traduce CUALQUIER fallo
 * (red, estado de error, forma inesperada) a AgentUnavailableError via Result.
 */
export class OllamaLocalAgentAdapter implements AssistantAgentPort {
  constructor(private readonly config: OllamaConfig) {}

  async ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    try {
      const response = await this.config.fetchFn(`${this.config.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          stream: false,
          messages: history.map((message) => ({ role: message.role, content: message.text })),
        }),
      });

      if (!response.ok) {
        return err(new AgentUnavailableError(`Ollama respondio con estado ${response.status}.`));
      }

      const raw: unknown = await response.json();
      const parsed = OllamaChatResponse.safeParse(raw);
      if (!parsed.success) {
        return err(new AgentUnavailableError('La respuesta de Ollama tiene una forma inesperada.'));
      }

      return ok(Message.create({ role: 'assistant', text: parsed.data.message.content }));
    } catch {
      return err(new AgentUnavailableError('No se pudo contactar al agente de IA (Ollama).'));
    }
  }
}
