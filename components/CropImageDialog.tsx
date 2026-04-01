"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import getCroppedImg from "../lib/cropImage";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

interface CropImageDialogProps {
  image: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedImage: Blob) => void;
}

export function CropImageDialog({
  image,
  open,
  onOpenChange,
  onCropComplete,
}: CropImageDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!image || !croppedAreaPixels) return;
    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
        onOpenChange(false);
      }
    } catch (e) {
      console.error("Error cropping image:", e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-[420px] p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] gap-0">
        <DialogHeader className="text-left">
          <DialogTitle className="font-lexend text-xl font-bold text-slate-800 md:text-2xl">
            Crop Profile Photo
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Drag to position and use the slider to zoom
          </p>
        </DialogHeader>

        <div className="relative mt-6 h-64 sm:h-72 w-full overflow-hidden rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200">
          {image ? (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={onZoomChange}
              classes={{
                containerClassName: "rounded-2xl",
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between px-1">
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
               <ZoomOut className="h-3.5 w-3.5" />
               Zoom
             </span>
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
               {Math.round(zoom * 100)}%
             </span>
          </div>
          <div className="flex items-center gap-4">
             <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
              <ZoomIn className="h-4 w-4 text-slate-400 shrink-0" />
          </div>
        </div>

        <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer w-full sm:flex-1 h-11 rounded-xl border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            disabled={isCropping}
            className="cursor-pointer w-full sm:flex-1 h-11 rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-70"
          >
            {isCropping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
