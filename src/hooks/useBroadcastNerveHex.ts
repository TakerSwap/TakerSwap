import useStoreState from "@/hooks/useStoreState";
import nerve from "nerve-sdk-js";
// @ts-ignore
import { NTransfer } from "@/api/api";
import { broadcastHex } from "@/service/api";

export default function useBroadcastNerveHex() {
  const { addressInfo } = useStoreState();
  async function handleHex(hex: string) {
    const tAssemble = nerve.deserializationTx(hex);
    const transfer = new NTransfer({ chain: "NERVE" });
    const txHex = await transfer.getTxHex({
      tAssemble,
      pub: addressInfo.value?.pub,
      signAddress: addressInfo.value?.address?.Ethereum
    });
    console.log(txHex, "===txHex===");
    return await broadcastHex(txHex);
  }
  return {
    handleHex
  };
}
