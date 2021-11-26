<template>
  <div class="custom-overlay">
    <el-dialog
      custom-class="add-assets-dialog"
      :title="$t('assets.assets7')"
      :show-close="false"
      top="10vh"
      v-model="show"
      @closed="close"
    >
      <el-input
        v-model="searchVal"
        :placeholder="$t('assets.assets8')"
      ></el-input>
      <ul class="list-wrap">
        <li
          v-for="item in list"
          :key="item.assetKey"
          @click="changeSelect(item.assetKey)"
        >
          <div class="flex-center">
            <symbol-icon :icon="item.symbol"></symbol-icon>
            <div class="asset-base-info">
              <div>
                {{ item.symbol }}
                <span>({{ item.originNetwork }})</span>
              </div>
              <span>ID: {{ item.assetKey }}</span>
            </div>
          </div>
          <el-checkbox v-model="item.added" disabled></el-checkbox>
        </li>
      </ul>
      <div class="footer-wrap">
        <el-button @click="close">{{ $t("public.public8") }}</el-button>
        <el-button type="primary" @click="confirm">
          {{ $t("public.public9") }}
        </el-button>
      </div>
      <div class="dialog-footer_mobile">
        <el-button @click="close">
          {{ $t("public.public8") }}
        </el-button>
        <el-button type="primary" @click="confirm">
          {{ $t("public.public9") }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import SymbolIcon from "@/components/SymbolIcon.vue";
import _ from "lodash";
import storage from "@/utils/storage";
export default {
  components: {
    SymbolIcon
  },
  data() {
    this.allAssetsList = [];
    return {
      show: false,
      list: [],
      searchVal: ""
    };
  },
  props: {
    showAssetManage: Boolean,
    assetList: {
      type: Array,
      default: () => []
    },
    selectAssets: {
      type: Array,
      default: () => []
    }
  },

  watch: {
    showAssetManage: {
      immediate: true,
      handler(val) {
        console.log(val, 132);
        this.show = val;
      }
    },
    searchVal(val) {
      this.filter(val);
    },
    assetList: {
      // deep: true,
      immediate: true,
      handler(val) {
        if (!val || !val.length || (this.show && this.list.length)) return;
        const list = _.cloneDeep(this.assetList);
        list.map(item => {
          item.added = false;
          this.selectAssets.map(v => {
            if (item.assetKey === v.assetKey) {
              item.added = true;
            }
          });
        });
        this.allAssetsList = list;
        this.filter(this.searchVal);
      }
    }
  },
  methods: {
    filter(str) {
      if (!str) {
        this.list = this.allAssetsList.filter(v => v);
      } else {
        this.list = this.allAssetsList.filter(v => {
          return (
            v.assetKey.indexOf(str) > -1 ||
            v.symbol.toUpperCase().indexOf(str.toUpperCase()) > -1
          );
        });
      }
    },
    changeSelect(key) {
      this.allAssetsList.map(v => {
        if (v.assetKey === key) {
          v.added = !v.added;
        }
      });
      this.filter(this.searchVal);
    },
    close() {
      this.$emit("update:showAssetManage", false);
      this.searchVal = "";
    },
    confirm() {
      const select = [];
      this.allAssetsList.map(v => {
        if (v.added) {
          select.push(v.assetKey);
        }
      });
      const currentAccount = this.$store.state.addressInfo;
      currentAccount.visiableAssets = select;
      const accountList = storage.get("local", "accountList") || [];
      accountList.map(v => {
        if (v.pub === currentAccount.pub) {
          v.visiableAssets = select;
        }
      });
      storage.set("local", "accountList", accountList);

      this.$store.commit("setCurrentAddress", currentAccount);
      this.$emit("addAssets");
      this.close();
    }
  }
};
</script>
<style lang="scss">
@import "../../assets/css/style.scss";
.add-assets-dialog {
  max-width: 470px !important;
  .el-input {
    .el-input__inner {
      border-radius: 10px;
      line-height: 58px;
      height: 58px;
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
      /* border-bottom: 1px solid #dfe4ef; */
      cursor: pointer;
      img {
        width: 48px;
        height: 48px;
        margin-right: 15px;
      }
      .asset-base-info {
        /* width: 120px; */
        div {
          font-size: 18px;
          //font-weight: 600;
        }
        span {
          font-size: 14px;
          color: $labelColor;
          font-weight: 400;
        }
      }
      .el-checkbox {
        margin-right: 10px;
        .el-checkbox__inner {
          width: 20px;
          height: 20px;
          &::after {
            height: 10px;
            left: 6px;
            top: 2px;
            font-weight: 600;
            width: 5px;
          }
        }
        .el-checkbox__input .el-checkbox__inner {
          cursor: pointer!important;
          &:after {
            cursor: pointer!important;
          }
        }
      }
    }
  }
  .footer-wrap {
    display: block;
    padding-top: 60px;
    .el-button {
      width: 185px;
      height: 48px;
      & + .el-button {
        margin-left: 20px;
      }
    }
  }

  .dialog-footer_mobile {
    display: none;
  }

  @media screen and (max-width: 470px) {
    //.footer-wrap {
    //  display: none !important;
    //}
    //.dialog-footer_mobile {
    //  margin-top: 20px !important;
    //  display: flex !important;
    //  align-items: center;
    //  justify-content: space-around;
    //  .el-button_mobile {
    //    max-width: 85px;
    //    width: 100%;
    //  }
    //}
  }

  @media screen and (max-width: 1200px) {
    .custom-overlay {
      .el-overlay {
        padding: 20px !important;
      }
    }
    .list-wrap {
      li {
        .asset-base-info {
          //width: 2rem;
        }
        .el-checkbox {
          margin-right: 0;
        }
      }
    }
  }
  @media screen and (max-width: 500px) {
    .el-input {
      .el-input__inner {
        border-radius: 10px;
        line-height: 36px;
        height: 36px;
      }
      margin-bottom: 15px;
    }
    .list-wrap {
      li {
        height: 50px;
        padding: 9px 0;
        /* border-bottom: 1px solid #dfe4ef; */
        cursor: pointer;
        img {
          width: 30px;
          height: 30px;
          margin-right: 15px;
        }
        .asset-base-info {
          div {
            font-size: 16px;
          }
          span {
            font-size: 13px;
          }
        }
        .el-checkbox {
          .el-checkbox__inner {
            width: 16px;
            height: 16px;
            &::after {
              height: 10px;
              left: 5px;
              top: 0;
              width: 4px;
            }
          }
        }
      }
    }
    .footer-wrap {
      padding-top: 20px;
      text-align: center;
      .el-button {
        width: 110px;
        height: 36px;
        & + .el-button {
          margin-left: 20px;
        }
      }
    }
  }
}
</style>
