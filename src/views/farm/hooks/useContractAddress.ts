import { computed } from "vue";
import useStoreState from "@/hooks/useStoreState";
import { contract_BSC, contract_ETH } from "@/contractConfig/contractConfig";

export default function useContractAddress() {
  const { chain: L1Chain } = useStoreState();
  return computed(() => {
    return L1Chain.value === "Ethereum" ? contract_ETH : contract_BSC;
  });
}
