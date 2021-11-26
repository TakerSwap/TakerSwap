import storage from "@/utils/storage";
import config from "@/config";
import nerve from "nerve-sdk-js";

// Talon改Taker浏览器缓存修改
export function hackTalonToTaker() {
  const accountList = storage.get("local", "accountList") || [];
  const needFix = accountList.find((account: any) => {
    return account.address.Talon || !account.address.NULS;
  });
  if (needFix) {
    accountList.map((account: any) => {
      const { address, pub } = account;
      if (address.Talon) {
        const value = address.Talon;
        delete address.Talon;
        address.Taker = value;
      }
      if (!address.NULS) {
        const { NULSConfig } = config;
        address.NULS = nerve.getAddressByPub(
          NULSConfig.chainId,
          NULSConfig.assetId,
          pub,
          NULSConfig.prefix
        );
      }
    });
    storage.set("local", "accountList", accountList);
  }
}
