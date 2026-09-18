import QRCode from 'qrcode';

export interface BrandedQROptions {
  text: string;
  size?: number;
  color?: string; // QR module color (hex)
  bgColor?: string;
  logoUrl?: string; // Image or logo URL
  restaurantName?: string;
  tableNumber?: number | string;
  style?: 'artistic' | 'photo_watermark' | 'image_fill' | 'center_badge' | 'solid';
  reduceGaps?: boolean; // When true, shrinks white gaps and fills them with photo for maximum clarity
}

export const QR_COLOR_PRESETS = [
  { id: 'black', name: 'أسود كلاسيكي فاخر', hex: '#0f172a' },
  { id: 'orange', name: 'برتقالي الهوية', hex: '#ea580c' },
  { id: 'emerald', name: 'أخضر زمردي ملكي', hex: '#047857' },
  { id: 'navy', name: 'كحلي رويال فاخر', hex: '#1e3a8a' },
  { id: 'ruby', name: 'عنابي ياقوتي أنيق', hex: '#991b1b' },
  { id: 'gold', name: 'ذهبي برونزي راقي', hex: '#b45309' },
  { id: 'purple', name: 'بنفسجي عصري', hex: '#7c3aed' },
];

/**
 * Loads an image safely, upgrading resolution and handling CORS.
 */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  if (typeof window === 'undefined') return null;

  // Upgrade image URL to ultra high-definition if it has small width params (e.g. Unsplash w=200)
  const highResSrc = src.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=95');

  // 1. If it's already a data URL or blob URL, load directly
  if (highResSrc.startsWith('data:') || highResSrc.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = highResSrc;
    });
  }

  // 2. Try fetching as blob to prevent canvas cross-origin tainting
  try {
    const res = await fetch(highResSrc, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = objUrl;
      });
    }
  } catch {}

  // 3. Fallback to Image element with crossOrigin
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = highResSrc;
  });
}

/**
 * Generates an ultra-crisp, branded QR code with:
 * 1. 'photo_watermark': Full HD restaurant photo in background with frosted overlay for maximum clarity & instant scanning
 * 2. 'image_fill': Vivid, un-muddied restaurant photo pattern filling the QR modules with reduced gaps
 * 3. 'center_badge': Large, prominent center photo emblem (28% size)
 * 4. 'solid': Classic brand color QR code
 */
