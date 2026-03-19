import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import '@/styles/index.scss'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { getTwoToneColor, setTwoToneColor } from '@ant-design/icons-vue';

import {enableKatex, enableMermaid, getUseMonaco} from 'markstream-vue'
import 'katex/dist/katex.min.css'


enableMermaid()
enableKatex()
setTwoToneColor('#b8ddd9');
getTwoToneColor();

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')
