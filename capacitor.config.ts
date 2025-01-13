import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ph03games.offlinegames',
  appName: '100 in 1 - Offline Games',
  webDir: 'build',
  ios: {
    prefersStatusBarHidden: true,
    statusBarStyle: 'dark', // Adjust based on your app's theme
  }
};

export default config;
