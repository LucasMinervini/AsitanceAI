import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import type { Message } from '@domain/entities/Message';
import type { Result } from '@shared/result/Result';
import type { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';

/**
 * Agente que enruta a uno de varios agentes segun el proveedor seleccionado.
 * Implementa AssistantAgentPort (es transparente para el use-case) y permite
 * cambiar el destino en runtime via select(). Generico sobre la clave para no
 * acoplarse a la lista concreta de proveedores (definida en infrastructure).
 */
export class RoutingAssistantAgent<K extends string> implements AssistantAgentPort {
  private current: K;

  constructor(
    private readonly agents: Readonly<Record<K, AssistantAgentPort>>,
    initial: NoInfer<K>,
  ) {
    this.current = initial;
  }

  get available(): readonly K[] {
    return Object.keys(this.agents) as K[];
  }

  get selected(): K {
    return this.current;
  }

  select(provider: K): void {
    if (provider in this.agents) {
      this.current = provider;
    }
  }

  ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    return this.agents[this.current].ask(history);
  }
}
