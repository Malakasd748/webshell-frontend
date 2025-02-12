export class CacheMap<K, V> extends Map<K, V> {
  private _timers = new Map<K, number>();

  constructor(public readonly ttl: number = 10_000) {
    super();
  }

  override set(key: K, value: V): this {
    super.set(key, value);

    // 清除已有的定时器
    const existingTimer = this._timers.get(key);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    // 设置新的定时器
    this._timers.set(
      key,
      window.setTimeout(() => {
        super.delete(key);
        this._timers.delete(key);
      }, this.ttl),
    );

    return this;
  }

  override delete(key: K): boolean {
    const timer = this._timers.get(key);
    if (timer) {
      window.clearTimeout(timer);
      this._timers.delete(key);
    }
    return super.delete(key);
  }

  override clear(): void {
    this._timers.forEach((timer) => window.clearTimeout(timer));
    this._timers.clear();
    super.clear();
  }
}
