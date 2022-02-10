<template>
  <div class="w1300 assets-wrap">
    <!--    el-table resize卡顿问题-->
    <div
      class="hack-table-resize"
      v-if="!showTransfer"
      style="position: relative"
    >
      <div style="position: absolute; width: 100%">
        <div class="assets">
          <div class="address-wrap flex-center">
            <div class="address">
              {{ $t("assets.assets3") }}
              {{ takerAddress }}
              <i class="iconfont icon-fuzhi" @click="$copy(takerAddress)"></i>
            </div>
            <i
              class="iconfont icon-tianjia"
              @click="showAssetManage = true"
            ></i>
          </div>
          <el-table
            :data="selectAssets"
            height="480"
            class="show_table"
            v-loading="loading"
            element-loading-background="rgba(24, 24, 55, 0.8)"
          >
            <el-table-column width="20px"></el-table-column>
            <el-table-column :label="$t('public.public1')">
              <template v-slot="scope">
                <div class="flex-center">
                  <symbol-icon :icon="scope.row.symbol"></symbol-icon>
                  <el-tooltip placement="top">
                    <template #content>
                      <div>
                        ID: {{ scope.row.assetKey }}
                        <br />
                        <span
                          v-if="
                            getContractAddress(
                              scope.row.heterogeneousList,
                              scope.row.registerChainId
                            )
                          "
                        >
                          {{ $t("assets.assets10")
                          }}{{
                            getContractAddress(
                              scope.row.heterogeneousList,
                              scope.row.registerChainId
                            )
                          }}
                        </span>
                      </div>
                    </template>
                    <div class="t_info">
                      <span>{{ scope.row.symbol }}</span>
                      <p>{{ "(" + scope.row.originNetwork + ")" }}</p>
                    </div>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('public.public2')">
              <template v-slot="scope">
                {{ $thousands(scope.row.available) }}
              </template>
            </el-table-column>
            <el-table-column prop="locking" :label="$t('public.public3')">
              <template v-slot="scope">
                {{ $thousands(scope.row.locking) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('public.public4')">
              <template v-slot="scope">
                {{ $thousands(scope.row.number) }}
                <p class="ydy">≈${{ $thousands(scope.row.valuation) }}</p>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('public.public5')"
              align="center"
              width="260px"
            >
              <template v-slot="scope">
                <div class="handle-column" v-if="scope.row">
                  <el-tooltip
                    :content="$t('assets.assets4')"
                    placement="top"
                    v-if="scope.row.canToL1"
                  >
                    <i
                      class="iconfont icon-chongzhidaoL2"
                      :class="{ disable: disableTx || !scope.row.canToL1OnCurrent }"
                      @click="transfer(scope.row, TransferType.CrossIn)"
                    ></i>
                  </el-tooltip>
                  <el-divider
                    direction="vertical"
                    v-if="scope.row.canToL1"
                  ></el-divider>
                  <el-tooltip :content="$t('assets.assets5')" placement="top">
                    <i
                      class="iconfont icon-L2zhuanzhang"
                      @click="transfer(scope.row, TransferType.General)"
                    ></i>
                  </el-tooltip>
                  <el-divider
                    direction="vertical"
                    v-if="scope.row.canToL1"
                  ></el-divider>
                  <el-tooltip
                    :content="$t('assets.assets6')"
                    placement="top"
                    v-if="scope.row.canToL1"
                  >
                    <i
                      class="iconfont icon-tixiandaoL1"
                      :class="{ disable: disableTx || !scope.row.canToL1OnCurrent }"
                      @click="transfer(scope.row, TransferType.Withdrawal)"
                    ></i>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    <div class="mobile-cont pb-28" v-if="!showTransfer">
      <div class="p-24 address-wrap flex-center">
        <div class="address">
          {{ $t("assets.assets3") }}
          <span class="text-7e size-14">
            {{ superLong(takerAddress, 9) }}
          </span>
          <i class="iconfont icon-fuzhi" @click="$copy(takerAddress)"></i>
        </div>
        <i class="iconfont icon-tianjia" @click="showAssetManage = true"></i>
      </div>
      <el-empty
        description="No Data"
        v-loading="loading"
        v-if="!selectAssets.length"
      />
      <div v-for="(item, index) in selectAssets" v-else :key="index">
        <div class="p-24 asset-cont-wrap" @click="assetClick(item)">
          <div class="asset-cont">
            <div class="asset-item">
              <span class="asset-img">
                <symbol-icon :icon="item.symbol"></symbol-icon>
              </span>
              <span class="font-bold" style="font-size: 14px; line-height: 1">
                {{ item.symbol }}
                <br />
                <span>({{ item.originNetwork }})</span>
              </span>
            </div>
            <div class="asset-amount flex-center">
              <div class="left">
                <div class="font-bold align-right" style="font-size: 15px">
                  {{ $thousands(item.number) }}
                </div>
                <div class="size-13 text-7e align-right">
                  ≈{{ $thousands(item.valuation) }}
                </div>
              </div>
              <el-icon
                :class="[
                  'icon-caret-right',
                  item.showDetail ? 'rotate-icon' : ''
                ]"
              >
                <CaretRight />
              </el-icon>
            </div>
          </div>
          <div class="t_info">
            <span>ID: {{ item.assetKey }}</span>
            <br />
            <span
              v-if="
                getContractAddress(item.heterogeneousList, item.registerChainId)
              "
            >
              {{ $t("assets.assets10")
              }}{{
                superLong(
                  getContractAddress(
                    item.heterogeneousList,
                    item.registerChainId
                  ),
                  10
                )
              }}
            </span>
          </div>
        </div>

        <CollapseTransition>
          <div class="option-btn" v-if="item.showDetail">
            <div class="btn-cont">
              <div
                class="btn"
                @click="transfer(item, TransferType.CrossIn)"
                v-if="item.canToL1"
                :class="{ btn_disable: disableTx || !item.canToL1OnCurrent }"
              >
                {{ $t("assets.assets4") }}
              </div>
              <div class="btn" @click="transfer(item, TransferType.General)">
                {{ $t("assets.assets5") }}
              </div>
              <div
                class="btn"
                @click="transfer(item, TransferType.Withdrawal)"
                v-if="item.canToL1"
                :class="{ btn_disable: disableTx || !item.canToL1OnCurrent }"
              >
                {{ $t("assets.assets6") }}
              </div>
            </div>
          </div>
        </CollapseTransition>
      </div>
    </div>
    <assets-manage
      v-model:showAssetManage="showAssetManage"
      :assetList="allAssetsList"
      :selectAssets="selectAssets"
      @addAssets="addAssets"
    ></assets-manage>
    <transfer
      v-if="showTransfer"
      v-model:currentTab="currentTab"
      v-model:show="showTransfer"
      :disableTx="disableTx || !assetCanCross"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
  provide,
  ref,
  reactive
} from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import SymbolIcon from "@/components/SymbolIcon.vue";
import AssetsManage from "./AssetsManage.vue";
import Transfer from "./transfer/index.vue";
import CollapseTransition from "@/components/CollapseTransition.vue";
import { superLong } from "@/utils/util";
import useStoreState from "@/hooks/useStoreState";
import useAssetsList from "./hooks/useAssetsList";

