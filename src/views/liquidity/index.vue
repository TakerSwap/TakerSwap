<template>
  <div class="w1300">
    <div
      class="liquidity"
      v-loading="loading"
      element-loading-background="rgba(24, 24, 55, 0.8)"
    >
      <div class="overview" v-if="!addLiquidity">
        <div class="top-part">
          <div class="title">
            <h3>{{ $t("liquidity.liquidity1") }}</h3>
            <p>{{ $t("liquidity.liquidity2") }}</p>
          </div>
          <div class="confirm-wrap">
            <el-button type="primary" @click="addLiquidity = true">
              {{ $t("liquidity.liquidity3") }}
            </el-button>
          </div>
        </div>
        <div class="your-liquidity" v-if="takerAddress">
          <h3>{{ $t("liquidity.liquidity4") }}</h3>
          <div class="liquidity-list">
            <div v-for="(item, index) in liquidityList" :key="index">
              <div :class="['list-item', item.showDetail ? 'hide-border' : '']">
                <div class="symbol">
                  <div class="symbol-cont">
                    <div class="img-wrap">
                      <symbol-icon
                        class="symbol1"
                        :icon="item.token0.symbol"
                      ></symbol-icon>
                      <symbol-icon
                        class="symbol2"
                        :icon="item.token1.symbol"
                      ></symbol-icon>
                    </div>
                    <span>{{ item.lpTokenAmount.token.symbol }}</span>
                  </div>
                  <div class="amount-cont">{{ item.amount }}</div>
                </div>
                <div class="view-detail" @click="toggleDetail(item)">
                  <i
                    :class="{
                      'el-icon-arrow-right': true,
                      expand: item.showDetail
                    }"
                  ></i>
                </div>
              </div>
              <collapse-transition>
                <detail-bar
                  v-show="item.showDetail"
                  :takerAddress="takerAddress"
                  :info="item"
                  @loading="handleLoading"
                  @updateList="getData"
                ></detail-bar>
              </collapse-transition>
            </div>
            <div class="no-data" v-if="!liquidityList.length">No Data</div>
          </div>
          <pagination
            v-model:pager="pager"
            @change="getUserLiquidity"
          ></pagination>
        </div>
      </div>
      <add-liquidity
        v-else
        v-model:show="addLiquidity"
        :defaultAsset="defaultAsset"
        :assetsList="assetsList"
        :takerAddress="takerAddress"
        @updateList="getData"
      ></add-liquidity>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref
} from "vue";
import AddLiquidity from "./AddLiquidity.vue";
import CollapseTransition from "@/components/CollapseTransition.vue";
import DetailBar from "./DetailBar.vue";
import SymbolIcon from "@/components/SymbolIcon.vue";
import Pagination from "@/components/Pagination.vue";
import { userLiquidityPage } from "@/service/api";
import { divisionAndFix } from "@/api/util";
import useStoreState from "@/hooks/useStoreState";
import useAsset from "@/views/trading/hooks/useAsset";

import { LiquidityItem } from "./types";

export default defineComponent({
  name: "liquidity",
  components: {
    AddLiquidity,
    CollapseTransition,
    DetailBar,
    SymbolIcon,
    Pagination
  },
  setup() {
    const { takerAddress } = useStoreState();
    const { assetsList, defaultAsset, hasQuery: addLiquidity } = useAsset();
    let timer: number;
    onMounted(async () => {
      await getData();
      timer = window.setInterval(async () => {
        await getData();
      }, 5000);
    });
    async function getData() {
      await getUserLiquidity();
      // state.assetsList = await getAssetList(takerAddress.value);
    }
    onBeforeUnmount(() => {
      clearInterval(timer);
    });

    const liquidityList = ref<LiquidityItem[]>([] as LiquidityItem[]);
    const pager = reactive({
      index: 1,
      size: 5,
      total: 0
    });
    async function getUserLiquidity() {
      if (takerAddress.value) {
        const res: any = await userLiquidityPage({
          userAddress: takerAddress.value,
          pageIndex: pager.index,
          pageSize: pager.size
        });
        if (res) {
          pager.total = res.total || 0;
          res.list.map((v: LiquidityItem) => {
            const info = v.lpTokenAmount;
            v.amountSlice = divisionAndFix(info.amount, info.token.decimals, 2);
            v.amount = divisionAndFix(
              info.amount,
              info.token.decimals,
              info.token.decimals
            );
            const exist = liquidityList.value.find(
              item => v.pairAddress === item.pairAddress
            );
            v.showDetail = exist ? exist.showDetail : false;
          });
          liquidityList.value = res.list.filter(
            (item: LiquidityItem) => item.amount !== "0"
          );
        }
      }
    }

    function toggleDetail(item: LiquidityItem) {
      for (let liquidityItem of liquidityList.value) {
        if (item.amount === liquidityItem.amount) {
          item.showDetail = !item.showDetail;
        } else {
          liquidityItem.showDetail = false;
        }
      }
    }

    const loading = ref(false);
    function handleLoading(status: boolean) {
      loading.value = status;
    }
    return {
      takerAddress,
      assetsList,
      defaultAsset,
      addLiquidity,
      liquidityList,
      loading,
      toggleDetail,
      handleLoading,
      getData,
      pager,
      getUserLiquidity
    };
  }
});
</script>

<style lang="scss">
@import "../../assets/css/style.scss";
.liquidity {
  overflow: hidden;
  max-width: 470px;
  margin: 0 auto;
  border-radius: 20px;
  background-color: $BgColor;
  h3 {
    font-size: 24px;
    font-weight: 400;
  }
  .top-part {
    padding: 40px;
    h3 {
      margin-bottom: 5px;
    }
    .confirm-wrap {
      margin-top: 36px;
    }
  }
  .your-liquidity {
    padding: 35px 40px 30px;
    border-top: 1px solid #202049;
    h3 {
      color: $labelColor;
    }
    .liquidity-list {
      margin-top: 10px;
      .list-item {
        height: 74px;
        padding: 20px 0;
        border-bottom: 1px solid #202049;
        display: flex;
        align-items: center;
        &.hide-border {
          border: none;
        }
      }
      .symbol {
        //flex: 5;
        display: flex;
        //align-items: center;
        flex-direction: column;
        .symbol-cont {
          display: flex;
          align-items: center;
          img {
            width: 32px;
            height: 32px;
            overflow: hidden;
            border-radius: 50%;
          }
          .img-wrap {
            display: flex;
            align-items: center;
            margin-right: 10px;
          }
          .symbol1 {
            z-index: 2;
          }
          .symbol2 {
            margin-left: -10px;
          }
        }
        .amount-cont {
          margin-top: 5px;
          color: $labelColor;
        }
      }
      .value {
        flex: 3;
        text-align: center;
      }
      .view-detail {
        flex: 2;
        color: $linkColor;
        text-align: right;
        cursor: pointer;
      }
    }
    .no-data {
      padding-top: 40px;
      text-align: center;
      color: #909399;
      font-size: 14px;
    }
  }
  @media screen and (max-width: 500px) {
    h3 {
      font-size: 22px;
    }
    .top-part,
    .your-liquidity {
      padding: 20px;
    }
  }
}
.pagination-cont {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
