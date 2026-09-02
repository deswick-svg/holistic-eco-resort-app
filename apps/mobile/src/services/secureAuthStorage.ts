/** SecureStore-only adapter. Chunking avoids oversized native keychain values. */
export interface SecureStoragePort {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export class SecureAuthStorage {
  private queue: Promise<unknown> = Promise.resolve();
  private readonly port: SecureStoragePort;
  constructor(port: SecureStoragePort) { this.port = port; }

  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation);
    this.queue = next.catch(() => undefined);
    return next;
  }
  private key(key: string) {
    return 'her.auth.' + Array.from(key).map(c => c.codePointAt(0)!.toString(16)).join('_');
  }
  private async count(key: string) {
    const value = await this.port.getItemAsync(key);
    if (value === null) return 0;
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 0 || count > 1000) throw new Error('SecureStorageError');
    return count;
  }
  private async read(key: string) {
    const count = await this.count(key);
    if (!count) return null;
    let value = '';
    for (let i = 0; i < count; i++) {
      const chunk = await this.port.getItemAsync(`${key}.${i}`);
      if (chunk === null) throw new Error('SecureStorageError');
      value += chunk;
    }
    return value;
  }
  private async remove(key: string) {
    const count = await this.count(key);
    for (let i = 0; i < count; i++) await this.port.deleteItemAsync(`${key}.${i}`);
    await this.port.deleteItemAsync(key);
  }
  private async write(key: string, value: string) {
    await this.remove(key);
    const count = Math.max(1, Math.ceil(value.length / 400));
    if (count > 1000) throw new Error('SecureStorageError');
    // Metadata first: interrupted writes fail closed and remain removable.
    await this.port.setItemAsync(key, String(count));
    for (let i = 0; i < count; i++) await this.port.setItemAsync(`${key}.${i}`, value.slice(i * 400, (i + 1) * 400));
  }
  private async keys(): Promise<string[]> {
    const raw = await this.read('her.auth.index');
    if (!raw) return [];
    const keys: unknown = JSON.parse(raw);
    if (!Array.isArray(keys) || !keys.every(k => typeof k === 'string' && k.startsWith('her.auth.'))) throw new Error('SecureStorageError');
    return keys;
  }
  getItem(key: string) { return this.serial(() => this.read(this.key(key))); }
  setItem(key: string, value: string) {
    return this.serial(async () => {
      const nativeKey = this.key(key);
      const keys = await this.keys();
      if (!keys.includes(nativeKey)) await this.write('her.auth.index', JSON.stringify([...keys, nativeKey]));
      await this.write(nativeKey, value);
    });
  }
  removeItem(key: string) {
    return this.serial(async () => {
      const nativeKey = this.key(key);
      await this.remove(nativeKey);
      await this.write('her.auth.index', JSON.stringify((await this.keys()).filter(k => k !== nativeKey)));
    });
  }
  clear() {
    return this.serial(async () => {
      for (const key of await this.keys()) await this.remove(key);
      await this.remove('her.auth.index');
    });
  }
}
