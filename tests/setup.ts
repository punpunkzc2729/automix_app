import { vi } from "vitest";

vi.mock("electron-store", () => {
  class Store<T extends Record<string, unknown>> {
    private data: T;

    constructor(options: { defaults: T }) {
      this.data = structuredClone(options.defaults);
    }

    set(key: string, value: unknown) {
      const segments = key.split(".");
      let current: any = this.data;
      for (let i = 0; i < segments.length - 1; i += 1) {
        const segment = segments[i];
        current[segment] = current[segment] ?? {};
        current = current[segment];
      }
      current[segments[segments.length - 1]] = value;
    }

    get<R = any>(key: string): R {
      const segments = key.split(".");
      let current: any = this.data;
      for (const segment of segments) {
        if (current == null) return current;
        current = current[segment];
      }
      return current as R;
    }
  }

  return { default: Store };
});
