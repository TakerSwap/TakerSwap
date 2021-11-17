import { ref, onMounted, onBeforeUnmount } from "vue";

type Handel = (refresh?: boolean, isTemp?: boolean) => Promise<void>;

export default function useRefreshRate(refreshHandle: Handel) {
  const canRefresh = ref(false);
  async function refresh(args?: boolean[]) {
    const startTime = new Date().getTime();
    try {
      canRefresh.value = false;
      await refreshHandle();
      // await storeSwapPairInfo(true);
      // await storeSwapPairInfo(true, true);
    } catch (e) {
      //
    }
    const endTime = new Date().getTime();
    const diff = endTime - startTime;
    if (diff < 1500) {
      setTimeout(() => {
        canRefresh.value = true;
      }, 1500 - diff);
    } else {
      canRefresh.value = true;
    }
  }

  let timer: number;
  onMounted(() => {
    timer = window.setInterval(async () => {
      await refresh();
    }, 5000);
  });
  onBeforeUnmount(() => {
    clearInterval(timer);
  });

  async function forceRefresh() {
    if (timer) clearInterval(timer);
    await refresh();
    timer = window.setInterval(async () => {
      await refresh();
    }, 5000);
  }
  return {
    canRefresh,
    refresh,
    forceRefresh
  };
}
