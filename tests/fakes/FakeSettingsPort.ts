import type { SettingsPort, StoredSettings } from '@application/ports/SettingsPort';

export class FakeSettingsPort implements SettingsPort {
  private stored: StoredSettings = {};

  static withData(data: StoredSettings): FakeSettingsPort {
    const fake = new FakeSettingsPort();
    fake.stored = data;
    return fake;
  }

  static empty(): FakeSettingsPort {
    return new FakeSettingsPort();
  }

  async load(): Promise<StoredSettings> {
    return this.stored;
  }

  async save(settings: StoredSettings): Promise<void> {
    this.stored = settings;
  }

  snapshot(): StoredSettings {
    return this.stored;
  }
}
