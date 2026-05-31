// Vitest global setup: provide a real (in-memory) IndexedDB implementation so the
// LocalStore exercises the same code path it will in the browser.
import 'fake-indexeddb/auto';
