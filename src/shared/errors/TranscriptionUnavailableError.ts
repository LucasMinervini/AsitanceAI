import { DomainError } from './DomainError';

/** Un adaptador de transcripción (speech-to-text) traduce cualquier fallo a este error. */
export class TranscriptionUnavailableError extends DomainError {
  readonly code = 'TRANSCRIPTION_UNAVAILABLE';
}
