import type { SettingsPort, StoredSettings } from '../ports/SettingsPort';

export class SaveSettings {
  constructor(private readonly settings: SettingsPort) {}

  execute(settings: StoredSettings): Promise<void> {
    return this.settings.save(settings);
  }
}
