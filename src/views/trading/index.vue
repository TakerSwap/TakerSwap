<template>
  <div class="w1300 trading-page">
    <Overview
      v-if="showOverview && !isMobile"
      :swapSymbol="swapSymbol"
      :swapRate="swapRate"
      :list="orderList"
      v-model:pager="pager"
      @changeList="changeList"
    ></Overview>
    <Swap
      :assetsList="assetsList"
      :defaultAsset="defaultAsset"
      @toggleExpand="toggleOverview"
      @selectAsset="selectAsset"
      @updateRate="updateRate"
    ></Swap>
    <el-dialog
      custom-class="mobile-overview-dialog"
      top="10vh"
      v-model="showMobileOverview"
      :show-close="false"
      @closed="showOverview = false"
    >
      <Overview
        :swapSymbol="swapSymbol"
        :swapRate="swapRate"
        :list="orderList"
        v-model:pager="pager"
        @changeList="changeList"
      ></Overview>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, watch, ref } from "vue";
import Overview from "./Overview.vue";
import Swap from "./Swap.vue";
import useOverview from "./hooks/useOverview";
import useAsset from "./hooks/useAsset";
import useSelectAsset from "./hooks/useSelectAsset";

export default defineComponent({
  name: "trading",
  components: {
    Overview,
    Swap
  },
  setup() {
    const { showOverview, toggleOverview, isMobile, showMobileOverview } =
      useOverview();

    const { assetsList, defaultAsset } = useAsset();

    const { swapSymbol, orderList, pager, selectAsset, selectedAsset } =
      useSelectAsset();

    // url带交易对信息时请求一次订单列表信息
    watch(
      defaultAsset,
      val => {
        if (val.to) {
          selectAsset(val.from, val.to);
        }
      },
      { immediate: true }
    );
    watch(
      assetsList,
      val => {
        if (val && val.length) {
          if (selectedAsset) {
            selectAsset(selectedAsset.from, selectedAsset.to);
          }
        }
      },
      {
        immediate: true,
        deep: true
      }
    );

    function changeList() {
      selectAsset(selectedAsset.from, selectedAsset.to);
    }

    const swapRate = ref("");
    function updateRate(rate) {
      swapRate.value = rate;
    }

    return {
      showOverview,
      toggleOverview,
      isMobile,
      showMobileOverview,
      assetsList,
      defaultAsset,
      swapSymbol,
      orderList,
      selectAsset,
      pager,
      changeList,
      swapRate,
      updateRate
    };
  }
});
</script>

<style lang="scss">
.trading-page {
  display: flex;
  justify-content: center;
  padding: 0 20px;
  .mobile-overview-dialog {
    max-width: 680px !important;
    .el-dialog__header,
    .el-dialog__body {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .el-dialog__header {
      padding-top: 16px !important;
      padding-bottom: 0;
    }
    .el-dialog__body {
      padding-top: 10px !important;
    }
    .overview {
      width: 100%;
      max-height: 640px;
      padding: 0 10px 10px;
    }
  }
}
</style>
