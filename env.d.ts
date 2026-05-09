/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string
    JWT_SECRET: string
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
    NODE_ENV: string  // ← Ajoute cette ligne
  }
}