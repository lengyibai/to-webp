import { createApp } from "vue";

import App from "./App.vue";

import { setupStore } from "@/store";

import "@/styles/index.less";

/** 应用实例 */
const app = createApp(App);
/** @description 初始化状态管理 */
setupStore(app);
/** @description 挂载应用 */
app.mount("#app");
