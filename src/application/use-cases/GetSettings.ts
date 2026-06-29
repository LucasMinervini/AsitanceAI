import type { SettingsPort, StoredSettings } from '../ports/SettingsPort';

export class GetSettings {
  constructor(private readonly settings: SettingsPort) {}

  execute(): Promise<StoredSettings> {
    return this.settings.load();
  }
}
