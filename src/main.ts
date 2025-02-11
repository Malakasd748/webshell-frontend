import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'

import App from './App.vue'
import './styles'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.mount('#app')
