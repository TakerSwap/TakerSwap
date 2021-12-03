import { ref } from "vue";
// @ts-ignore
import { ETransfer } from "@/utils/api";
import {HeterogeneousInfo} from "@/store/types";

export default function useCrossIn() {
  const transfer = new ETransfer();

  const balance = ref("");
  async function getBalance(
    heterogeneousInfo: HeterogeneousInfo,
    address: string,
    decimal?: number
  ) {
    if (heterogeneousInfo) {
      const { contractAddress, isToken } = heterogeneousInfo;
      if (isToken) {
        balance.value = await transfer.getERC20Balance(
          contractAddress,
          decimal,
          address
        );
      } else {
        balance.value = await transfer.getEthBalance(address);
      }
    }
  }

  const fee = ref("");
  async function getFee(isToken: boolean) {
    fee.value = await transfer.getGasPrice(isToken);
  }

  const needAuth = ref(false);
  let refreshAuth = false;

  async function getERC20Allowance(
    heterogeneousInfo: HeterogeneousInfo,
    address: string
  ) {
    const { contractAddress, heterogeneousChainMultySignAddress } =
      heterogeneousInfo;
    needAuth.value = await transfer.getERC20Allowance(
      contractAddress,
      heterogeneousChainMultySignAddress,
      address
    );
    if (!needAuth.value) {
      refreshAuth = false;
    }
    if (refreshAuth) {
      setTimeout(() => {
        getERC20Allowance(heterogeneousInfo, address);
      }, 5000);
    }
  }

  async function approveERC20(
    heterogeneousInfo: HeterogeneousInfo,
    address: string
  ) {
    const { contractAddress, heterogeneousChainMultySignAddress } =
      heterogeneousInfo;
    const res = await transfer.approveERC20(
      contractAddress,
      heterogeneousChainMultySignAddress,
      address
    );
    if (res.hash) {
      refreshAuth = true;
      getERC20Allowance(heterogeneousInfo, address);
    }
    return res;
  }

  async function sendTx(
    heterogeneousInfo: HeterogeneousInfo,
    takerAddress: string,
    amount: string,
    address: string,
    decimal: number
  ) {
    const { contractAddress, heterogeneousChainMultySignAddress } =
      heterogeneousInfo;
    const params = {
      multySignAddress: heterogeneousChainMultySignAddress,
      nerveAddress: takerAddress,
      numbers: amount,
      fromAddress: address,
      contractAddress,
      decimals: decimal
    };
    // console.log(params);
    return await transfer.crossIn(params);
  }

  return {
    balance,
    getBalance,
    fee,
    getFee,
    needAuth,
    getERC20Allowance,
    approveERC20,
    sendTx
  };
}
