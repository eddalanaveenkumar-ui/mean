import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meanai.app',
  appName: 'Mean AI',
  webDir: 'dist',
  server: {
    hostname: 'meanai.site',
    androidScheme: 'https',
    allowNavigation: [
      'accounts.google.com',
      'mean-85713.web.app',
      'mean-85713.firebaseapp.com',
      'openrouter.ai',
      '*.google.com',
      '*.googleapis.com'
    ]
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    }
  }
};

export default config;
