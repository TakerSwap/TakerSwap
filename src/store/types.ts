export interface HeterogeneousInfo {
  chainName: string;
  contractAddress: string;
  heterogeneousChainId: number;
  heterogeneousChainMultySignAddress: string;
  isToken: boolean;
}

// InjectionKey 将store安装到Vue应用程序时提供类型,将类型传递InjectionKey给useStore方法
export interface AssetItem {
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
  heterogeneousList?: HeterogeneousInfo[];
  originNetwork: string;
  canToL1: boolean;
  canToL1OnCurrent: boolean;
  listAvailable?: string;
  contractAddress?: string;
}

export interface AccountFarm {
  type: string;
  hash: string;
  name: string;
}

export interface Account {
  address: any;
  pub: string;
  farms?: AccountFarm[];
  visiableAssets?: string[];
}

// 手动声明 state 类型
export interface State {
  addressInfo: Account;
  chainId: string;
  showConnect: boolean;
  lang: string | null;
  destroyAddress: string | undefined;
  feeAddress: string | undefined;
  assetList: AssetItem[] | [];
}
