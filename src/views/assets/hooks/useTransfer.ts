import { inject, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Minus } from "@/utils/util";
import { rootCmpKey, RootComponent } from "@/views/assets/types";

export function useTransfer() {
  const { t } = useI18n();
  const rootCmp = inject(rootCmpKey, {} as RootComponent);
  const loading = ref(false);
  const amount = ref("");
  const balance = ref("0");
  const amountErrorTip = ref("");
  watch(
    () => amount.value,
    val => {
      if (val) {
        if (
          !balance.value ||
          Minus(balance.value, amount.value).toNumber() < 0
        ) {
          amountErrorTip.value = t("transfer.transfer15");
        } else {
          amountErrorTip.value = "";
        }
      }
    }
  );
  return {
    rootCmp,
    loading,
    amount,
    balance,
    amountErrorTip
  };
}
