import { DomainError } from './DomainError';

/** Un adaptador de generación de video traduce cualquier fallo de red/proveedor a este error. */
export class VideoUnavailableError extends DomainError {
  readonly code = 'VIDEO_UNAVAILABLE';
}
