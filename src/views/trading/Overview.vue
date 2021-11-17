<template>
  <div class="overview pd_40_rd_20">
    <div class="head" v-if="swapSymbol.to">
      <div class="top flex-center">
        <symbol-icon class="img1" :icon="swapSymbol.from"></symbol-icon>
        <symbol-icon class="img2" :icon="swapSymbol.to"></symbol-icon>
        <div class="pair">{{ swapSymbol.from }}/{{ swapSymbol.to }}</div>
      </div>
      <div class="bottom" v-if="swapRate">{{ swapRate }}</div>
    </div>
    <div class="order-history">
      <div class="title">{{ $t("trading.trading1") }}</div>
      <el-table
        :data="list"
        max-height="435"
        v-loading="loading"
        element-loading-background="rgba(24, 24, 55, 0.8)"
      >
        <el-table-column width="20px"></el-table-column>
        <el-table-column
          prop="time"
          :label="$t('trading.trading2')"
        ></el-table-column>
        <el-table-column :label="$t('trading.trading3')">
          <template #default="scope">
            {{ $thousands(scope.row.toAmount) }} {{ scope.row.toSymbol }}
          </template>
        </el-table-column>
        <el-table-column prop="lock" :label="$t('trading.trading4')">
          <template #default="scope">
            {{ $thousands(scope.row.fromAmount) }} {{ scope.row.fromSymbol }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('trading.trading5')" width="80px">
          <template #default="scope">
            <span class="iconfont icon-chenggong" :scope="scope"></span>
          </template>
        </el-table-column>
      </el-table>
      <div class="mobile-list">
        <ul>
          <li v-for="(item, index) in list" :key="index" class="flex-between">
            <div class="left">
              <div>
                <span>{{ $t("trading.trading3") }}</span>
                <p>{{ $thousands(item.toAmount) + item.toSymbol }}</p>
              </div>
              <div>
                <span>{{ $t("trading.trading4") }}</span>
                <p>{{ $thousands(item.fromAmount) + item.fromSymbol }}</p>
              </div>
            </div>
            <div class="right">
              <div>
                <span>{{ $t("trading.trading5") }}</span>
                <p>{{ $t("trading.trading18") }}</p>
              </div>
              <div>
                <span>{{ $t("trading.trading2") }}</span>
                <p>{{ item.time }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <pagination v-model:pager="newPager" @change="changeList"></pagination>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import SymbolIcon from "@/components/SymbolIcon.vue";
import Pagination from "@/components/Pagination.vue";
import { SwapSymbol, OrderItem, Pager } from "./types";
export default defineComponent({
  props: {
    swapSymbol: {
      type: Object as PropType<SwapSymbol>,
      default: () => {}
    },
    swapRate: String,
    list: {
      type: Array as PropType<OrderItem[]>,
      default: () => []
    },
    loading: Boolean,
    pager: {
      type: Object as PropType<Pager>,
      default: () => {}
    }
  },
  components: {
    SymbolIcon,
    Pagination
  },
  setup(props, { emit }) {
    const newPager = computed({
      get() {
        return props.pager;
      },
      set(val) {
        emit("update:pager", val);
      }
    });
    function changeList() {
      emit("changeList");
    }
    return {
      newPager,
      changeList
    };
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";
.overview {
  //width: 790px;
  width: 60%;
  height: 752px;
  margin-right: 30px;
  //margin-right: 40px;
  .head {
    margin-bottom: 30px;
    .img1,
    .img2 {
      width: 35px;
      height: 35px;
      border-radius: 50%;
    }
    .img2 {
      margin-left: -8px;
    }
    .pair {
      margin-left: 10px;
      font-size: 24px;
    }
    .bottom {
      padding-top: 8px;
      font-size: 36px;
    }
  }
  .order-history {
    .title {
      font-size: 24px;
      margin-bottom: 15px;
      color: $labelColor;
    }
    :deep(.el-table) {
      th .cell {
        font-size: 16px;
        font-weight: 400;
      }
      tr .cell {
        line-height: 46px;
        font-size: 16px;
        color: #333;
      }
      .iconfont {
        color: #1678FF;
        font-size: 28px;
      }
    }
  }
  .mobile-list {
    display: none;
  }
  @media screen and (max-width: 1200px) {
    padding: 20px;
    .head {
      margin-bottom: 10px;
      .bottom {
        font-size: 32px;
      }
    }
    .order-history {
      :deep(.el-table) {
        th .cell {
          font-size: 14px;
        }
        tr .cell {
          line-height: 24px;
          font-size: 14px;
        }
        .iconfont {
          font-size: 24px;
        }
      }
    }
  }
  @media screen and (max-width: 500px) {
    padding: 0 !important;
    max-height: 480px !important;
    .head {
      margin-bottom: 10px;
      .top {
        img {
          width: 30px;
          height: 30px;
        }
        .pair {
          font-size: 18px;
        }
      }
      .bottom {
        padding-top: 5px;
        font-size: 22px;
      }
    }
    .order-history {
      .title {
        font-size: 22px;
        margin-bottom: 10px;
      }
      :deep(.el-table) {
        display: none;
      }
    }
    .mobile-list {
      display: block;
      ul {
        max-height: 335px;
        overflow: auto;
      }
      li {
        padding: 10px 0;
        border-bottom: 1px solid #202049;
        &:first-child {
          padding-top: 0;
        }
        &:last-child {
          border-bottom: none;
        }
      }
      .left,
      .right {
        div:first-child {
          margin-bottom: 2px;
        }
        span {
          font-size: 14px;
          color: $labelColor;
        }
        p {
          font-size: 14px;
        }
        .iconfont {
          color: #21d8ba;
          font-size: 20px;
        }
      }
    }
  }
}
</style>