export async function generateBrandedQRCode({
  text,
  size = 600,
  color = '#0f172a',
  bgColor = '#ffffff',
  logoUrl,
  restaurantName,
  tableNumber,
  style = 'photo_watermark',
  reduceGaps = true,
}: BrandedQROptions): Promise<string> {
  if (typeof window === 'undefined') {
    return QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: color, light: bgColor },
      errorCorrectionLevel: 'M',
    });
  }

  // For artistic mode: works with or without a photo. Other image modes fall back to solid if no logo.
  const effectiveStyle = (!logoUrl && style !== 'solid' && style !== 'artistic') ? 'solid' : style;

  let logoImg: HTMLImageElement | null = null;
  if (logoUrl && effectiveStyle !== 'solid') {
    try {
      logoImg = await loadImage(logoUrl);
    } catch {
      logoImg = null;
    }
  }

  // =========================================================================
  // MODE 0: ARTISTIC QR — صورة اللوجو واضحة بالكامل + نقاط دائرية فوقها (KFC Style)
  // The brand logo/photo fills the entire QR clearly, dots drawn with multiply blend
  // =========================================================================
  if (effectiveStyle === 'artistic') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');

      const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
      const modCount = qr.modules.size;
      const margin = 2;
      const totalMods = modCount + margin * 2;
      const cellSize = size / totalMods;
      const dotRadius = cellSize * 0.44;

      // ── 1. White background ──
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // helper: cover-fit the image
      const coverDraw = (targetCtx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
        const aspect = img.width / img.height;
        let dw = w, dh = h, dx = x, dy = y;
        if (aspect > w / h) { dh = h; dw = h * aspect; dx = x - (dw - w) / 2; }
        else                 { dw = w; dh = w / aspect; dy = y - (dh - h) / 2; }
        targetCtx.drawImage(img, dx, dy, dw, dh);
      };

      // ── 2. Draw brand image at 100% FULL opacity so it's completely clear ──
      if (logoImg && logoImg.width > 0) {
        ctx.save();
        ctx.globalAlpha = 1.0; // 100% full opacity - no transparency
        coverDraw(ctx, logoImg, 0, 0, size, size);
        ctx.restore();
      }

      // Finder pattern positions (top-left, top-right, bottom-left)
      const finderStarts: [number, number][] = [
        [0, 0],
        [modCount - 7, 0],
        [0, modCount - 7],
      ];
      const isInFinder = (r: number, c: number) =>
        finderStarts.some(([fc, fr]) =>
          c >= fc && c < fc + 7 && r >= fr && r < fr + 7
        );

      // ── 3. Draw data dots with MULTIPLY blend so image shows through them ──
      // First pass on an offscreen canvas so we can composite onto main
      const dotCanvas = document.createElement('canvas');
      dotCanvas.width = size;
      dotCanvas.height = size;
      const dCtx = dotCanvas.getContext('2d')!;
      dCtx.fillStyle = color || '#0f172a';
      for (let r = 0; r < modCount; r++) {
        for (let c = 0; c < modCount; c++) {
          if (!qr.modules.get(r, c)) continue;
          if (isInFinder(r, c)) continue;
          const cx = (c + margin + 0.5) * cellSize;
          const cy = (r + margin + 0.5) * cellSize;
          dCtx.beginPath();
          dCtx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
          dCtx.fill();
        }
      }
      // Composite dots onto main with multiply — image color shows through
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(dotCanvas, 0, 0);
      ctx.restore();

      // ── 4. Draw circular finder eyes (solid, on top) ──
      const drawFinderEye = (startCol: number, startRow: number) => {
        const cx = (startCol + margin + 3.5) * cellSize;
        const cy = (startRow + margin + 3.5) * cellSize;
        const outerR = cellSize * 3.5;
        const midR   = cellSize * 2.6;
        const innerR = cellSize * 1.55;

        // Clear the finder area first so it pops clean
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // White fill first to isolate eye from image
        ctx.beginPath();
        ctx.arc(cx, cy, outerR + cellSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();

        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fillStyle = color || '#0f172a';
        ctx.fill();

        // White gap
        ctx.beginPath();
        ctx.arc(cx, cy, midR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = color || '#0f172a';
        ctx.fill();

        ctx.restore();
      };

      finderStarts.forEach(([fc, fr]) => drawFinderEye(fc, fr));

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('Artistic QR failed, falling back:', err);
    }
  }


  // =========================================================================
  // MODE 1: PHOTO WATERMARK BACKGROUND (صورة المطعم واضحة بالكامل كخلفية مع تقليل الفراغات)
  // The complete restaurant photo is displayed in crystal clarity behind the QR code
  // =========================================================================
  if (effectiveStyle === 'photo_watermark' && logoImg && logoImg.width > 0 && logoImg.height > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 1. Draw full photo covering the canvas at 100% full opacity (NO transparent wash or veil)
        const imgAspect = logoImg.width / logoImg.height;
        let drawW = size;
        let drawH = size;
        let drawX = 0;
        let drawY = 0;
        if (imgAspect > 1) {
          drawW = size * imgAspect;
          drawX = -(drawW - size) / 2;
        } else {
          drawH = size / imgAspect;
          drawY = -(drawH - size) / 2;
        }
        ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);

        // 2. High-contrast QR code modules drawn directly on top with crisp contrast (NO white veil over the photo!)
        const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
        const modCount = qr.modules.size;
        const margin = 1;
        const totalModules = modCount + margin * 2;
        const moduleSize = size / totalModules;
        const expand = reduceGaps ? moduleSize * 0.12 : 0;

        // Draw crisp solid white backings for the 3 finder eyes for instantaneous camera locking
        const finderStarts = [
          [0, 0],
          [modCount - 7, 0],
          [0, modCount - 7],
        ];
        ctx.fillStyle = '#ffffff';
        finderStarts.forEach(([c, r]) => {
          const fx = (c + margin) * moduleSize - 2;
          const fy = (r + margin) * moduleSize - 2;
          const fSize = 7 * moduleSize + 4;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(fx, fy, fSize, fSize, 6);
          } else {
            ctx.rect(fx, fy, fSize, fSize);
          }
          ctx.fill();
        });

        // Draw data modules with crisp contrast against the photo
        for (let r = 0; r < modCount; r++) {
          for (let c = 0; c < modCount; c++) {
            if (qr.modules.get(r, c)) {
              const mx = (c + margin) * moduleSize - expand / 2;
              const my = (r + margin) * moduleSize - expand / 2;
              const mDim = moduleSize + expand;

              // Crisp white backing per module so camera decodes instantly regardless of photo colors
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(mx - 0.75, my - 0.75, mDim + 1.5, mDim + 1.5);

              // Solid brand color module
              ctx.fillStyle = color || '#0f172a';
              ctx.fillRect(mx, my, mDim, mDim);
            }
          }
        }

        // 3. Center photo emblem when reduceGaps or center photo is desired
        if (reduceGaps) {
          const badgeSize = Math.round(size * 0.24);
          const bX = Math.round((size - badgeSize) / 2);
          const bY = Math.round((size - badgeSize) / 2);
          const bRadius = Math.round(badgeSize * 0.26);

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = Math.round(size * 0.025);
          ctx.shadowOffsetY = Math.round(size * 0.008);

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bX, bY, badgeSize, badgeSize, bRadius);
          } else {
            ctx.rect(bX, bY, badgeSize, badgeSize);
          }
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bX, bY, badgeSize, badgeSize, bRadius);
          } else {
            ctx.rect(bX, bY, badgeSize, badgeSize);
          }
          ctx.lineWidth = Math.max(2, Math.round(size * 0.007));
          ctx.strokeStyle = '#f59e0b'; // Warm golden border
          ctx.stroke();

          const pad = Math.round(badgeSize * 0.08);
          const innerX = bX + pad;
          const innerY = bY + pad;
          const innerSize = badgeSize - pad * 2;
          const innerRadius = Math.max(3, bRadius - pad);

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(innerX, innerY, innerSize, innerSize, innerRadius);
          } else {
            ctx.rect(innerX, innerY, innerSize, innerSize);
          }
          ctx.clip();

          let drawBadgeW = innerSize;
          let drawBadgeH = innerSize;
          let drawBadgeX = innerX;
          let drawBadgeY = innerY;
          if (imgAspect > 1) {
            drawBadgeW = innerSize * imgAspect;
            drawBadgeX = innerX - (drawBadgeW - innerSize) / 2;
          } else {
            drawBadgeH = innerSize / imgAspect;
            drawBadgeY = innerY - (drawBadgeH - innerSize) / 2;
          }
          ctx.drawImage(logoImg, drawBadgeX, drawBadgeY, drawBadgeW, drawBadgeH);
          ctx.restore();
        }

        return canvas.toDataURL('image/png');
      }
    } catch (err) {
      console.warn('Photo watermark QR failed, falling back:', err);
    }
  }

  // =========================================================================
  // MODE 2: VIBRANT IMAGE FILL (نقش نقاط الـ QR بصورة المطعم بدون تعتيم طيني)
  // Combines light background watermark with vibrant, high-contrast photo modules
  // =========================================================================
  if (effectiveStyle === 'image_fill' && logoImg && logoImg.width > 0 && logoImg.height > 0) {
    try {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = size;
      maskCanvas.height = size;
      await QRCode.toCanvas(maskCanvas, text, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#00000000',
        },
        errorCorrectionLevel: 'M',
      });

      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = size;
      patternCanvas.height = size;
      const pCtx = patternCanvas.getContext('2d');

      if (pCtx) {
        const imgAspect = logoImg.width / logoImg.height;
        let drawW = size;
        let drawH = size;
        let drawX = 0;
        let drawY = 0;
        if (imgAspect > 1) {
          drawW = size * imgAspect;
          drawX = -(drawW - size) / 2;
        } else {
          drawH = size / imgAspect;
          drawY = -(drawH - size) / 2;
        }
        pCtx.drawImage(logoImg, drawX, drawY, drawW, drawH);

        // Vivid multiply blend using brand tone (NOT muddy black)
        pCtx.globalCompositeOperation = 'multiply';
        pCtx.fillStyle = color || '#0f172a';
        pCtx.fillRect(0, 0, size, size);

        pCtx.globalCompositeOperation = 'destination-in';
        pCtx.drawImage(maskCanvas, 0, 0);

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = size;
        finalCanvas.height = size;
        const fCtx = finalCanvas.getContext('2d');
        if (fCtx) {
          // White background
          fCtx.fillStyle = bgColor || '#ffffff';
          fCtx.fillRect(0, 0, size, size);

          // Rich photo visibility in gaps (eliminates white empty gaps and connects the image seamlessly)
          fCtx.globalAlpha = reduceGaps ? 0.45 : 0.20;
          fCtx.drawImage(logoImg, drawX, drawY, drawW, drawH);
          fCtx.globalAlpha = 1.0;

          // Draw vivid textured modules on top
          fCtx.drawImage(patternCanvas, 0, 0);
          return finalCanvas.toDataURL('image/png');
        }
      }
    } catch (err) {
      console.warn('Image fill QR generation failed, falling back:', err);
    }
  }

  // =========================================================================
  // MODE 2 & 3: Standard QR (Solid or with Center Badge)
  // =========================================================================
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    color: {
      dark: color,
      light: bgColor,
    },
    errorCorrectionLevel: 'H',
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL('image/png');
  }

  // If solid style or no logo/name, return standard QR
  if (effectiveStyle === 'solid' || (!logoUrl && !restaurantName)) {
    return canvas.toDataURL('image/png');
  }

  // Center Badge Mode (Large HD Photo/Logo Emblem):
  const centerSize = Math.round(size * 0.28);
  const centerX = Math.round((size - centerSize) / 2);
  const centerY = Math.round((size - centerSize) / 2);
  const radius = Math.round(centerSize * 0.28);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = Math.round(size * 0.025);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(size * 0.01);

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerX, centerY, centerSize, centerSize, radius);
  } else {
    ctx.rect(centerX, centerY, centerSize, centerSize);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerX, centerY, centerSize, centerSize, radius);
  } else {
    ctx.rect(centerX, centerY, centerSize, centerSize);
  }
  ctx.lineWidth = Math.max(3, Math.round(size * 0.008));
  ctx.strokeStyle = '#eab308'; // Luxury gold accent ring
  ctx.stroke();

  const innerPadding = Math.round(centerSize * 0.12);
  const innerX = centerX + innerPadding;
  const innerY = centerY + innerPadding;
  const innerSize = centerSize - innerPadding * 2;
  const innerRadius = Math.max(4, radius - innerPadding);

  if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(innerX, innerY, innerSize, innerSize, innerRadius);
    } else {
      ctx.rect(innerX, innerY, innerSize, innerSize);
    }
    ctx.clip();

    const imgAspect = logoImg.width / logoImg.height;
    let drawW = innerSize;
    let drawH = innerSize;
    let drawX = innerX;
    let drawY = innerY;

    if (imgAspect > 1) {
      drawH = innerSize / imgAspect;
      drawY = innerY + (innerSize - drawH) / 2;
    } else {
      drawW = innerSize * imgAspect;
      drawX = innerX + (innerSize - drawW) / 2;
    }

    ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
  } else {
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = (restaurantName || 'M').trim().charAt(0);
    ctx.font = `900 ${Math.round(innerSize * 0.55)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(initial, centerX + centerSize / 2, centerY + centerSize / 2);
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}
