import { vi } from 'vitest';

// Define MediaQueryList interface
interface MediaQueryList {
  matches: boolean;
  media: string;
  onchange: null | ((this: MediaQueryList, ev: MediaQueryListEvent) => any);
  addListener: (callback: () => void) => void;
  removeListener: (callback: () => void) => void;
  addEventListener: (type: string, callback: () => void) => void;
  removeEventListener: (type: string, callback: () => void) => void;
  dispatchEvent: (event: Event) => boolean;
}

// Create MediaQueryList mock implementation
class MockMediaQueryList implements MediaQueryList {
  private listeners: Set<() => void> = new Set();
  private eventListeners: Map<string, Set<() => void>> = new Map();

  constructor(public media: string, public matches: boolean = false) {}

  onchange: null | ((this: MediaQueryList, ev: MediaQueryListEvent) => any) = null;

  addListener(callback: () => void) {
    console.log('[MediaQuery] Adding listener');
    this.listeners.add(callback);
  }

  removeListener(callback: () => void) {
    console.log('[MediaQuery] Removing listener');
    this.listeners.delete(callback);
  }

  addEventListener(type: string, callback: () => void) {
    console.log('[MediaQuery] Adding event listener:', type);
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
  }

  removeEventListener(type: string, callback: () => void) {
    console.log('[MediaQuery] Removing event listener:', type);
    this.eventListeners.get(type)?.delete(callback);
  }

  dispatchEvent(event: Event): boolean {
    console.log('[MediaQuery] Dispatching event:', event.type);
    if (this.onchange) {
      this.onchange.call(this, event as MediaQueryListEvent);
    }
    this.listeners.forEach(listener => listener());
    this.eventListeners.get(event.type)?.forEach(listener => listener());
    return true;
  }
}

// Install matchMedia polyfill
if (typeof window !== 'undefined') {
  console.log('[Polyfill] Installing matchMedia');
  
  const mockMatchMedia = vi.fn((query: string): MediaQueryList => {
    console.log('[MediaQuery] Creating mock for query:', query);
    return new MockMediaQueryList(query);
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
} 