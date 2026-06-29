import { describe, expect, it } from 'vitest';
import {
  composeAttachmentMessage,
  type Attachment,
} from '@adapters/ui/view-models/composeAttachmentMessage';

const aTextFile: Attachment = { name: 'notas.txt', content: 'linea uno\nlinea dos' };
const anImage: Attachment = { name: 'foto.png', content: null };

describe('composeAttachmentMessage', () => {
  it('devuelve el texto recortado cuando no hay adjunto', () => {
    expect(composeAttachmentMessage('  hola mundo  ', null)).toBe('hola mundo');
  });

  it('incluye nombre y contenido del adjunto de texto debajo del mensaje', () => {
    const result = composeAttachmentMessage('resumime esto', aTextFile);
    expect(result).toBe('resumime esto\n\n📎 notas.txt\n\nlinea uno\nlinea dos');
  });

  it('usa solo el adjunto cuando el usuario no escribio texto', () => {
    const result = composeAttachmentMessage('   ', aTextFile);
    expect(result).toBe('📎 notas.txt\n\nlinea uno\nlinea dos');
  });

  it('muestra solo el nombre cuando el adjunto no tiene contenido legible (ej. imagen)', () => {
    expect(composeAttachmentMessage('mira esto', anImage)).toBe('mira esto\n\n📎 foto.png');
  });

  it('produce solo el encabezado si no hay texto ni contenido legible', () => {
    expect(composeAttachmentMessage('', anImage)).toBe('📎 foto.png');
  });

  it('ignora previewUri (es presentacional, no va al prompt)', () => {
    const conPreview: Attachment = { name: 'foto.png', content: null, previewUri: 'file:///foto.png' };
    expect(composeAttachmentMessage('mira esto', conPreview)).toBe('mira esto\n\n📎 foto.png');
  });
});
