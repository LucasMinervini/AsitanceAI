/**
 * Sugerencias del empty state según la categoría del agente activo. Módulo puro y
 * testeable: la UI solo renderiza el resultado. Evita proponer prompts de chat
 * cuando el agente activo genera imágenes o video (y viceversa).
 *
 * Las categorías coinciden con las de AGENT_META (AgentSelector): 'Chat',
 * 'Creación de imágenes', 'Video'.
 */
const CHAT: readonly string[] = [
  'Armame un plan de viaje de 3 días',
  'Explicame un concepto difícil',
  'Dame una receta rápida y rica',
];

const IMAGE: readonly string[] = [
  'Un zorro astronauta flotando, estilo neón',
  'Un faro en un acantilado al atardecer',
  'Un gato retratado como cuadro renacentista',
];

const VIDEO: readonly string[] = [
  'Olas rompiendo en una playa al amanecer',
  'Time-lapse de una ciudad de noche',
  'Un colibrí volando en cámara lenta',
];

export function suggestionsFor(category: string): readonly string[] {
  if (category === 'Creación de imágenes') return IMAGE;
  if (category === 'Video') return VIDEO;
  return CHAT;
}
