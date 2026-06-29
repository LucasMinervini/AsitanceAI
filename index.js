import { registerRootComponent } from 'expo';
import App from './src/infrastructure/app/App';

// registerRootComponent llama a AppRegistry.registerComponent y configura el entorno
// (Expo Go / build nativo / web) por nosotros.
registerRootComponent(App);
