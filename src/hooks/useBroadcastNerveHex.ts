import useStoreState from "@/hooks/useStoreState";
import nerve from "nerve-sdk-js";
import { NTransfer } from "@/utils/api";
import { broadcastHex } from "@/service/api";

interface TxInfo {
  inputs: any;
  outputs: any;
  txData: any;
  type: number
}

export default function useBroadcastNerveHex() {
  const { addressInfo } = useStoreState();

  // 已有交易hex，调用metamask签名，然后广播
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
  // 没有交易hex，自己组装交易获取hex，然后调用metamask签名，广播
  async function handleTxInfo(txInfo: any, type: number, txData: any) {
    const transfer = new NTransfer({ chain: "NERVE", type });
    const inputOuput: any = await transfer.inputsOrOutputs(txInfo);
    const txHex = await transfer.getTxHex({
      inputs: inputOuput.inputs,
      outputs: inputOuput.outputs,
      txData,
      pub: addressInfo.value?.pub,
      signAddress: addressInfo.value?.address?.Ethereum
    });
    console.log(txHex, "===txHex===");
    return await broadcastHex(txHex);
  }
  return {
    handleHex,
    handleTxInfo
  };
}
