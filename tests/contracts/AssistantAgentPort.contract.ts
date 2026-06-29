import { describe, it, expect } from 'vitest';
import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import { OllamaLocalAgentAdapter } from '@adapters/ai-agents/OllamaLocalAgentAdapter';
import { HuggingFaceAgentAdapter } from '@adapters/ai-agents/HuggingFaceAgentAdapter';
import type { FetchLike } from '@adapters/ai-agents/http';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import { MessageBuilder } from '../builders/MessageBuilder';

/**
 * Escenarios que cualquier proveedor de IA puede presentar. El contrato es
 * agnostico del transporte; cada adaptador traduce su realidad a estos casos.
 */
type AgentScenario =
  | { kind: 'replies'; text: string }
  | { kind: 'transportDown' } // no hay conexion (throw)
  | { kind: 'providerError' } // el proveedor responde con estado de error
  | { kind: 'malformed' }; // respuesta 200 con forma inesperada

/**
 * Contrato reutilizable del AssistantAgentPort. Cuando se agregue otro adaptador
 * (HuggingFace, etc.) se invoca esta misma funcion con su factory y debe pasar igual.
 */
function assistantAgentContract(
  name: string,
  makeAgent: (scenario: AgentScenario) => AssistantAgentPort,
): void {
  const history = [MessageBuilder.aMessage().withText('Hola').build()];

  describe(`AssistantAgentPort: ${name}`, () => {
    it('devuelve un Message de assistant ante un historial valido', async () => {
      const agent = makeAgent({ kind: 'replies', text: 'Hola humano' });

      const result = await agent.ask(history);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.role).toBe('assistant');
        expect(result.value.text).toBe('Hola humano');
      }
    });

    it('traduce una caida de transporte a AgentUnavailableError', async () => {
      const agent = makeAgent({ kind: 'transportDown' });

      const result = await agent.ask(history);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(AgentUnavailableError);
      }
    });

    it('traduce un estado de error del proveedor a AgentUnavailableError', async () => {
      const agent = makeAgent({ kind: 'providerError' });

      const result = await agent.ask(history);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(AgentUnavailableError);
      }
    });

    it('traduce una respuesta con forma inesperada a AgentUnavailableError', async () => {
      const agent = makeAgent({ kind: 'malformed' });

      const result = await agent.ask(history);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(AgentUnavailableError);
      }
    });
  });
}

/** Fake de fetch que simula el endpoint /api/chat de Ollama segun el escenario. */
function ollamaFetch(scenario: AgentScenario): FetchLike {
  return async () => {
    switch (scenario.kind) {
      case 'transportDown':
        throw new Error('ECONNREFUSED');
      case 'providerError':
        return { ok: false, status: 503, json: async () => ({}) };
      case 'malformed':
        return { ok: true, status: 200, json: async () => ({ unexpected: true }) };
      case 'replies':
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: { role: 'assistant', content: scenario.text } }),
        };
    }
  };
}

assistantAgentContract(
  'OllamaLocalAgentAdapter',
  (scenario) =>
    new OllamaLocalAgentAdapter({
      baseUrl: 'http://localhost:11434/api',
      model: 'llama3.2',
      fetchFn: ollamaFetch(scenario),
    }),
);

/** Fake de fetch que simula la API chat-completions de HuggingFace (DTO distinto). */
function huggingFaceFetch(scenario: AgentScenario): FetchLike {
  return async () => {
    switch (scenario.kind) {
      case 'transportDown':
        throw new Error('ECONNREFUSED');
      case 'providerError':
        return { ok: false, status: 503, json: async () => ({}) };
      case 'malformed':
        return { ok: true, status: 200, json: async () => ({ unexpected: true }) };
      case 'replies':
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { role: 'assistant', content: scenario.text } }],
          }),
        };
    }
  };
}

assistantAgentContract(
  'HuggingFaceAgentAdapter',
  (scenario) =>
    new HuggingFaceAgentAdapter({
      baseUrl: 'https://router.huggingface.co/v1',
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      apiKey: 'hf_test_token',
      fetchFn: huggingFaceFetch(scenario),
    }),
);
