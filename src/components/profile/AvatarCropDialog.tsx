import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AvatarCropDialogProps {
  open: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropComplete: (blob: Blob) => Promise<void>;
  language?: string;
}

const CANVAS_SIZE = 320;
const CROP_RADIUS = 130; // visible crop circle radius

export function AvatarCropDialog({ open, imageFile, onClose, onCropComplete, language = 'ru' }: AvatarCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const t = (ru: string, en: string) => language === 'ru' ? ru : en;

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        // Fit image into canvas initially
        const fitScale = Math.max(
          (CROP_RADIUS * 2) / image.width,
          (CROP_RADIUS * 2) / image.height
        );
        setScale(fitScale);
        setOffset({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
      };
      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image centered at offset
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, offset.x - w / 2, offset.y - h / 2, w, h);

    // Overlay dimming outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Cut circle hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [img, scale, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale(s => Math.min(5, Math.max(0.2, s + delta)));
  };

  const handleReset = () => {
    if (!img) return;
    const fitScale = Math.max(
      (CROP_RADIUS * 2) / img.width,
      (CROP_RADIUS * 2) / img.height
    );
    setScale(fitScale);
    setOffset({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
  };

  const handleApply = async () => {
    if (!img) return;
    setSaving(true);
    try {
      // Render cropped circle into a new 260x260 canvas
      const out = document.createElement('canvas');
      out.width = 260;
      out.height = 260;
      const ctx = out.getContext('2d');
      if (!ctx) return;

      // Scale factor from display canvas to output canvas
      const ratio = 260 / (CROP_RADIUS * 2);

      ctx.save();
      ctx.beginPath();
      ctx.arc(130, 130, 130, 0, Math.PI * 2);
      ctx.clip();

      const imgW = img.width * scale;
      const imgH = img.height * scale;
      // offset is center of image on display canvas (CANVAS_SIZE/2 = center of circle)
      const imgX = offset.x - CANVAS_SIZE / 2; // relative to circle center
      const imgY = offset.y - CANVAS_SIZE / 2;

      ctx.drawImage(
        img,
        (130 + imgX * ratio) - (imgW * ratio) / 2,
        (130 + imgY * ratio) - (imgH * ratio) / 2,
        imgW * ratio,
        imgH * ratio
      );
      ctx.restore();

      await new Promise<void>((resolve, reject) => {
        out.toBlob(async (blob) => {
          if (!blob) { reject(new Error('Failed to create blob')); return; }
          try {
            await onCropComplete(blob);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, 'image/jpeg', 0.88);
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('Кадрирование аватара', 'Crop Avatar')}</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground text-center">
          {t('Перетащите фото, прокрутите для масштабирования', 'Drag the photo, scroll to zoom')}
        </p>

        {/* Canvas */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-lg cursor-grab active:cursor-grabbing border border-border"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-1">
          <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
          <Slider
            min={20}
            max={500}
            step={1}
            value={[Math.round(scale * 100)]}
            onValueChange={([v]) => setScale(v / 100)}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t('Сбросить', 'Reset')}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('Отмена', 'Cancel')}
          </Button>
          <Button onClick={handleApply} disabled={saving || !img} className="hydra-glow-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('Применить', 'Apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
