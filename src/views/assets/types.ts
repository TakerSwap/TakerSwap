import { InjectionKey } from "vue";
import { Account, AssetItem } from "@/store/types";

export interface AssetItemType extends AssetItem {
  showDetail?: boolean;
  added?: boolean;
}

export enum TransferType {
  CrossIn = "CrossIn", // L1到L2
  General = "General", // 普通转账
  Withdrawal = "Withdrawal" // L2到L1
}

export interface RootComponent {
  address: string;
  takerAddress: string;
  disableTx: boolean;
  network: string;
  transferAsset: AssetItemType;
  crossInOutSymbol: AssetItemType[];
  allAssetsList: AssetItemType[];
  currentAccount: Account;
}

export const rootCmpKey: InjectionKey<RootComponent> = Symbol("rootCmp");
