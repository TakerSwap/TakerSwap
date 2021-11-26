import { App } from "vue";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

// 配置默认toast
const toastOptions = {
  position: "top-right",
  timeout: 2000,
  closeOnClick: false,
  draggable: false,
  // container: () => document.querySelector("#inner_content"),
  transition: "Vue-Toastification__fade",
  hideProgressBar: true
};

export function useCustomToast(app: App) {
  app.use(Toast, toastOptions);
}
