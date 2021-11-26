<template>
  <div class="w1300">
    <div
      class="create-farm"
      v-loading="loading"
      element-loading-background="rgba(24, 24, 55, 0.8)"
    >
      <div class="head">
        <h3>{{ $t("farm.farm12") }}</h3>
      </div>
      <el-form label-position="top" :model="model" :rules="rules" ref="form">
        <el-form-item :label="$t('farm.farm13')" prop="tokenA">
          <el-select
            v-model="model.tokenA"
            filterable
            :placeholder="$t('createFarm.createFarm1')"
            popper-class="asset-select"
          >
            <el-option
              :label="item.symbol + '(' + item.assetKey + ')'"
              :value="item.assetKey"
              v-for="item in assetList"
              :key="item.assetKey"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('farm.farm15')" prop="tokenB">
          <el-select
            v-model="model.tokenB"
            filterable
            :placeholder="$t('createFarm.createFarm3')"
            popper-class="asset-select"
          >
            <el-option
              :label="item.symbol + '(' + item.assetKey + ')'"
              :value="item.assetKey"
              v-for="item in assetList"
              :key="item.assetKey"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('farm.farm16')" prop="syrupPerDay">
          <el-input
            v-model="model.syrupPerDay"
            :placeholder="$t('createFarm.createFarm4')"
          ></el-input>
        </el-form-item>
        <div class="balance">{{ $t("public.public12") }}{{ balance }}</div>
        <el-form-item :label="$t('farm.farm17')" prop="syrupTotalAmount">
          <el-input
            v-model="model.syrupTotalAmount"
            :placeholder="$t('createFarm.createFarm5')"
          ></el-input>
        </el-form-item>
        <div class="advanced">
          <el-switch
            v-model="advanced"
            active-color="#315D9B"
            inactive-color="#565a69"
            :active-text="$t('createFarm.createFarm12')"
            :width="35"
          ></el-switch>
        </div>
        <el-form-item
          :label="$t('farm.farm22')"
          prop="startTime"
          v-if="advanced"
        >
          <el-date-picker
            :placeholder="$t('createFarm.createFarm6')"
            v-model="model.startTime"
            type="datetime"
            :disabledDate="disableTime"
          ></el-date-picker>
        </el-form-item>
        <el-form-item
          :label="$t('farm.farm14')"
          prop="lockedTime"
          v-if="advanced"
        >
          <el-date-picker
            :placeholder="$t('createFarm.createFarm2')"
            v-model="model.lockedTime"
            type="datetime"
            :disabledDate="disableTime"
          ></el-date-picker>
        </el-form-item>
        <el-form-item class="checkbox-item" prop="check">
          <el-checkbox
            :label="$t('farm.farm18')"
            v-model="model.check"
          ></el-checkbox>
        </el-form-item>
        <el-form-item class="confirm-wrap">
          <el-button type="primary" @click="submitForm" v-if="takerAddress">
            {{ $t("farm.farm19") }}
          </el-button>
          <auth-button v-else></auth-button>
        </el-form-item>
      </el-form>
      <div class="my-farms" v-if="myFarms.length">
        <h3>{{ $t("createFarm.createFarm13") }}</h3>
        <ul>
          <li v-for="item in myFarms" :key="item.hash">
            <span @click="toMyFarm(item)">{{ item.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed } from "vue";
import nerve from "nerve-sdk-js";
// @ts-ignore
import { NTransfer } from "@/utils/api";
import { useToast } from "vue-toastification";
import { useI18n } from "vue-i18n";
import { getBlockInfo } from "@/service/api";
import { Minus, timesDecimals, Division } from "@/utils/util";
import config from "@/config";
import dayjs from "dayjs";
import AuthButton from "@/components/AuthButton.vue";
import useStoreState from "@/hooks/useStoreState";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";
import useMyFarm from "./hooks/useMyFarm";
import { ElForm } from "element-plus";

import { AssetItem } from "@/store";

export default defineComponent({
  name: "CreateFarm",
  components: {
    AuthButton
  },
  setup() {
    const { takerAddress, assetsList: assetList } = useStoreState();
    const { t } = useI18n();
    const toast = useToast();
    const form = ref<InstanceType<typeof ElForm>>();
    const loading = ref(false);
    const model = reactive({
      tokenA: "", // 质押的token
      lockedTime: "", // 质押token解锁时间
      tokenB: "", // 奖励的token
      syrupPerDay: "", // 每天可获得token奖励
      syrupTotalAmount: "", // 奖励token总量
      startTime: "", // 开始时间
      check: false
    });
    const { myFarms, toMyFarm, updateMyFarms } = useMyFarm();
    const rules = reactive({
      tokenA: [
        {
          required: true,
          message: t("createFarm.createFarm1"),
          trigger: "change"
        }
      ],
      lockedTime: [
        {
          type: "date",
          message: t("createFarm.createFarm2"),
          trigger: "change"
        }
      ],
      tokenB: [
        {
          required: true,
          message: t("createFarm.createFarm3"),
          trigger: "change"
        }
      ],
      syrupPerDay: [
        {
          required: true,
          message: t("createFarm.createFarm4"),
          trigger: "change"
        },
        { validator: validateSyrupTotalAmount, trigger: "blur" }
      ],
      syrupTotalAmount: [
        {
          required: true,
          message: t("createFarm.createFarm5"),
          trigger: "change"
        },
        { validator: validateSyrupTotalAmount, trigger: "blur" }
      ],
      startTime: [
        {
          type: "date",
          message: t("createFarm.createFarm6"),
          trigger: "change"
        }
      ],
      check: [{ validator: validateCheck, trigger: "blur" }]
    });
    const balance = computed(() => {
      const tokenB = assetList.value.find(v => v.assetKey === model.tokenB);
      if (!tokenB) return 0;
      return tokenB.available;
    });
    function validateSyrupPerDay(rule: any, value: any, callback: any) {
      // const reg = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d])?$");
      const reg = new RegExp("^([1-9][\\d]{0,1})$");
      if (!reg.exec(value)) {
        callback(t("createFarm.createFarm8"));
      } else {
        callback();
      }
    }
    function validateSyrupTotalAmount(rule: any, value: any, callback: any) {
      if (!model.tokenB) {
        const reg = new RegExp("^([1-9][\\d]*|0)(\\.[\\d]*)?$");
        if (!reg.exec(value)) {
          callback(t("createFarm.createFarm11"));
        } else {
          callback();
        }
      } else {
        const tokenB = assetList.value.find(
          (v: AssetItem) => v.assetKey === model.tokenB
        ) as AssetItem;
        const { decimals, available } = tokenB;
        const reg = new RegExp(
          "^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$"
        );
        // console.log(available, value, available < value);
        if (Minus(available, value).toNumber() < 0) {
          callback(t("createFarm.createFarm10"));
        } else if (!reg.exec(value)) {
          callback(t("createFarm.createFarm9") + decimals);
        } else {
          callback();
        }
      }
    }
    function validateCheck(rule: any, value: any, callback: any) {
      if (!value) {
        callback(t("createFarm.createFarm7"));
      } else {
        callback();
      }
    }

    function disableTime(date: Date) {
      // console.log(date, 132465)
      return new Date().getTime() > new Date(date).getTime();
    }

    function submitForm() {
      console.log(model, 999);
      form.value?.validate(valid => {
        if (valid) {
          createFarm();
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
    const { handleHex } = useBroadcastNerveHex();
    async function createFarm() {
      loading.value = true;
      try {
        const { lockedTime, syrupPerDay, syrupTotalAmount, startTime } = model;
        const tokenA = assetList.value.find(
          (v: AssetItem) => v.assetKey === model.tokenA
        ) as AssetItem;
        const tokenB = assetList.value.find(
          (v: AssetItem) => v.assetKey === model.tokenB
        ) as AssetItem;
        const syrupPerDay_amount = Division(syrupPerDay, (24 * 60 * 60) / 2);
        const syrupPerBlock = timesDecimals(
          syrupPerDay_amount,
          tokenB.decimals
        ).split(".")[0];
        const remark = "";
        const blockInfo: any = await getBlockInfo();
        const currentHeight = blockInfo.blockHeight;
        const diffSeconds = dayjs(startTime).diff(dayjs(new Date()), "seconds");
        const startBlockHeight = advanced.value
          ? Math.floor(Number(currentHeight) + diffSeconds / 2)
          : 1;
        const lockTo = advanced.value ? dayjs(lockedTime).unix() : 1;
        const tx = await nerve.swap.farmCreate(
          takerAddress.value,
          nerve.swap.token(tokenA.chainId, tokenA.assetId),
          nerve.swap.token(tokenB.chainId, tokenB.assetId),
          config.chainId,
          timesDecimals(syrupTotalAmount, tokenB.decimals),
          syrupPerBlock,
          startBlockHeight,
          lockTo,
          config.prefix,
          remark
        );
        const result: any = await handleHex(tx.hex);
        if (result && result.hash) {
          toast.success(t("transfer.transfer14"));
          updateMyFarms({
            type: tokenA.symbol.indexOf("_") > -1 ? "farm" : "pool",
            hash: result.hash,
            name: tokenA.symbol
          });
          form.value?.resetFields();
          back();
        } else {
          toast.error("Create farm failed");
        }
      } catch (e) {
        console.log(e, "create-farm-error");
        toast.error(e.message || e);
      }
      loading.value = false;
    }
    function back() {
      // router.go(-1);
    }

    const advanced = ref(false);

    return {
      loading,
      form,
      model,
      rules,
      balance,
      assetList,
      disableTime,
      submitForm,
      back,
      advanced,
      takerAddress,
      myFarms,
      toMyFarm
    };
  }
});
</script>

<style lang="scss">
@import "../../assets/css/style.scss";
.create-farm {
  max-width: 470px;
  width: 100%;
  margin: 0 auto;
  border-radius: 20px;
  padding: 40px;
  background: $BgColor;
  .head {
    position: relative;
    margin-bottom: 20px;
    h3 {
      text-align: center;
      font-size: 24px;
    }
    .back {
      position: absolute;
      top: -3px;
      left: 0;
      font-size: 30px;
      cursor: pointer;
      i {
        font-weight: 600;
      }
    }
  }
  .el-form {
    .el-form-item {
      margin-bottom: 16px;
    }
    .el-form-item__label {
      line-height: 30px;
      padding-bottom: 0;
      color: $labelColor;
    }
    .balance {
      float: right;
      line-height: 30px;
      padding-bottom: 0;
      color: #7e87c2;
      font-size: 14px;
    }
    .el-select {
      width: 100%;
    }
    .checkbox-item {
      .el-form-item__content {
        line-height: initial;
      }
    }
    .el-checkbox {
      white-space: inherit;
    }
    .el-checkbox__inner {
      //border-color: #4a5ef2;
      width: 18px;
      height: 18px;
      &::after {
        height: 8px;
        left: 6px;
        top: 2px;
        width: 4px;
      }
    }
    /*.el-checkbox__input.is-checked .el-checkbox__inner,
    .el-checkbox__input.is-indeterminate .el-checkbox__inner {
      background-color: #4a5ef2;
    }*/
    .el-checkbox__label {
      color: #58587B;
      display: inline;
    }
    .el-date-editor.el-input,
    .el-date-editor.el-input__inner {
      width: 100%;
    }
    .confirm-wrap {
      margin-top: 30px;
    }
  }
  .advanced {
    display: flex;
    justify-content: flex-end;
    .el-switch__label {
      color: $labelColor;
    }
  }
  .my-farms {
    padding-top: 20px;
    h3 {
      font-size: 16px;
    }
    li {
      span {
        font-size: 14px;
        cursor: pointer;
        color: $linkColor;
      }
    }
  }
}
.asset-select.el-select__popper.el-popper[role="tooltip"] {
  .el-popper__arrow:before {
    background: $formItemColor;
    border: 0 !important;
  }
}
@media screen and (max-width: 1200px) {
  .create-farm {
    padding: 25px;
  }
}
</style>
