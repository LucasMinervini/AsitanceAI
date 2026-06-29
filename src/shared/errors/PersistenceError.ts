import { DomainError } from './DomainError';

/** Un adaptador de persistencia traduce cualquier fallo de almacenamiento a este error. */
export class PersistenceError extends DomainError {
  readonly code = 'PERSISTENCE_ERROR';
}
