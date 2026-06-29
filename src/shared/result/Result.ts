/**
 * Result<T, E>: manejo de errores explicito sin lanzar excepciones.
 * Los use-cases y adaptadores devuelven Result en lugar de hacer throw,
 * de modo que el flujo de error es parte de la firma (type-safe).
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok;

export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok;
