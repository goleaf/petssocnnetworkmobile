import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsocial.app',
  appName: 'PawSocial',
  webDir: 'out',
  android: {
    path: 'mobile/android',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

