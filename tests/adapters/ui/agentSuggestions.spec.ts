import { describe, it, expect } from 'vitest';
import { suggestionsFor } from '@adapters/ui/view-models/agentSuggestions';

describe('suggestionsFor', () => {
  it('devuelve prompts de chat para la categoría Chat', () => {
    const s = suggestionsFor('Chat');
    expect(s.length).toBeGreaterThan(0);
    expect(s.join(' ')).toMatch(/plan|receta|concepto/i);
  });

  it('devuelve prompts de imagen para "Creación de imágenes"', () => {
    const s = suggestionsFor('Creación de imágenes');
    expect(s.length).toBeGreaterThan(0);
    // Prompts visuales, distintos a los de chat.
    expect(s).not.toEqual(suggestionsFor('Chat'));
  });

  it('devuelve prompts de video para la categoría Video', () => {
    const s = suggestionsFor('Video');
    expect(s.length).toBeGreaterThan(0);
    expect(s).not.toEqual(suggestionsFor('Chat'));
    expect(s).not.toEqual(suggestionsFor('Creación de imágenes'));
  });

  it('cae a los prompts de chat para una categoría desconocida', () => {
    expect(suggestionsFor('Otros')).toEqual(suggestionsFor('Chat'));
  });
});
