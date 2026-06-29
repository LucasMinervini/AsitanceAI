import { DomainError } from './DomainError';

/** Se lanza cuando un Value Object recibe datos invalidos en construccion. */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}
