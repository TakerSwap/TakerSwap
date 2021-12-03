import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import storage from "@/utils/storage";
import useStoreState from "@/hooks/useStoreState";
import {AccountFarm} from "@/store/types";

interface Farm {
  type: "farm" | "pool";
  hash: string;
  name: string;
}

export default function useMyFarm() {
  const router = useRouter();
  const store = useStore();
  const myFarms = ref<AccountFarm[]>([]);
  const { addressInfo: currentAccount } = useStoreState();
  onMounted(() => {
    myFarms.value = currentAccount.value.farms || [];
  });
  function toMyFarm(farm: Farm) {
    let url;
    if (farm.type === "farm") {
      url = `/farm/${farm.hash}`;
    } else {
      url = `/pool/${farm.hash}`;
    }
    router.push(url);
  }

  function updateMyFarms(farm: Farm) {
    const accountList = storage.get("local", "accountList") || [];
    accountList.map((v: any) => {
      if (v.pub === currentAccount.value.pub) {
        if (v.farms && v.farms.length) {
          v.farms.push(farm);
        } else {
          v.farms = [farm];
        }
        myFarms.value = v.farms;
        store.commit("setCurrentAddress", v);
      }
    });
    storage.set("local", "accountList", accountList);
  }

  return {
    myFarms,
    toMyFarm,
    updateMyFarms
  };
}
