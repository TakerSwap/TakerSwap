import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import storage from "@/utils/storage";
import useStoreState from "@/hooks/useStoreState";

interface Farm {
  type: "farm" | "pool";
  hash: string;
  name: string;
}

export default function useMyFarm() {
  const router = useRouter();
  const myFarms = ref([]);
  const { addressInfo: currentAccount } = useStoreState();
  onMounted(() => {
    myFarms.value = currentAccount.value.farms || [];
    console.log(currentAccount, 666)
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
