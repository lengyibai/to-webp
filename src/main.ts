import { createApp } from "vue";

import App from "./App.vue";

import { router } from "@/router";
import { setupStore } from "@/store";

import "@/styles/index.less";

/** 应用实例 */
const app = createApp(App);
/** @description 初始化状态管理 */
setupStore(app);
/** @description 初始化页面路由 */
app.use(router);
/** @description 挂载应用 */
app.mount("#app");
