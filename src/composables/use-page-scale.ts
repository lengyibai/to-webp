import { onBeforeUnmount, onMounted, ref } from "vue";

const desktopBreakpoint = 1024;
const desktopReferenceHeight = 900;

/** 根据浏览器高度计算桌面页面缩放比例。 */
const usePageScale = () => {
  const pageScale = ref(1);
  let removeViewportResizeListener: (() => void) | undefined;

  onMounted(() => {
    const updatePageScale = () => {
      pageScale.value =
        window.innerWidth < desktopBreakpoint
          ? 1
          : Math.min(1, Math.max(window.innerHeight / desktopReferenceHeight, 0.1));
    };

    updatePageScale();
    window.addEventListener("resize", updatePageScale, { passive: true });
    removeViewportResizeListener = () => window.removeEventListener("resize", updatePageScale);
  });

  onBeforeUnmount(() => removeViewportResizeListener?.());

  return { pageScale };
};

export { usePageScale };
