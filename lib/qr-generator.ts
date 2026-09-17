import QRCode from 'qrcode';

export interface BrandedQROptions {
  text: string;
  size?: number;
  color?: string; // QR module color (hex)
  bgColor?: string;
  logoUrl?: string; // Image or logo URL
  restaurantName?: string;
  tableNumber?: number | string;
  style?: 'image_fill' | 'center_badge' | 'solid';
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
 * Loads an image from a URL or DataURL safely, handling CORS and blob conversion.
 */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  if (typeof window === 'undefined') return null;

  // 1. If it's already a data URL or blob URL, load directly
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // 2. Try fetching as blob to prevent canvas cross-origin tainting
  try {
    const res = await fetch(src, { mode: 'cors' });
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
    img.src = src;
  });
}

/**
 * Generates an ultra-crisp, branded QR code with:
 * 1. Full Image Fill mode ('image_fill'): restaurant image/logo replaces the black modules across the FULL QR
 * 2. High error correction level (H = 30%) ensuring 100% reliable camera scanning
 * 3. High resolution suitable for 300DPI print & mobile camera scanning
 */
export async function generateBrandedQRCode({
  text,
  size = 600,
  color = '#0f172a',
  bgColor = '#ffffff',
  logoUrl,
  restaurantName,
  tableNumber,
  style = 'image_fill',
}: BrandedQROptions): Promise<string> {
  if (typeof window === 'undefined') {
    // Fallback in SSR
    return QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: color, light: bgColor },
      errorCorrectionLevel: 'H',
    });
  }

  // Determine active mode: if logoUrl is provided and style is not 'solid', use image_fill or center_badge
  const effectiveStyle = !logoUrl && style !== 'solid' ? 'solid' : style;

  // Try loading image if needed
  let logoImg: HTMLImageElement | null = null;
  if (logoUrl && effectiveStyle !== 'solid') {
    try {
      logoImg = await loadImage(logoUrl);
    } catch {
      logoImg = null;
    }
  }

  // =========================================================================
  // MODE 1: FULL IMAGE FILL (صورة المطعم على كامل الـ QR بدلاً من الأسود)
  // Replaces the black modules with the restaurant image/logo with high-contrast darkening
  // =========================================================================
  if (effectiveStyle === 'image_fill' && logoImg && logoImg.width > 0 && logoImg.height > 0) {
    try {
      // 1. Generate transparent QR mask where only dark modules exist
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = size;
      maskCanvas.height = size;
      await QRCode.toCanvas(maskCanvas, text, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#00000000', // transparent
        },
        errorCorrectionLevel: 'H',
      });

      // 2. Prepare patterned image canvas
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = size;
      patternCanvas.height = size;
      const pCtx = patternCanvas.getContext('2d');

      if (pCtx) {
        // Draw image covering the full canvas
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

        // Darken & enhance contrast so QR scanners easily detect modules against white background
        // First, multiply with deep brand color:
        pCtx.globalCompositeOperation = 'multiply';
        pCtx.fillStyle = color || '#0f172a';
        pCtx.fillRect(0, 0, size, size);

        // Second, add dark contrast layer to ensure safe luminance for all phone cameras
        pCtx.globalCompositeOperation = 'source-over';
        pCtx.fillStyle = 'rgba(15, 23, 42, 0.40)';
        pCtx.fillRect(0, 0, size, size);

        // Third, mask with the QR modules so image ONLY appears where modules are
        pCtx.globalCompositeOperation = 'destination-in';
        pCtx.drawImage(maskCanvas, 0, 0);

        // 3. Final composite on white background
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = size;
        finalCanvas.height = size;
        const fCtx = finalCanvas.getContext('2d');
        if (fCtx) {
          fCtx.fillStyle = bgColor || '#ffffff';
          fCtx.fillRect(0, 0, size, size);
          fCtx.drawImage(patternCanvas, 0, 0);
          return finalCanvas.toDataURL('image/png');
        }
      }
    } catch (err) {
      console.warn('Image fill QR generation failed, falling back to standard branded QR:', err);
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

  // Center Badge Mode:
  const centerSize = Math.round(size * 0.23);
  const centerX = Math.round((size - centerSize) / 2);
  const centerY = Math.round((size - centerSize) / 2);
  const radius = Math.round(centerSize * 0.28);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
  ctx.shadowBlur = Math.round(size * 0.02);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(size * 0.008);

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
  ctx.lineWidth = Math.max(3, Math.round(size * 0.007));
  ctx.strokeStyle = color;
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
