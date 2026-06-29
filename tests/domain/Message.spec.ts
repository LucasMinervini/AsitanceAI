import { describe, it, expect } from 'vitest';
import { Message } from '@domain/entities/Message';
import { ValidationError } from '@shared/errors/ValidationError';

describe('Message', () => {
  it('exige texto no vacio', () => {
    expect(() => Message.create({ role: 'user', text: '   ' })).toThrowError(ValidationError);
  });

  it('por defecto no lleva imagen', () => {
    const message = Message.create({ role: 'user', text: 'hola' });

    expect(message.imageUrl).toBeUndefined();
  });

  it('conserva la imagen (data URL) para mensajes multimodales', () => {
    const dataUrl = 'data:image/jpeg;base64,AAAA';
    const message = Message.create({ role: 'user', text: '¿qué ves?', imageUrl: dataUrl });

    expect(message.imageUrl).toBe(dataUrl);
  });
});
