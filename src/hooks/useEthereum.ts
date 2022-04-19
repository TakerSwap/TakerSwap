import { reactive, toRefs } from "vue";
// import { Web3Provider } from "ethers";
import MetaMask from "@/assets/img/metamask.svg";
import CoinBase from "@/assets/img/coinbase.svg";
import Nabox from "@/assets/img/nabox.svg";
import OKEx from "@/assets/img/okexchain.png";

import { ethers } from "ethers";
import nerve from "nerve-sdk-js";
import storage from "@/utils/storage";

interface State {
  address: string | null;
  chainId: string;
  networkError: string;
}

interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}
export interface AddChain {
  chainId: string;
  rpcUrls: string[];
  chainName: string;
  nativeCurrency: NativeCurrency;
  blockExplorerUrls: string[];
}

interface SwitchChain {
  chainId: string;
}

interface GenerateAddressConfig {
  chainId: number;
  assetId: number;
  prefix: string;
}

const isMobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(
  navigator.userAgent
);
const MetaMaskProvider = "ethereum";
const NaboxProvier = "NaboxWallet";
const OKExProvier = "okexchain";

export const providerList = [
  { name: "MetaMask", src: MetaMask, provider: MetaMaskProvider }
  // { name: "Nabox", src: Nabox, provider: NaboxProvier }
  // { name: "OKEx Wallet", src: OKEx, provider: OKExProvier },
];

export function getProvider(type?: string) {
  if (type) return window[type];
  const providerType = storage.get("local", "providerType");
  return providerType ? window[providerType] : null;
}

export function getAddress() {
  const provider = getProvider();
  return provider?.selectedAddress || provider.address;
}

export default function useEthereum() {
  const state: State = reactive({
    address: "",
    chainId: "",
    networkError: ""
  });

  function initProvider() {
    const provider = getProvider();
    const address = provider?.selectedAddress || provider?.address;
    if (provider && address) {
      state.address = address;
      state.chainId = provider.chainId;
      // console.log(state.address, 8)
      listenAccountChange();
      listenNetworkChange();
    }
  }

  // 监听插件账户变动
  function listenAccountChange() {
    const provider = getProvider();
    provider?.on("accountsChanged", (accounts: string) => {
      console.log(accounts, "=======accountsChanged");
      reload();
      if (accounts.length) {
        state.address = accounts[0];
      } else {
        state.address = "";
      }
    });
  }

  // 监听插件网络变动
  function listenNetworkChange() {
    const provider = getProvider();
    provider?.on("chainChanged", (chainId: string) => {
      console.log(chainId, "=======chainId");
      if (chainId) {
        state.chainId = provider.chainId;
        reload();
        // checkNetwork(chainId);
      }
    });
  }

  function checkNetwork(chainId: string) {
    console.log(chainId);
  }

  // 连接provider
  async function connect(providerType: string) {
    const provider = getProvider(providerType);
    await provider?.request({ method: "eth_requestAccounts" });
    state.address = provider?.selectedAddress;
    state.chainId = provider?.chainId;
    storage.set("local", "providerType", providerType);
    listenAccountChange();
    listenNetworkChange();
    reload();
  }

  function disconnect() {
    storage.remove("local", "providerType");
    state.address = "";
    reload();
  }

  function reload() {
    window.location.reload();
  }

  async function addEthereumChain(params: AddChain) {
    const provider = getProvider();
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [params]
    });
  }
  async function switchEthereumChain(params: SwitchChain) {
    const provider = getProvider();
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [params]
    });
  }

  async function generateAddress(
    address: string,
    TakerConfig: GenerateAddressConfig,
    NULSConfig: GenerateAddressConfig
  ) {
    let heterogeneousAddress = "",
      pub = "";
    if (!address.startsWith("0x")) {
      if (!window.nabox) {
        throw "Unknown error";
      }
      pub = await window.nabox.getPub({
        address: address
      });
      heterogeneousAddress = ethers.utils.computeAddress(
        ethers.utils.hexZeroPad(ethers.utils.hexStripZeros("0x" + pub), 33)
      );
    } else {
      const provider = getProvider();
      const EProvider = new ethers.providers.Web3Provider(provider);
      const jsonRpcSigner = EProvider.getSigner();
      let message = "Generate L2 address";
      const signature = await jsonRpcSigner.signMessage(message);
      const msgHash = ethers.utils.hashMessage(message);
      const msgHashBytes = ethers.utils.arrayify(msgHash);
      const recoveredPubKey = ethers.utils.recoverPublicKey(
        msgHashBytes,
        signature
      );
      if (recoveredPubKey.startsWith("0x04")) {
        const compressPub = ethers.utils.computePublicKey(
          recoveredPubKey,
          true
        );
        heterogeneousAddress = address;
        pub = compressPub.slice(2);
      } else {
        throw "Sign error";
      }
    }
    const { chainId, assetId = 1, prefix } = TakerConfig;
    const takerAddress = nerve.getAddressByPub(chainId, assetId, pub, prefix);
    const NULSAddress = nerve.getAddressByPub(
      NULSConfig.chainId,
      NULSConfig.assetId,
      pub,
      NULSConfig.prefix
    );
    return {
      address: {
        Ethereum: heterogeneousAddress,
        Taker: takerAddress,
        NULS: NULSAddress
      },
      pub
    };
  }

  return {
    initProvider,
    connect,
    disconnect,
    ...toRefs(state),
    addEthereumChain,
    switchEthereumChain,
    generateAddress
  };
}
