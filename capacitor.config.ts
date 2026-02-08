import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sekaidrama.app',
    appName: 'SekaiDrama',
    webDir: 'out',
    server: {
        url: 'https://nunodrama.vercel.app/',
        cleartext: true
    }
};

export default config;
