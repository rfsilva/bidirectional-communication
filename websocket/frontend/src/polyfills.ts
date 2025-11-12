/**
 * Polyfills para SockJS e STOMP no Angular 18
 */

// Global polyfill
(window as any).global = window;

// Process polyfill
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: (fn: Function) => setTimeout(fn, 0),
  browser: true
};

// Buffer polyfill
(window as any).Buffer = (window as any).Buffer || {
  isBuffer: () => false,
  from: (data: any) => data,
  alloc: (size: number) => new Array(size).fill(0)
};

// Crypto polyfill básico
if (!(window as any).crypto) {
  (window as any).crypto = {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
}