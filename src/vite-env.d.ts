/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_ENV: 'development' | 'production';
}
