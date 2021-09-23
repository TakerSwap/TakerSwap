import { InjectionKey } from "vue";
import { createStore, Store } from "vuex";
import { _networkInfo } from "@/api/util";
import config from "@/config";
// @ts-ignore
import { getAssetList } from "@/model";

// InjectionKey 将store安装到Vue应用程序时提供类型,将类型传递InjectionKey给useStore方法
interface AssetItem {
  chainId: number;
  assetId: number;
  assetKey: string;
  number: string;
  locking: string;
  valuation: string;
  available: string;
  registerChainId: number;
  symbol: string;
  decimals: number;
}
// 手动声明 state 类型
export interface State {
  addressInfo: any;
  chainId: string;
  showConnect: boolean;
  lang: string | null;
  destroyAddress: string | undefined;
  feeAddress: string | undefined;
  assetList: AssetItem[] | [];
}

// 定义注入类型
const key: InjectionKey<Store<State>> = Symbol();

let sessionList = [];
try {
  sessionList = JSON.parse(<string>sessionStorage.getItem("assetList")) || [];
} catch (e) {
  sessionStorage.removeItem("assetList");
}

export default createStore<State>({
  state: {
    // hasTalonAddress: false,
    addressInfo: {},
    chainId: "",
    showConnect: false,
    lang: localStorage.getItem("lang"),
    destroyAddress: config["destroyAddress"],
    feeAddress: config["destroyAddress"],
    assetList: sessionList
  },
  getters: {
    // 异构链名称Ethereum..
    chain(state) {
      const chainId = state.chainId;
      if (!chainId) return "";
      let chain = "";
      Object.keys(_networkInfo).map(v => {
        if (_networkInfo[v][config.ETHNET] === chainId) {
          chain = _networkInfo[v].name;
        }
      });
      return chain;
    },
    // metamask 网络错误
    wrongChain(state) {
      const chainId = state.chainId;
      return Object.keys(_networkInfo).every(v => {
        const chain = _networkInfo[v];
        return chain[config.ETHNET] !== chainId || !chain.supported;
      });
    },
    currentAddress(state) {
      return state.addressInfo?.address?.Ethereum;
    },
    talonAddress(state) {
      return state.addressInfo?.address?.Talon;
    }
  },
  mutations: {
    setCurrentAddress(state, data) {
      // console.log(data, 7777)
      state.addressInfo = data;
    },
    changeChainId(state, data) {
      // console.log(data, 55)
      state.chainId = data;
    },
    changeConnectShow(state, data) {
      state.showConnect = data;
    },
    switchLang(state, data) {
      state.lang = data;
      localStorage.setItem("lang", data);
    },
    setAssetList(state, list) {
      state.assetList = list;
      sessionStorage.setItem("assetList", JSON.stringify(list));
    }
  },
  actions: {
    async getAssetList({ commit }, address) {
      if (!address) return;
      const res = await getAssetList(address);
      if (res && res.length) {
        console.log("====set-asset====")
        commit("setAssetList", res);
      }
    }
    // async setAccount({ state, commit }, account) {
    //   commit("setAccount", account);
    // }
  },
  modules: {}
});
