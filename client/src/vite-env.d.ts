/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the BRACKT ASP.NET Core API (e.g. https://localhost:5001). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
