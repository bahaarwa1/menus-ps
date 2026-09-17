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

        // 2. Soft luminous wash (reduced white veil so photo is 62% clear and fully visible in all gaps)
        ctx.fillStyle = reduceGaps ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.68)';
        ctx.fillRect(0, 0, size, size);

        // 3. Draw high-contrast QR code modules with expanded dots to minimize empty gaps
        const qr = QRCode.create(text, { errorCorrectionLevel: reduceGaps ? 'Q' : 'M' });
        const modCount = qr.modules.size;
        const margin = 1;
        const totalModules = modCount + margin * 2;
        const moduleSize = size / totalModules;
        const expand = reduceGaps ? moduleSize * 0.12 : 0;

        ctx.fillStyle = color || '#0f172a';
        for (let r = 0; r < modCount; r++) {
          for (let c = 0; c < modCount; c++) {
            if (qr.modules.get(r, c)) {
              ctx.fillRect(
                Math.max(0, (c + margin) * moduleSize - expand / 2),
                Math.max(0, (r + margin) * moduleSize - expand / 2),
                moduleSize + expand,
                moduleSize + expand
              );
            }
          }
        }

        // 4. Center photo emblem when reduceGaps is enabled for 100% crystal-clear restaurant brand recognition
        if (reduceGaps) {
          const badgeSize = Math.round(size * 0.22);
          const bX = Math.round((size - badgeSize) / 2);
          const bY = Math.round((size - badgeSize) / 2);
          const bRadius = Math.round(badgeSize * 0.26);

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
          ctx.shadowBlur = Math.round(size * 0.02);
          ctx.shadowOffsetY = Math.round(size * 0.006);

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
          ctx.lineWidth = Math.max(2, Math.round(size * 0.006));
          ctx.strokeStyle = '#f59e0b'; // Elegant warm golden ring
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
