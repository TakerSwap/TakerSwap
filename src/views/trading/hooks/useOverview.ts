import { ref, onMounted, onBeforeUnmount, computed } from "vue";

export default function useOverview() {
  const showOverview = ref(false);
  function toggleOverview() {
    showOverview.value = !showOverview.value;
  }
  const isMobile = ref(false);
  function checkIsMobile() {
    isMobile.value = document.documentElement.clientWidth < 1000;
  }
  onMounted(() => {
    checkIsMobile();
    if (isMobile.value) {
      // context.emit("update:collapseMenu", true);
    }
    window.addEventListener("resize", checkIsMobile);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("resize", checkIsMobile);
  });

  const showMobileOverview = computed(() => {
    return isMobile.value && showOverview.value;
  });

  return {
    showOverview,
    toggleOverview,
    isMobile,
    showMobileOverview
  };
}