import { AssetItemType, rootCmpKey, TransferType } from "./types";
import storage from "@/utils/storage";
import { Account, HeterogeneousInfo } from "@/store/types";

export default defineComponent({
  name: "assets",
  components: {
    SymbolIcon,
    AssetsManage,
    Transfer,
    CollapseTransition
  },
  setup() {
    const internalInstance = getCurrentInstance();
    // provide<InstanceType<typeof internalInstance?.proxy>>("father", internalInstance?.proxy);
    provide("father", internalInstance?.proxy);

    const store = useStore();

    const {
      takerAddress,
      chain: network,
      wrongChain: disableTx,
      addressInfo: currentAccount,
      currentAddress: address
    } = useStoreState();

    const router = useRouter();
    onMounted(() => {
      if (!takerAddress.value) {
        router.push("/");
      }
    });

    const {
      loading,
      allAssetsList,
      selectAssets,
      crossInOutSymbol,
      filterAssets,
      assetClick
    } = useAssetsList();

    const showAssetManage = ref(false); // 资产管理弹窗

    // 显示交易tab
    const currentTab = ref<TransferType>(TransferType.General);
    const showTransfer = ref(false);
    const transferAsset = ref<AssetItemType>({} as AssetItemType); // 当前交易的资产
    const assetCanCross = ref(true);
    function transfer(asset: AssetItemType, type: TransferType) {
      if (type !== TransferType.General && disableTx.value) return;
      if (type !== TransferType.General && !asset.canToL1OnCurrent) return;
      assetCanCross.value = !(disableTx.value || !asset.canToL1OnCurrent);
      currentTab.value = type;
      /*if (type === TransferType.CrossIn) {
        // L1到L2
        currentTab.value = TransferType.CrossIn;
      } else if (type === TransferType.Withdrawal) {
        // L2到L1
        currentTab.value = TransferType.Withdrawal;
      } else {
        // L2内部转账
        currentTab.value = TransferType.General;
      }*/
      showTransfer.value = true;
      transferAsset.value = asset;
    }

    // 获取资产合约地址
    function getContractAddress(
      heterogeneousList: HeterogeneousInfo[],
      registerChainId: number
    ): string {
      if (!heterogeneousList || !heterogeneousList.length) {
        return "";
      }
      const info = heterogeneousList.find(
        v => v.heterogeneousChainId === registerChainId
      );
      return info ? info.contractAddress : "";
    }

    function addAssets(assets: string[]) {
      currentAccount.value.visiableAssets = assets;
      const accountList: Account[] = storage.get("local", "accountList") || [];
      accountList.map(v => {
        if (v.pub === currentAccount.value.pub) {
          v.visiableAssets = assets;
        }
      });
      storage.set("local", "accountList", accountList);

      store.commit("setCurrentAddress", currentAccount);
      filterAssets();
    }

    const rootCmp = reactive({
      takerAddress,
      address,
      disableTx,
      network,
      transferAsset,
      crossInOutSymbol,
      allAssetsList,
      currentAccount
    });

    provide(rootCmpKey, rootCmp);

    return {
      loading,
      showAssetManage,
      allAssetsList,
      selectAssets,
      crossInOutSymbol,
      showTransfer,
      currentTab,
      transferAsset,
      network,
      disableTx,
      currentAccount,
      address,
      takerAddress,
      addAssets,
      transfer,
      superLong,
      assetClick,
      getContractAddress,
      TransferType,
      assetCanCross
    };
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";
.assets-wrap {
  padding: 0 20px;
}
.show_table.el-table--scrollable-y .el-table__body-wrapper {
  overflow: scroll;
}
.handle-column {
  line-height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  .iconfont {
    font-size: 24px;
    color: $linkColor;
    margin: 0 10px;
    cursor: pointer;
    &.disable {
      cursor: not-allowed;
    }
  }
  .el-divider {
    background-color: $labelColor;
  }
}
.mobile-cont {
  display: none;
  //padding: 24px 15px 28px 15px;
  background-color: $BgColor;
  overflow: hidden;
  border-radius: 10px;

  .address-wrap {
    justify-content: space-between;
    font-size: 16px;
    //color: #333;
    margin: 20px 0 10px;
    i {
      color: $linkColor;
      font-size: 20px;
      cursor: pointer;
      margin-left: 10px;
    }
  }
  .asset-cont-wrap {
    padding: 10px 15px;
    border-bottom: 1px solid #202049;
    .t_info {
      font-size: 12px;
      color: $labelColor;
      display: flex;
      justify-content: space-between;
      //padding-top: 2px;
    }
  }
  .asset-cont {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    .asset-item {
      display: flex;
      align-items: center;
      max-width: 40%;
      .asset-img {
        height: 25px;
        width: 25px;
        overflow: hidden;
        margin-right: 6px;
        flex-shrink: 0;
        :deep(.symbol-icon) {
          height: 100%;
          width: 100%;
          border-radius: 50%;
        }
      }
      .font-bold span {
        color: $labelColor;
        font-weight: 400;
        font-size: 12px;
      }
    }
    .asset-amount {
      flex: 1;
      justify-content: flex-end;
    }
    .icon-caret-right {
      font-size: 16px;
      margin-left: 5px;
      transition: transform 0.1s ease;
    }
    .rotate-icon {
      transform: rotate(-90deg);
    }
  }
  .option-btn {
    padding: 20px 0;
    background-color: #313161;
    .btn-cont {
      display: flex;
      align-items: center;
      justify-content: center;
      .btn {
        cursor: pointer;
        height: 36px;
        width: 88px;
        font-size: 15px;
        background-color: $btnColor;
        //color: #ffffff;
        line-height: 36px;
        text-align: center;
        border-radius: 10px;
        margin: 0 5px;
      }
    }
  }
}
.font-bold {
  //font-weight: bolder;
}
.p-24 {
  padding: 0 15px 0 15px;
}
.pt-25 {
  padding: 25px 15px 0 15px;
}
.pb-28 {
  padding-bottom: 28px;
}
.align-right {
  text-align: right;
}
.btn_disable {
  background-color: #a0cfff !important;
  cursor: not-allowed;
}
.assets {
  max-height: 721px;
  background-color: $BgColor;
  //box-shadow: 0px 2px 0px 0px #e9eaf4;
  border-radius: 30px;
  padding: 35px 40px;
  .font_20 {
    font-size: 20px;
  }
  .address-wrap {
    justify-content: space-between;
    font-size: 24px;
    color: $txColor;
    margin: 10px 0 30px;
    i {
      color: $linkColor;
      font-size: 32px;
      cursor: pointer;
      margin-left: 20px;
    }
  }
  :deep(.el-table) {
    th .cell {
      font-size: 16px;
    }
    tr .cell {
      font-size: 16px;
      color: #fff !important;
    }
    tr .flex-center {
      span {
        //font-weight: 600;
        //margin-left: 10px;
      }
      .t_info {
        margin-left: 10px;
        span {
          //font-weight: 600;
          line-height: 1;
          margin-bottom: 5px;
        }
        p {
          font-size: 14px;
          text-align: left;
          color: $labelColor;
          line-height: 1;
        }
      }
    }
    .el-button--text {
      color: #4a5ef2;
    }
    .ydy {
      color: $labelColor;
    }
  }
}
@media screen and (max-width: 1024px) {
  .mobile-cont {
    display: block;
  }
  .assets {
    display: none;
  }
}
@media screen and (max-width: 1200px) {
  //.show_table {
  //  display: none;
  //}
  //.assets-list {
  //  display: block;
  //}
  .assets {
    padding: 20px;
    border-radius: 20px !important;
  }
  .assets .top .top-title {
    font-size: 18px;
  }
  .assets .font_20 {
    font-size: 16px;
  }
  .transfer-page .bottom {
    padding: 10px;
  }
}
</style>
