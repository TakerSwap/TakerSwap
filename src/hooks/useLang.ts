import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "@/store";

export default function useLang() {
  const store = useStore();
  const { locale } = useI18n();
  // 切换的语言
  const lang = computed(() => {
    return locale.value === "en" ? "CN" : "EN";
  });
  function switchLang() {
    locale.value = lang.value === "EN" ? "en" : "zh-cn";
    store.commit("switchLang", locale.value);
  }
  return {
    lang,
    switchLang
  };
}
