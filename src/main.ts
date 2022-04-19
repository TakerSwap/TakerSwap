import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import usePlugins from "@/plugins";
// import "./config";
import { hackTalonToTaker } from "@/utils/hackBrowserStorage";

hackTalonToTaker();

if (process.env.NODE_ENV !== "development") {
  window.console.log = () => {};
}

setTimeout(() => {
  const app = createApp(App);
  app.use(router).use(store).use(usePlugins).mount("#app");
}, 500);
