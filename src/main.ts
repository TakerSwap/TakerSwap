import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { useElementPlus } from "@/plugins/element-plus";
import "element-plus/dist/index.css";
import { useI18nPlugin } from "@/plugins/i18n";
import "./config";
import { useCommonMethods } from "@/plugins/commonMethods";
import { hackTalonToTaker } from "@/utils/hackBrowserStorage";

hackTalonToTaker();

// toast
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
const toastOptions = {
  position: "top-right",
  timeout: 2000,
  closeOnClick: false,
  draggable: false,
  // container: () => document.querySelector("#inner_content"),
  transition: "Vue-Toastification__fade",
  hideProgressBar: true
};

if (process.env.NODE_ENV !== "development") {
  window.console.log = () => {};
}

setTimeout(() => {
  // 不延迟有时刷新会拿不到ethereum.selectedAddress???
  const app = createApp(App);
  app
    .use(router)
    .use(store)
    .use(useElementPlus)
    .use(useI18nPlugin)
    .use(Toast, toastOptions)
    .use(useCommonMethods)
    .mount("#app");
}, 500);
