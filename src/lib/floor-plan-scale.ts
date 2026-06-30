import {
  FLOOR_PLAN_LAYOUT_BY_CODE,
  FLOOR_PLAN_VIEWBOX,
  type FloorPlanBoothLayout,
} from "@/lib/floor-plan-layout";

export type FloorPlanViewBox = { width: number; height: number };

export function resolveFloorPlanViewBox(
  width: number | null | undefined,
  height: number | null | undefined
): FloorPlanViewBox {
  return {
    width: width && width > 0 ? width : FLOOR_PLAN_VIEWBOX.width,
    height: height && height > 0 ? height : FLOOR_PLAN_VIEWBOX.height,
  };
}

export function floorPlanScaleFactors(viewBox: FloorPlanViewBox) {
  return {
    scaleX: viewBox.width / FLOOR_PLAN_VIEWBOX.width,
    scaleY: viewBox.height / FLOOR_PLAN_VIEWBOX.height,
  };
}

export function scaleBoothLayout(
  layout: Pick<FloorPlanBoothLayout, "x" | "y" | "w" | "h">,
  viewBox: FloorPlanViewBox
) {
  const { scaleX, scaleY } = floorPlanScaleFactors(viewBox);
  return {
    x: Math.round(layout.x * scaleX),
    y: Math.round(layout.y * scaleY),
    w: Math.round(layout.w * scaleX),
    h: Math.round(layout.h * scaleY),
  };
}

export function scaledLayoutForBoothCode(
  code: string,
  viewBox: FloorPlanViewBox,
  stored?: { layoutX: number | null; layoutY: number | null; layoutW: number | null; layoutH: number | null } | null
) {
  if (
    stored?.layoutX != null &&
    stored.layoutY != null &&
    stored.layoutW != null &&
    stored.layoutH != null
  ) {
    return {
      x: stored.layoutX,
      y: stored.layoutY,
      w: stored.layoutW,
      h: stored.layoutH,
    };
  }

  const layout = FLOOR_PLAN_LAYOUT_BY_CODE[code];
  if (!layout) return { x: 0, y: 0, w: 0, h: 0 };
  return scaleBoothLayout(layout, viewBox);
}
