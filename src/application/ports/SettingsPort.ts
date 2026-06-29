/** Overrides de configuracion que el usuario puede cambiar desde la app en runtime. */
export interface StoredSettings {
  readonly apiKey?: string;
  readonly ollamaBaseUrl?: string;
}

/** Port de persistencia de ajustes. La implementacion real usa AsyncStorage. */
export interface SettingsPort {
  load(): Promise<StoredSettings>;
  save(settings: StoredSettings): Promise<void>;
}
