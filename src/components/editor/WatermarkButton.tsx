import { useRef, useState } from "react";
import { ImagePlus, RotateCcw, X } from "lucide-react";
import { ToolbarBtn } from "@/components/editor/ToolbarBtn";
import type { WatermarkSettings } from "@/lib/editor-watermark";
import { DEFAULT_WATERMARK_SETTINGS } from "@/lib/editor-watermark";

type WatermarkButtonProps = {
  watermark: WatermarkSettings;
  setWatermark: (watermark: WatermarkSettings) => void;
  disabled?: boolean;
};

export function WatermarkButton({
  watermark,
  setWatermark,
  disabled = false,
}: WatermarkButtonProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectImage = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;

      setWatermark({
        ...watermark,
        enabled: true,
        imageSrc: event.target.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      <ToolbarBtn
        onClick={() => !disabled && setOpen((value) => !value)}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Watermark Dokumen"}
      >
        <ImagePlus className="h-3.5 w-3.5" />
      </ToolbarBtn>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-800">
                Watermark Dokumen
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Watermark dirender di PDF sebagai layer belakang dokumen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              <ImagePlus className="h-4 w-4" />
              Pilih Logo/Gambar
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleSelectImage(event.target.files?.[0])}
            />

            {watermark.imageSrc && (
              <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-md border bg-white p-2">
                <div className="absolute inset-0 bg-[linear-gradient(#f3f4f6_1px,transparent_1px),linear-gradient(90deg,#f3f4f6_1px,transparent_1px)] bg-[size:18px_18px]" />
                <img
                  src={watermark.imageSrc}
                  alt="Watermark"
                  className="relative max-h-full object-contain"
                  style={{
                    width: `${watermark.size}%`,
                    opacity: watermark.opacity,
                    transform: `rotate(${watermark.rotation}deg)`,
                  }}
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={watermark.enabled}
                onChange={(event) =>
                  setWatermark({ ...watermark, enabled: event.target.checked })
                }
                disabled={!watermark.imageSrc}
              />
              Aktifkan watermark
            </label>

            <label className="space-y-1 text-xs text-gray-700">
              <span>Transparansi: {Math.round(watermark.opacity * 100)}%</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={watermark.opacity}
                onChange={(event) =>
                  setWatermark({
                    ...watermark,
                    opacity: Number(event.target.value),
                  })
                }
                className="w-full accent-emerald-600"
              />
            </label>

            <label className="space-y-1 text-xs text-gray-700">
              <span>Ukuran: {watermark.size}% lebar halaman</span>
              <input
                type="range"
                min={20}
                max={90}
                step={1}
                value={watermark.size}
                onChange={(event) =>
                  setWatermark({
                    ...watermark,
                    size: Number(event.target.value),
                  })
                }
                className="w-full accent-emerald-600"
              />
            </label>

            <label className="space-y-1 text-xs text-gray-700">
              <span>Rotasi: {watermark.rotation} derajat</span>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={watermark.rotation}
                onChange={(event) =>
                  setWatermark({
                    ...watermark,
                    rotation: Number(event.target.value),
                  })
                }
                className="w-full accent-emerald-600"
              />
            </label>

            <button
              type="button"
              onClick={() => setWatermark(DEFAULT_WATERMARK_SETTINGS)}
              className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Watermark
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
