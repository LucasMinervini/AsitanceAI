import { describe, it, expect } from 'vitest';
import { RoutingAssistantAgent } from '@adapters/ai-agents/RoutingAssistantAgent';
import { MessageBuilder } from '../../builders/MessageBuilder';
import { FakeAssistantAgent } from '../../fakes/FakeAssistantAgent';

const history = [MessageBuilder.aMessage().withText('Hola').build()];

function makeRouter() {
  return new RoutingAssistantAgent(
    {
      uno: FakeAssistantAgent.thatReplies('soy uno'),
      dos: FakeAssistantAgent.thatReplies('soy dos'),
    },
    'uno',
  );
}

describe('RoutingAssistantAgent', () => {
  it('delega en el agente seleccionado inicialmente', async () => {
    const router = makeRouter();

    const result = await router.ask(history);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.text).toBe('soy uno');
    }
  });

  it('select() cambia el agente al que delega', async () => {
    const router = makeRouter();

    router.select('dos');
    const result = await router.ask(history);

    expect(router.selected).toBe('dos');
    if (result.ok) {
      expect(result.value.text).toBe('soy dos');
    }
  });

  it('expone los proveedores disponibles', () => {
    const router = makeRouter();

    expect([...router.available].sort()).toEqual(['dos', 'uno']);
  });

  it('ignora un proveedor desconocido', () => {
    const router = makeRouter();

    router.select('inexistente' as 'uno' | 'dos');

    expect(router.selected).toBe('uno');
  });
});
