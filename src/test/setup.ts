import "@testing-library/jest-dom/vitest";

// Mock environment variables for Vitest
if (typeof process !== "undefined") {
  process.env.VITE_SUPABASE_URL = "https://test-placeholder-project.supabase.co";
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-placeholder-anon-key";
}

// In-memory mock for localStorage in jsdom environment
if (typeof window !== "undefined") {
  const storageStore: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => (key in storageStore ? storageStore[key] : null),
    setItem: (key: string, value: string) => {
      storageStore[key] = String(value);
    },
    removeItem: (key: string) => {
      delete storageStore[key];
    },
    clear: () => {
      for (const k in storageStore) {
        delete storageStore[k];
      }
    },
    get length() {
      return Object.keys(storageStore).length;
    },
    key: (i: number) => Object.keys(storageStore)[i] || null,
  };

  try {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  } catch {}
}

// Instant mock for placeholder Supabase network fetches during unit tests
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url || "";
  if (url.includes("test-placeholder-project.supabase.co") || url.includes("placeholder.supabase.co")) {
    if (url.includes("/auth/v1")) {
      return new Response(JSON.stringify({ session: null, user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (originalFetch) {
    return originalFetch(input, init);
  }
  return new Response(JSON.stringify({}), { status: 200 });
};
