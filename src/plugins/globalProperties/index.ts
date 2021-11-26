import { App } from "vue";
import { copys, toThousands } from "@/utils/util";
import { useToast } from "vue-toastification";
import { ToastOptions } from "vue-toastification/src/types/index";

// 绑定到this实例上的方法
export function useGlobalProperties(app: App) {
  const toast = useToast();
  app.config.globalProperties.$copy = function (str: string) {
    copys(str);
    toast.success(this.$t("public.public13"));
  };

  app.config.globalProperties.$thousands = function (str: string | number) {
    return toThousands(str);
  };

  app.config.globalProperties.$toast = function (
    msg: string,
    options: ToastOptions = {}
  ) {
    const { type = "success", ...rest } = options;
    toast(msg, {
      // @ts-ignore
      type,
      ...rest
    });
  };
}
