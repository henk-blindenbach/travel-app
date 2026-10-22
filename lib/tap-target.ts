/** Minimum interactive size for one-handed phone use (Apple HIG / WCAG). */
export const MIN_TAP_TARGET_PX = 44;

export function meetsMinTapTarget(width: number, height: number, min = MIN_TAP_TARGET_PX) {
  return width >= min && height >= min;
}
