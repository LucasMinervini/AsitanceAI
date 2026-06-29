import { z } from 'zod';
import type { GetSettings } from '@application/use-cases/GetSettings';
import type { SaveSettings } from '@application/use-cases/SaveSettings';

/**
 * Mas estricta que el `z.string().url()` de env.ts: ademas de ser una URL valida,
 * exige esquema http(s). Zod `.url()` acepta cosas como `localhost:11434` (esquema
 * `localhost:`) que pasarian env pero el adapter de Ollama no puede usar. Validar aca
 * evita tanto el brick (URL que loadEnv rechaza) como guardar un endpoint inservible.
 */
const urlSchema = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'Debe empezar con http:// o https://');

export type SettingsPhase = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

export interface SettingsState {
  readonly phase: SettingsPhase;
  readonly apiKey: string;
  readonly ollamaBaseUrl: string;
  readonly error?: string;
}

type Listener = () => void;

/**
 * Presenter framework-agnostic de la pantalla de ajustes. Carga los overrides
 * guardados (si existen) y los persiste cuando el usuario guarda. Tras `save`,
 * pone `phase: 'saved'` para que la UI llame a `restartApp()`.
 */
export class SettingsViewModel {
  private state: SettingsState = { phase: 'loading', apiKey: '', ollamaBaseUrl: '' };
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly getSettings: GetSettings,
    private readonly saveSettings: SaveSettings,
  ) {}

  getState(): SettingsState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async load(): Promise<void> {
    const stored = await this.getSettings.execute();
    this.setState({
      phase: 'idle',
      apiKey: stored.apiKey ?? '',
      ollamaBaseUrl: stored.ollamaBaseUrl ?? '',
    });
  }

  async save(apiKey: string, ollamaBaseUrl: string): Promise<void> {
    const trimmedUrl = ollamaBaseUrl.trim();
    // Validar ANTES de persistir: una URL inválida haría que loadEnv() lance en el
    // proximo arranque y la app caiga en la pantalla de error sin vuelta atras.
    if (trimmedUrl !== '' && !urlSchema.safeParse(trimmedUrl).success) {
      this.setState({
        ...this.state,
        phase: 'error',
        error: 'La URL de Ollama no es válida. Incluí el esquema, ej: http://192.168.1.4:11434/api',
      });
      return;
    }
    this.setState({ ...this.state, phase: 'saving' });
    try {
      await this.saveSettings.execute({
        apiKey: apiKey.trim() || undefined,
        ollamaBaseUrl: ollamaBaseUrl.trim() || undefined,
      });
      this.setState({ ...this.state, phase: 'saved' });
    } catch (e) {
      this.setState({
        ...this.state,
        phase: 'error',
        error: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  }

  private setState(next: SettingsState): void {
    this.state = next;
    for (const l of this.listeners) l();
  }
}
