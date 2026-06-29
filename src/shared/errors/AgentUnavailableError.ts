import { DomainError } from './DomainError';

/** Un adaptador de IA traduce cualquier fallo de red/proveedor a este error. */
export class AgentUnavailableError extends DomainError {
  readonly code = 'AGENT_UNAVAILABLE';
}
