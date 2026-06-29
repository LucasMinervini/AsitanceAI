import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import { Message } from '@domain/entities/Message';
import { ok, err, type Result } from '@shared/result/Result';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';

/**
 * Fake en memoria del AssistantAgentPort para los tests de aceptacion.
 * Sin I/O real: se configura via factories segun el escenario.
 */
export class FakeAssistantAgent implements AssistantAgentPort {
  private reply: Message | null = null;
  private failure: AgentUnavailableError | null = null;

  /** Historial que recibio en la ultima llamada a ask (para aserciones). */
  public receivedHistory: readonly Message[] | null = null;

  static thatReplies(text: string): FakeAssistantAgent {
    const fake = new FakeAssistantAgent();
    fake.reply = Message.create({ role: 'assistant', text });
    return fake;
  }

  static thatIsUnavailable(): FakeAssistantAgent {
    const fake = new FakeAssistantAgent();
    fake.failure = new AgentUnavailableError('El agente de IA no esta disponible.');
    return fake;
  }

  async ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    this.receivedHistory = history;
    if (this.failure) {
      return err(this.failure);
    }
    if (this.reply) {
      return ok(this.reply);
    }
    return err(new AgentUnavailableError('Fake sin respuesta configurada.'));
  }
}
