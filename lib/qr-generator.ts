import QRCode from 'qrcode';

export interface BrandedQROptions {
  text: string;
  size?: number;
  color?: string; // QR module color (hex)
  bgColor?: string;
  logoUrl?: string; // Image or logo URL
  restaurantName?: string;
  tableNumber?: number | string;
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
 * Loads an image from a URL or DataURL safely, handling CORS.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If CORS fails with anonymous, try without crossOrigin
      const retryImg = new Image();
      retryImg.onload = () => resolve(retryImg);
      retryImg.onerror = () => resolve(null);
      retryImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Generates an ultra-crisp, branded QR code with:
 * 1. Custom brand colors
 * 2. High error correction level (H = 30%)
 * 3. Centered restaurant logo or stylish crest badge
 * 4. High resolution suitable for 300DPI print & mobile camera scanning
 */
export async function generateBrandedQRCode({
  text,
  size = 600,
  color = '#0f172a',
  bgColor = '#ffffff',
  logoUrl,
  restaurantName,
  tableNumber,
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

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  // 1. Generate high-error-correction QR code to canvas
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    color: {
      dark: color,
      light: bgColor,
    },
    errorCorrectionLevel: 'H', // 30% error correction allows seamless center logo
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL('image/png');
  }

  // If no logo requested and no restaurant name, return raw styled QR
  if (!logoUrl && !restaurantName) {
    return canvas.toDataURL('image/png');
  }

  // 2. Draw Center Logo / Emblem Badge
  // Logo size is approximately 22% of QR width to stay safely within 30% error correction
  const centerSize = Math.round(size * 0.23);
  const centerX = Math.round((size - centerSize) / 2);
  const centerY = Math.round((size - centerSize) / 2);
  const radius = Math.round(centerSize * 0.28); // smooth squircle / rounded rect

  ctx.save();

  // Outer shadow for premium floating badge look
  ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
  ctx.shadowBlur = Math.round(size * 0.02);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(size * 0.008);

  // Background rounded rectangle
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerX, centerY, centerSize, centerSize, radius);
  } else {
    // Fallback for older browsers
    ctx.rect(centerX, centerY, centerSize, centerSize);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Reset shadow
  ctx.restore();
  ctx.save();

  // Subtle border around the center badge matching QR color
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerX, centerY, centerSize, centerSize, radius);
  } else {
    ctx.rect(centerX, centerY, centerSize, centerSize);
  }
  ctx.lineWidth = Math.max(3, Math.round(size * 0.007));
  ctx.strokeStyle = color;
  ctx.stroke();

  // Try loading logo image
  let logoImg: HTMLImageElement | null = null;
  if (logoUrl) {
    try {
      logoImg = await loadImage(logoUrl);
    } catch {
      logoImg = null;
    }
  }

  const innerPadding = Math.round(centerSize * 0.12);
  const innerX = centerX + innerPadding;
  const innerY = centerY + innerPadding;
  const innerSize = centerSize - innerPadding * 2;
  const innerRadius = Math.max(4, radius - innerPadding);

  if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
    // Clip inner area with rounded rect
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(innerX, innerY, innerSize, innerSize, innerRadius);
    } else {
      ctx.rect(innerX, innerY, innerSize, innerSize);
    }
    ctx.clip();

    // Maintain aspect ratio
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
    // Fallback: Elegant brand monogram / restaurant crest
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw luxury initial or restaurant name snippet
    const initial = (restaurantName || 'M').trim().charAt(0);
    ctx.font = `900 ${Math.round(innerSize * 0.55)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(initial, centerX + centerSize / 2, centerY + centerSize / 2);
  }

  ctx.restore();

  return canvas.toDataURL('image/png');
}
