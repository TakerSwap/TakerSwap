import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "@/store";

export default function useLang() {
  const store = useStore();
  const { locale } = useI18n();
  const lang = computed(() => {
    return locale.value === "en" ? "CN" : "EN";
  });
  store.commit("switchLang", locale.value);
  function switchLang() {
    locale.value = lang.value === "EN" ? "en" : "zh-cn";
    localStorage.setItem("lang", locale.value);
    store.commit("switchLang", locale.value);
  }
  return {
    lang,
    switchLang
  };
}
