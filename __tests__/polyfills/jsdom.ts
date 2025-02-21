import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  if (!HTMLFormElement.prototype.requestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function(submitter) {
      console.log('[Polyfill] requestSubmit called');
      const submitEvent = new Event('submit', {
        cancelable: true,
        bubbles: true
      });
      if (submitter) {
        submitter.dispatchEvent(submitEvent);
      } else {
        const fakeSubmit = document.createElement('button');
        fakeSubmit.type = 'submit';
        fakeSubmit.style.display = 'none';
        this.appendChild(fakeSubmit);
        fakeSubmit.click();
        this.removeChild(fakeSubmit);
      }
    };
  }

  // Enhanced FormData mock
  global.FormData = class FormData {
    private data = new Map<string, string>();
    
    append(key: string, value: string) {
      console.log('[FormData] Appending:', key, value);
      this.data.set(key, value);
    }
    
    get(key: string) {
      const value = this.data.get(key) ?? null;
      console.log('[FormData] Getting:', key, value);
      return value;
    }
    
    entries() {
      return Array.from(this.data.entries());
    }
  } as any;
}