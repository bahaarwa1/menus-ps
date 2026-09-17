import QRCode from 'qrcode';

export interface BrandedQROptions {
  text: string;
  size?: number;
  color?: string; // QR module color (hex)
  bgColor?: string;
  logoUrl?: string; // Image or logo URL
  restaurantName?: string;
  tableNumber?: number | string;
  style?: 'photo_watermark' | 'image_fill' | 'center_badge' | 'solid';
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
 * 2. 'image_fill': Vivid, un-muddied restaurant photo pattern filling the QR modules
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
}: BrandedQROptions): Promise<string> {
  if (typeof window === 'undefined') {
    return QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: color, light: bgColor },
      errorCorrectionLevel: 'M',
    });
  }

  const effectiveStyle = !logoUrl && style !== 'solid' ? 'solid' : style;

  let logoImg: HTMLImageElement | null = null;
  if (logoUrl && effectiveStyle !== 'solid') {
    try {
      logoImg = await loadImage(logoUrl);
    } catch {
      logoImg = null;
    }
  }

  // =========================================================================
  // MODE 1: PHOTO WATERMARK BACKGROUND (صورة المطعم واضحة بالكامل كخلفية)
  // The complete restaurant photo is displayed in crystal clarity behind the QR code
  // =========================================================================
  if (effectiveStyle === 'photo_watermark' && logoImg && logoImg.width > 0 && logoImg.height > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 1. Draw full photo covering the canvas
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

        // 2. Apply a clean frosted white veil (keeps the photo 100% visible and clear, while ensuring high contrast for scanners)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.74)';
        ctx.fillRect(0, 0, size, size);

        // 3. Draw high-contrast QR code modules on top
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = size;
        qrCanvas.height = size;
        await QRCode.toCanvas(qrCanvas, text, {
          width: size,
          margin: 1,
          color: {
            dark: color || '#0f172a',
            light: '#00000000', // transparent
          },
          errorCorrectionLevel: 'M',
        });

        ctx.drawImage(qrCanvas, 0, 0);
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

          // Faint 20% photo watermark underneath so the image shapes connect seamlessly to the eye!
          fCtx.globalAlpha = 0.18;
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
