import type { Message } from '@domain/entities/Message';
import type { Result } from '@shared/result/Result';
import type { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';

/**
 * Port de salida hacia un agente de IA. Expresa el QUE necesita la app
 * (dado el historial, producir la respuesta del asistente), nunca el COMO.
 * Cada adaptante (HuggingFace, Ollama, ...) lo implementa y traduce sus
 * fallos a AgentUnavailableError.
 */
export interface AssistantAgentPort {
  ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>>;
}
