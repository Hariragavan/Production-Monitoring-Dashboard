/**
 * Smart TV & Legacy Browser Polyfills
 * Ensures older WebKit/Chromium engines on Samsung Tizen, LG webOS,
 * Android TV, and older browsers can run without syntax/runtime errors.
 */

// 1. Polyfill globalThis
(function () {
  if (typeof globalThis === 'undefined') {
    if (typeof window !== 'undefined') {
      (window as any).globalThis = window;
    } else if (typeof self !== 'undefined') {
      (self as any).globalThis = self;
    }
  }
})();

// 2. Safe localStorage / sessionStorage polyfill for Smart TV private browsing / sandboxes
(function () {
  try {
    const testKey = '__tv_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch {
    console.warn('[TV Polyfill] localStorage is restricted or unsupported. Enabling memory storage fallback.');
    const memoryStore: Record<string, string> = {};
    const mockStorage: Storage = {
      get length() {
        return Object.keys(memoryStore).length;
      },
      clear: () => {
        for (const k in memoryStore) delete memoryStore[k];
      },
      getItem: (key: string) => memoryStore[key] || null,
      key: (index: number) => Object.keys(memoryStore)[index] || null,
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      setItem: (key: string, value: string) => {
        memoryStore[key] = String(value);
      },
    };

    try {
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'sessionStorage', {
        value: mockStorage,
        configurable: true,
        writable: true,
      });
    } catch {
      // ignore
    }
  }
})();

// 3. Polyfill ResizeObserver for Recharts on older TV browsers
(function () {
  if (typeof window !== 'undefined' && !(window as any).ResizeObserver) {
    console.log('[TV Polyfill] Polyfilling ResizeObserver for TV browser');
    (window as any).ResizeObserver = class ResizeObserver {
      private callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element) {
        // Trigger initial callback with target bounds so charts render
        try {
          const rect = target.getBoundingClientRect();
          this.callback(
            [
              {
                target,
                contentRect: rect,
                borderBoxSize: [] as any,
                contentBoxSize: [] as any,
                devicePixelContentBoxSize: [] as any,
              },
            ],
            this
          );
        } catch {
          // ignore
        }
      }
      unobserve() {}
      disconnect() {}
    };
  }
})();

// 4. Polyfill crypto.randomUUID
(function () {
  if (typeof window !== 'undefined') {
    if (!window.crypto) {
      (window as any).crypto = {};
    }
    if (!(window.crypto as any).randomUUID) {
      (window.crypto as any).randomUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
    }
  }
})();

// 5. Polyfill structuredClone
(function () {
  if (typeof window !== 'undefined' && !(window as any).structuredClone) {
    (window as any).structuredClone = function <T>(obj: T): T {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        return obj;
      }
    };
  }
})();

// 6. Polyfill requestIdleCallback
(function () {
  if (typeof window !== 'undefined' && !(window as any).requestIdleCallback) {
    (window as any).requestIdleCallback = function (cb: any) {
      return setTimeout(() => {
        cb({
          didTimeout: false,
          timeRemaining: () => 50,
        });
      }, 1);
    };
    (window as any).cancelIdleCallback = function (id: number) {
      clearTimeout(id);
    };
  }
})();

export {};
