import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const electronRemote = require('@electron/remote')
let electronRemoteApp = electronRemote.app
const appSPA = createApp(App)
const { shell } = require("electron")
const path = require("path");
const fs = require("fs");


appSPA.provide("$app",electronRemoteApp);
appSPA.provide('$path' ,path);
appSPA.provide('$shell' ,shell);
appSPA.provide('$fs' ,fs);


appSPA.use(ElementPlus)
appSPA.mount('#app')
