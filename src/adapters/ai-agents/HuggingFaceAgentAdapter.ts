import { z } from 'zod';
import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import { Message } from '@domain/entities/Message';
import { ok, err, type Result } from '@shared/result/Result';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import type { FetchLike } from './http';

export interface HuggingFaceConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly fetchFn: FetchLike;
}

/** DTO chat-completions (compatible OpenAI). Solo validamos lo que el dominio necesita. */
const ChatCompletionResponse = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          role: z.string(),
          content: z.string().min(1),
        }),
      }),
    )
    .min(1),
});

/**
 * Adaptador del agente de IA de HuggingFace (Inference / router, chat-completions).
 * Implementa AssistantAgentPort: autentica con Bearer token, parsea el DTO crudo con
 * Zod (forma distinta a Ollama) y traduce CUALQUIER fallo a AgentUnavailableError.
 */
export class HuggingFaceAgentAdapter implements AssistantAgentPort {
  constructor(private readonly config: HuggingFaceConfig) {}

  async ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    try {
      const response = await this.config.fetchFn(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          // Contenido multimodal (OpenAI-compatible): si el mensaje trae una imagen,
          // se manda como un array [texto, image_url] para que el modelo de visión la
          // "vea"; si no, va el texto plano de siempre.
          messages: history.map((message) => ({
            role: message.role,
            content:
              message.imageUrl !== undefined
                ? [
                    { type: 'text', text: message.text },
                    { type: 'image_url', image_url: { url: message.imageUrl } },
                  ]
                : message.text,
          })),
        }),
      });

      if (!response.ok) {
        return err(new AgentUnavailableError(`HuggingFace respondio con estado ${response.status}.`));
      }

      const raw: unknown = await response.json();
      const parsed = ChatCompletionResponse.safeParse(raw);
      if (!parsed.success) {
        return err(new AgentUnavailableError('La respuesta de HuggingFace tiene una forma inesperada.'));
      }

      const choice = parsed.data.choices[0];
      if (choice === undefined) {
        return err(new AgentUnavailableError('La respuesta de HuggingFace no trae choices.'));
      }

      return ok(Message.create({ role: 'assistant', text: choice.message.content }));
    } catch {
      return err(new AgentUnavailableError('No se pudo contactar al agente de IA (HuggingFace).'));
    }
  }
}
