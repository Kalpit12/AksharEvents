"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  DEFAULT_PALETTE,
  extractPaletteFromRgba,
  type LogoPalette,
} from "@/lib/logo-palette";
import {
  MAX_PARTNER_LOGO_BYTES,
  PARTNER_LOGO_ACCEPT,
  isAllowedPartnerLogo,
} from "@/lib/partner-logo-constants";
import { cn } from "@/lib/utils";

async function extractPaletteFromImageFile(file: File): Promise<LogoPalette> {
  const { image, url } = await loadImageFromFile(file);
  try {
    const maxEdge = 96;
    const width = Math.max(1, image.naturalWidth || image.width || maxEdge);
    const height = Math.max(1, image.naturalHeight || image.height || maxEdge);
    const scale = Math.min(maxEdge / width, maxEdge / height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return DEFAULT_PALETTE;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return extractPaletteFromRgba(pixels.data, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read logo image"));
    };
    image.src = url;
  });
}

function ColorField({
  id,
  name,
  label,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <Input
          id={id}
          name={name}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-10 w-14 cursor-pointer p-1"
        />
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

export function PartnerLogoField({
  idPrefix,
  currentLogoUrl,
  colors,
  onColorsChange,
}: {
  idPrefix: string;
  currentLogoUrl?: string | null;
  colors: LogoPalette;
  onColorsChange: (colors: LogoPalette) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(currentLogoUrl ?? null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(currentLogoUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [paletteApplied, setPaletteApplied] = useState(false);

  const replacePreview = (next: string | null) => {
    if (previewUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = next;
    setPreview(next);
  };

  useEffect(() => {
    if (!fileName) replacePreview(currentLogoUrl ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!isAllowedPartnerLogo(file)) {
      setError("Upload a PNG, JPG, WEBP, GIF, or SVG logo");
      return;
    }
    if (file.size > MAX_PARTNER_LOGO_BYTES) {
      setError("Logo must be 2 MB or smaller");
      return;
    }

    setFileName(file.name);
    replacePreview(URL.createObjectURL(file));
    setExtracting(true);
    try {
      const palette = await extractPaletteFromImageFile(file);
      onColorsChange(palette);
      setPaletteApplied(true);
    } catch {
      setPaletteApplied(false);
      setError("Could not read colors from this logo. You can still set them below.");
    } finally {
      setExtracting(false);
    }
  };

  const clearFile = () => {
    if (inputRef.current) inputRef.current.value = "";
    setFileName("");
    replacePreview(currentLogoUrl ?? null);
    setError(null);
    setPaletteApplied(false);
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="logoPaletteApplied" value={paletteApplied ? "1" : "0"} />
      <input type="hidden" name="backgroundColor" value={colors.background} />
      <input type="hidden" name="foregroundColor" value={colors.foreground} />

      <div>
        <Label htmlFor={`${idPrefix}-logo`}>Logo</Label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="relative flex h-16 w-[160px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white"
            style={{ backgroundColor: colors.background }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Partner logo preview" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label
              htmlFor={`${idPrefix}-logo`}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm",
                extracting && "opacity-70"
              )}
            >
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {extracting
                  ? "Reading colors…"
                  : fileName || (currentLogoUrl ? "Replace logo · PNG, JPG, SVG · max 2 MB" : "Upload logo · PNG, JPG, SVG · max 2 MB")}
              </span>
              <input
                ref={inputRef}
                id={`${idPrefix}-logo`}
                name="logo"
                type="file"
                accept={PARTNER_LOGO_ACCEPT}
                className="sr-only"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </label>
            {fileName ? (
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={clearFile}>
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <p className="text-xs text-muted-foreground">
              Theme colors are picked from the logo automatically. Adjust them if needed.
            </p>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ backgroundColor: colors.background, color: colors.foreground }}
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2" style={{ borderBottom: `1px solid ${colors.primary}33` }}>
          <span className="text-xs font-medium">Theme preview</span>
          <span className="rounded-md px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: colors.primary }}>
            Primary
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ColorField
          id={`${idPrefix}-primary`}
          name="primaryColor"
          label="Primary"
          value={colors.primary}
          onChange={(primary) => onColorsChange({ ...colors, primary })}
        />
        <ColorField
          id={`${idPrefix}-secondary`}
          name="secondaryColor"
          label="Secondary"
          value={colors.secondary}
          onChange={(secondary) => onColorsChange({ ...colors, secondary })}
        />
        <ColorField
          id={`${idPrefix}-accent`}
          name="accentColor"
          label="Accent"
          value={colors.accent}
          onChange={(accent) => onColorsChange({ ...colors, accent })}
        />
      </div>
    </div>
  );
}
