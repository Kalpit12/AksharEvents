export type LogoPalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

type SampledColor = {
  r: number;
  g: number;
  b: number;
  count: number;
  h: number;
  s: number;
  l: number;
  score: number;
  isNeutral: boolean;
};

export const DEFAULT_PALETTE: LogoPalette = {
  primary: "#0d9488",
  secondary: "#0f766e",
  accent: "#14b8a6",
  background: "#ffffff",
  foreground: "#000000",
};

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase()}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  const hn = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

function relativeLuminance(r: number, g: number, b: number) {
  const toLinear = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function hexFromHsl(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, clamp(s), clamp(l));
  return rgbToHex(r, g, b);
}

function contrastForeground(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return relativeLuminance(r, g, b) > 0.45 ? "#000000" : "#ffffff";
}

export function isHexColor(value: string | null | undefined) {
  return Boolean(value && /^#[0-9A-Fa-f]{6}$/.test(value.trim()));
}

export function normalizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim();
  if (isHexColor(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback.toLowerCase();
}

/** Quantize RGBA pixels into a brand palette suitable for partner theming. */
export function extractPaletteFromRgba(
  data: Uint8Array | Uint8ClampedArray | Buffer,
  width = 0,
  height = 0
): LogoPalette {
  if (width > 0 && height > 0 && data.length < width * height * 4) return DEFAULT_PALETTE;

  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  let opaque = 0;
  let lightCount = 0;
  let lightR = 0;
  let lightG = 0;
  let lightB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] ?? 255;
    if (alpha < 140) continue;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    opaque += 1;
    const { l } = rgbToHsl(r, g, b);
    if (l > 0.88) {
      lightCount += 1;
      lightR += r;
      lightG += g;
      lightB += b;
    }
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  if (opaque === 0 || buckets.size === 0) return DEFAULT_PALETTE;

  const sampled: SampledColor[] = [...buckets.values()].map((bucket) => {
    const r = Math.round(bucket.r / bucket.count);
    const g = Math.round(bucket.g / bucket.count);
    const b = Math.round(bucket.b / bucket.count);
    const { h, s, l } = rgbToHsl(r, g, b);
    const isNeutral = s < 0.14 || l > 0.93 || l < 0.06;
    const midtone = 1 - Math.abs(l - 0.42) * 1.15;
    const score = bucket.count * (isNeutral ? 0.08 : 0.4 + s * 1.6) * Math.max(0.15, midtone);
    return { r, g, b, count: bucket.count, h, s, l, score, isNeutral };
  });

  sampled.sort((a, b) => b.score - a.score);

  const background =
    lightCount / opaque > 0.18
      ? rgbToHex(lightR / lightCount, lightG / lightCount, lightB / lightCount)
      : "#ffffff";

  const distinct: SampledColor[] = [];
  for (const color of sampled) {
    if (distinct.some((existing) => hueDistance(existing.h, color.h) < 22 && Math.abs(existing.l - color.l) < 0.16)) {
      continue;
    }
    if (color.isNeutral && distinct.length > 0 && color.s < 0.08) continue;
    distinct.push(color);
    if (distinct.length >= 4) break;
  }

  const brand = distinct.filter((c) => !c.isNeutral);
  const ink = distinct.find((c) => c.l < 0.35) ?? distinct[0] ?? sampled[0];
  const lead = brand[0] ?? ink;
  if (!lead) return DEFAULT_PALETTE;

  let primary = lead;
  if (primary.l > 0.78) {
    primary = { ...primary, l: 0.46, s: Math.max(primary.s, 0.45) };
  } else if (primary.l < 0.12 && brand[0]) {
    primary = brand[0];
  }

  const second = brand.find((c) => c !== lead && hueDistance(c.h, primary.h) > 18) ?? brand[1];
  const third = brand.find((c) => c !== lead && c !== second) ?? brand[2];

  const primaryHex = hexFromHsl(primary.h, Math.max(primary.s, 0.28), clamp(primary.l, 0.22, 0.62));
  const secondaryHex = second
    ? hexFromHsl(second.h, Math.max(second.s, 0.22), clamp(second.l, 0.18, 0.55))
    : hexFromHsl(primary.h, Math.max(primary.s, 0.3), clamp(primary.l - 0.14, 0.16, 0.42));
  const accentHex = third
    ? hexFromHsl(third.h, Math.max(third.s, 0.35), clamp(third.l, 0.35, 0.68))
    : hexFromHsl(primary.h, Math.min(1, primary.s + 0.12), clamp(primary.l + 0.12, 0.38, 0.72));

  return {
    primary: primaryHex,
    secondary: secondaryHex,
    accent: accentHex,
    background: normalizeHexColor(background, "#ffffff"),
    foreground: contrastForeground(background),
  };
}