import { createApp } from 'vue';
import App from './App.vue';
// The vanilla app's stylesheet, unchanged: the same class names give the same look.
import '../../../server/public/styles.css';

createApp(App).mount('#app');
