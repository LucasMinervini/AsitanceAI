import type { Result } from '@shared/result/Result';
import type { TranscriptionUnavailableError } from '@shared/errors/TranscriptionUnavailableError';

/**
 * Clip de audio ya capturado: su uri local (file://…) + el mime type. El Port no lee
 * el archivo (eso es concern del transporte): el adaptador delega la subida del binario
 * en un uploader inyectable, manteniéndose testeable sin I/O real.
 */
export interface AudioClip {
  readonly uri: string;
  readonly mimeType: string;
}

/**
 * Port de salida hacia un servicio de speech-to-text. Expresa el QUE necesita la app
 * (dado un audio, devolver su transcripción en texto), nunca el COMO. El adaptador
 * (HuggingFace Whisper, ...) lo implementa y traduce sus fallos a
 * TranscriptionUnavailableError.
 */
export interface TranscriptionPort {
  transcribe(clip: AudioClip): Promise<Result<string, TranscriptionUnavailableError>>;
}
