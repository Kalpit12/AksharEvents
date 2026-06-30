/** Wrap a raster floor plan in an SVG document for storage and download. */
export function buildFloorPlanSvg(imageUrl: string, width: number, height: number): string {
  const safeUrl = imageUrl
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `  <image href="${safeUrl}" xlink:href="${safeUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`,
    "</svg>",
  ].join("\n");
}
