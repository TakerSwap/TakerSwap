<template>
  <el-dialog
    custom-class="select-assets-dialog"
    :title="$t('transfer.transfer12')"
    :show-close="true"
    top="10vh"
    v-model="show"
    @closed="searchVal = ''"
  >
    <el-input
      v-if="!hideSearchInput"
      v-model="searchVal"
      :placeholder="$t(showAmount ? 'assets.assets8' : 'assets.assets9')"
    ></el-input>
    <ul class="list-wrap">
      <li
        v-for="item in assetList"
        :key="item.assetKey"
        :class="{
          disable_asset:
            selectedAsset &&
            selectedAsset.chainId === item.chainId &&
            selectedAsset.assetId === item.assetId
        }"
        @click="changeSelect(item)"
      >
        <div class="flex-center flex-1" style="width: 100%">
          <SymbolIcon :icon="item.symbol"></SymbolIcon>
          <div class="asset-base-info">
            <div>
              {{ item.symbol }}
              <span>({{ item.originNetwork }})</span>
            </div>
            <span v-if="showAmount">ID: {{ item.assetKey }}</span>
            <template v-else>
              <span class="pc-span">{{ item.contractAddress }}</span>
              <span class="mobile-span">
                {{ superLong(item.contractAddress, 15) }}
              </span>
            </template>
          </div>
          <div class="asset-price ellipsis" v-if="showBalance">
            <span class="ellipsis" v-if="showAmount">
              {{ item.listAvailable }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </el-dialog>
</template>

<script>
import { defineComponent, ref, watch, computed } from "vue";
import { superLong } from "@/api/util";
import SymbolIcon from "@/components/SymbolIcon.vue";

export default defineComponent({
  name: "AssetsDialog",
  components: {
    SymbolIcon
  },
  props: {
    showDialog: Boolean,
    assetList: {
      type: Array,
      default: () => []
    },
    showAmount: {
      type: Boolean,
      default: true
    },
    showBalance: {
      type: Boolean
    },
    selectedAsset: {
      type: Object,
      default: () => null
    },
    hideSearchInput: {
      type: Boolean,
      default: false
    }
  },
  emits: ["filterAsset", "changeSelect", "update:showDialog"],
  setup(props, { emit }) {
    const show = computed({
      get() {
        return props.showDialog;
      },
      set(val) {
        emit("update:showDialog", val);
      }
    });

    const searchVal = ref("");
    watch(
      () => searchVal.value,
      val => {
        emit("filterAsset", val);
      }
    );

    function changeSelect(asset) {
      emit("changeSelect", asset);
    }

    return {
      show,
      searchVal,
      superLong,
      changeSelect
    };
  }
});
</script>

<style scoped lang="scss">
@import "../assets/css/style.scss";
.select-assets-dialog {
  .el-input {
    .el-input__inner {
      border-radius: 10px;
      line-height: 45px;
      height: 45px;
    }
    margin-bottom: 15px;
  }
  .list-wrap {
    max-height: 50vh;
    overflow-y: auto;
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 66px;
      padding: 9px 0;
      cursor: pointer;
      img {
        width: 48px;
        height: 48px;
        margin-right: 15px;
      }
      .asset-base-info {
        flex: 1;
        div {
          font-size: 18px;
          //font-weight: 600;
        }
        span {
          font-size: 14px;
          color: $labelColor;
          font-weight: 400;
        }
        .mobile-span {
          display: none;
        }
      }
      .asset-price {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: right;
        max-width: 70%;
        span:nth-child(1) {
          text-align: right;
          font-size: 20px;
          //font-weight: bold;
        }
      }
    }
    .disable_asset {
      opacity: 0.6;
      cursor: not-allowed !important;
    }
  }
  @media screen and (max-width: 1200px) {
    .list-wrap {
      li {
        .asset-base-info {
          .pc-span {
            display: none;
          }
          .mobile-span {
            display: block;
          }
        }
      }
    }
  }
  @media screen and (max-width: 500px) {
    .el-input {
      .el-input__inner {
        line-height: 36px;
        height: 36px;
      }
      margin-bottom: 10px;
    }
    .list-wrap {
      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 48px;
        cursor: pointer;
        img {
          width: 30px;
          height: 30px;
          margin-right: 10px;
        }
        .asset-base-info {
          flex: 1;
          div {
            font-size: 14px;
          }
          span {
            font-size: 12px;
          }
        }
        .asset-price {
          max-width: 60%;
          span:nth-child(1) {
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style>
