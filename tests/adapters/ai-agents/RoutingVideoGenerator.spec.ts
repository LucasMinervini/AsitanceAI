import { describe, it, expect } from 'vitest';
import { RoutingVideoGenerator } from '@adapters/ai-agents/RoutingVideoGenerator';
import { FakeVideoGenerator } from '../../fakes/FakeVideoGenerator';
import { GeneratedVideoBuilder } from '../../builders/GeneratedVideoBuilder';

function makeRouter() {
  return new RoutingVideoGenerator(
    {
      wan: FakeVideoGenerator.thatReturns(GeneratedVideoBuilder.aVideo().withUrl('wan.mp4').build()),
      hunyuan: FakeVideoGenerator.thatReturns(
        GeneratedVideoBuilder.aVideo().withUrl('hunyuan.mp4').build(),
      ),
    },
    'wan',
  );
}

describe('RoutingVideoGenerator', () => {
  it('delega en el generador seleccionado inicialmente', async () => {
    const router = makeRouter();

    const result = await router.generate({ prompt: 'x' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toBe('wan.mp4');
    }
  });

  it('select() cambia el generador al que delega', async () => {
    const router = makeRouter();

    router.select('hunyuan');
    const result = await router.generate({ prompt: 'x' });

    expect(router.selected).toBe('hunyuan');
    if (result.ok) {
      expect(result.value.url).toBe('hunyuan.mp4');
    }
  });

  it('expone los modelos disponibles', () => {
    const router = makeRouter();

    expect([...router.available].sort()).toEqual(['hunyuan', 'wan']);
  });

  it('ignora un modelo desconocido', () => {
    const router = makeRouter();

    router.select('inexistente' as 'wan' | 'hunyuan');

    expect(router.selected).toBe('wan');
  });
});
