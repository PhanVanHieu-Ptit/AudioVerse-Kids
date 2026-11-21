const environment = import.meta.env.VITE_APP_ENV;
if (environment !== 'development' && environment !== 'production') {
  throw new Error('VITE_APP_ENV phải là development hoặc production.');
}

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'AudioVerse Kids',
  environment,
} as const;
