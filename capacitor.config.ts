import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.aios',
  appName: 'aios-mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    hostname: 'localhost',
    iosScheme: 'ionic',
    allowNavigation: ['*'],
  },
};

export default config;
