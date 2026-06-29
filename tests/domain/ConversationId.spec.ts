import { describe, it, expect } from 'vitest';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ValidationError } from '@shared/errors/ValidationError';

// 🔴 RED: el Value Object ConversationId aun no existe.
describe('ConversationId', () => {
  it('dos ids con el mismo valor son iguales', () => {
    expect(ConversationId.of('abc').equals(ConversationId.of('abc'))).toBe(true);
  });

  it('ids con distinto valor no son iguales', () => {
    expect(ConversationId.of('a').equals(ConversationId.of('b'))).toBe(false);
  });

  it('rechaza un valor vacio', () => {
    expect(() => ConversationId.of('   ')).toThrowError(ValidationError);
  });
});
