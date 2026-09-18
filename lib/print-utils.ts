
/**
 * Isolated single-page printing utility.
 * Creates a hidden iframe, renders ONLY the specific target HTML,
 * and triggers print so that the main webpage is never printed,
 * eliminating multi-page overflow and ensuring 100% clean output.
 */

export function printThermalReceipt(order: {
  id: string;
  table: number | string;
  time: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    customization?: string;
    extras?: string[];
  }>;
  notes?: string;
  restaurantName?: string;
}) {
  if (typeof window === 'undefined') return;

  const existingFrame = document.getElementById('receipt-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'receipt-print-frame';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const itemsHtml = order.items
    .map(
      (it) => `
      <tr style="border-bottom: 1px dotted #888;">
        <td style="padding: 4px 0; text-align: right; vertical-align: top;">
          <div style="font-weight: bold; font-size: 13px;">${it.name}</div>
          ${it.customization ? `<div style="font-size: 10px; color: #333;">• ${it.customization}</div>` : ''}
          ${it.extras && it.extras.length > 0 ? `<div style="font-size: 10px; color: #555;">+ ${it.extras.join('، ')}</div>` : ''}
        </td>
        <td style="padding: 4px 0; text-align: center; font-weight: bold; font-size: 13px; vertical-align: top;">${it.quantity}×</td>
        <td style="padding: 4px 0; text-align: left; font-weight: bold; font-size: 13px; vertical-align: top;">${it.price * it.quantity} ₪</td>
      </tr>
    `
    )
    .join('');

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>بون طلب - ${order.id}</title>
    <style>
      @page { size: 80mm auto; margin: 0mm; }
      @media print { html, body { width: 78mm; margin: 0 !important; padding: 4mm 2mm !important; background: #fff !important; color: #000 !important; } }
      body { font-family: 'Courier New', monospace, Tahoma, sans-serif; width: 78mm; margin: 0 auto; padding: 6px; background: #fff; color: #000; font-size: 12px; line-height: 1.35; direction: rtl; }
      * { box-sizing: border-box; }
      .tc { text-align: center; } .tl { text-align: left; } .tr { text-align: right; }
      .d { border-top: 1px dashed #000; margin: 6px 0; }
      .dd { border-top: 2px dashed #000; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; margin: 6px 0; }
      th { border-bottom: 1.5px solid #000; padding: 4px 0; font-size: 11px; }
    </style></head><body>
    <div class="tc">
      <h2 style="margin:0;font-size:17px;font-weight:900;">${order.restaurantName || 'مطعمنا'}</h2>
      <div class="dd"></div>
      <div style="font-size:16px;font-weight:900;margin:4px 0;">بون طلب — طاولة رقم (${order.table})</div>
      <div style="font-size:11px;font-weight:bold;color:#222;">${order.id} | الوقت: ${order.time}</div>
    </div>
    <div class="d"></div>
    <table><thead><tr><th class="tr">الصنف</th><th class="tc" style="width:38px;">الكمية</th><th class="tl" style="width:48px;">السعر</th></tr></thead>
    <tbody>${itemsHtml}</tbody></table>
    ${order.notes ? `<div style="border:1px solid #000;padding:5px;margin:6px 0;font-size:11px;"><strong>⚠️ ملاحظات:</strong><br/>${order.notes}</div>` : ''}
    <div class="dd"></div>
    <div style="font-size:14px;font-weight:900;display:flex;justify-content:space-between;margin-top:4px;">
      <span>المجموع الكلي:</span><span style="font-size:16px;">${order.total} ₪</span>
    </div>
    <div class="d" style="margin-top:10px;"></div>
    <div class="tc" style="font-size:10px;margin-top:6px;color:#333;">شكراً لزيارتكم! نتمنى لكم وجبة شهية ✨</div>
    </body></html>`;

  doc.open(); doc.write(html); doc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => { iframe.remove(); }, 1500); }, 350);
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Stand Card Types & Generator
// Supports custom restaurant background images, curated luxury themes,
// correct Arabic grammar ("طاولة 1"), customizable taglines, and clean QR frames.
// ─────────────────────────────────────────────────────────────────────────────

export type StandCardTheme =
  | 'modern_luxury'
  | 'clean_minimal'
  | 'burger_grill'
  | 'cafe_warm'
  | 'oriental_heritage'
  | 'custom_bg';

export interface TableStandData {
  tableNumber: number | string;
  restaurantName?: string;
  qrDataUrl: string;
  targetUrl?: string;
  logoUrl?: string;
  branchName?: string;
  brandColor?: string;
  cardTheme?: StandCardTheme;
  cardBgImage?: string;
  tagline?: string;
}

export function buildStandCardHtml(
  stands: TableStandData[],
  defaultBrandColor: string = '#f2722b',
  globalOptions?: {
    cardTheme?: StandCardTheme;
    cardBgImage?: string;
    tagline?: string;
  }
): string {
  const cardsHtml = stands.map((stand, idx) => {
    const brandColor = stand.brandColor || defaultBrandColor || '#f2722b';
    const theme: StandCardTheme =
      stand.cardTheme || globalOptions?.cardTheme || (stand.cardBgImage || globalOptions?.cardBgImage ? 'custom_bg' : 'modern_luxury');
    const bgImage = stand.cardBgImage || globalOptions?.cardBgImage || '';
    const taglineText =
      stand.tagline ||
      globalOptions?.tagline ||
      'امسح الرمز لتصفح قائمة الطعام والطلب مباشرة إلى طاولتك';
    const titleText =
      stand.restaurantName && stand.restaurantName.trim() !== '' && stand.restaurantName !== 'المطعم'
        ? stand.restaurantName
        : 'قائمة الطعام';

    // Theme-specific inline style overrides
    let themeWrapClass = 'theme-luxury';
    if (theme === 'clean_minimal') themeWrapClass = 'theme-minimal';
    else if (theme === 'burger_grill') themeWrapClass = 'theme-burger';
    else if (theme === 'cafe_warm') themeWrapClass = 'theme-cafe';
    else if (theme === 'oriental_heritage') themeWrapClass = 'theme-oriental';
    else if (theme === 'custom_bg') themeWrapClass = 'theme-custom';

    const hasBgImage = Boolean(bgImage);

    return `
    <div class="page ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="card-wrap ${themeWrapClass} ${hasBgImage ? 'has-bg-img' : ''}" style="${hasBgImage ? `background-image: url('${bgImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : ''}">
        
        ${hasBgImage ? `<img src="${bgImage}" class="card-bg-full" alt="خلفية البطاقة" />` : ''}

        <!-- Background Overlay / Inset Frame -->
        <div class="card-frame-border"></div>

        <!-- Center Shield Container (شفاف تماماً بدون أي طبقة بيضاء تحجب صورة الخلفية) -->
        <div class="center-shield">

          <!-- Top Welcome Ribbon -->
          <div class="welcome-ribbon">
            <span class="welcome-star">✦</span>
            <span class="welcome-text">أهلاً وسهلاً بكم</span>
            <span class="welcome-star">✦</span>
          </div>

          <!-- Restaurant Brand Header -->
          <div class="brand-header">
            ${stand.logoUrl ? `
              <div class="logo-ring" style="border-color: ${brandColor};">
                <img src="${stand.logoUrl}" class="logo-img" alt="شعار المطعم" />
              </div>
            ` : `
              <div class="logo-ring default-icon" style="border-color: ${brandColor}; background: ${brandColor}15;">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="${brandColor}">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            `}

            <h1 class="restaurant-name">${titleText}</h1>
            <p class="restaurant-tagline">${taglineText}</p>
          </div>

          <!-- Table Badge: Correct Natural Arabic "طاولة [X]" -->
          <div class="table-badge" style="border-color: ${brandColor};">
            <div class="table-badge-icon" style="background: ${brandColor};">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                <rect x="5" y="8" width="14" height="2.5" rx="1"/>
                <rect x="11" y="10.5" width="2" height="7.5" rx="0.5"/>
                <rect x="8" y="17" width="8" height="2" rx="1"/>
                <rect x="2" y="5" width="2" height="13" rx="1"/>
                <rect x="2" y="11" width="4" height="2" rx="0.5"/>
                <rect x="20" y="5" width="2" height="13" rx="1"/>
                <rect x="18" y="11" width="4" height="2" rx="0.5"/>
              </svg>
            </div>
            <span class="table-badge-label">طاولة</span>
            <span class="table-badge-number">${stand.tableNumber}</span>
          </div>

          <!-- High-Contrast Clean QR Code Box -->
          <div class="qr-box" style="border-color: ${brandColor};">
            <img class="qr-code-img" src="${stand.qrDataUrl}" alt="رمز QR طاولة ${stand.tableNumber}" />
          </div>

          <!-- Scan Instruction Hint -->
          <div class="scan-prompt">
            <svg class="scan-phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="3"/>
              <line x1="12" y1="18" x2="12" y2="18.01" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <span class="scan-text">وجّه كاميرا هاتفك نحو الرمز للطلب الفوري</span>
          </div>

          <!-- 3 Easy Steps Guide -->
          <div class="steps-row">
            <div class="step-cell">
              <span class="step-num">١</span>
              <span class="step-text">تصفح المنيو</span>
            </div>
            <div class="step-sep" style="background: ${brandColor}40;"></div>
            <div class="step-cell">
              <span class="step-num">٢</span>
              <span class="step-text">اختر طلبك</span>
            </div>
            <div class="step-sep" style="background: ${brandColor}40;"></div>
            <div class="step-cell">
              <span class="step-num">٣</span>
              <span class="step-text">اطلب لطاولتك</span>
            </div>
          </div>

          <!-- Footer Courtesy -->
          <div class="card-footer">
            <span class="footer-dash" style="background: ${brandColor}60;"></span>
            <span class="footer-text">نتمنى لكم وجبة شهية وتجربة مميزة</span>
            <span class="footer-dash" style="background: ${brandColor}60;"></span>
          </div>

        </div>
      </div>
    </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>بطاقات طاولات المطعم</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A5 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
      .card-wrap {
        box-shadow: none !important;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #e2e8f0;
      direction: rtl;
    }
    .page {
      width: 148mm;
      height: 210mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    
    /* ─── Card Container Base ─── */
    .card-wrap {
      width: 136mm;
      height: 188mm;
      border-radius: 26px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px;
    }

    /* ─── THEME VARIATIONS ─── */
    /* 1. Modern Luxury (Default Cream & Gold) */
    .theme-luxury {
      background: linear-gradient(150deg, #fdfbf7 0%, #f7f2e9 50%, #eee5d3 100%);
      border: 2px solid #dfc79b;
    }
    .theme-luxury .card-frame-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid #d4af37;
      border-radius: 20px;
      pointer-events: none;
    }
    .theme-luxury .restaurant-name { color: #11221b; }
    .theme-luxury .restaurant-tagline { color: #5a6b63; }
    .theme-luxury .table-badge { background: #11221b; color: #ffffff; }

    /* 2. Clean Minimal (Pure White) */
    .theme-minimal {
      background: #ffffff;
      border: 2px solid #e2e8f0;
    }
    .theme-minimal .card-frame-border {
      position: absolute;
      inset: 8px;
      border: 1px dashed #cbd5e1;
      border-radius: 20px;
      pointer-events: none;
    }
    .theme-minimal .restaurant-name { color: #0f172a; }
    .theme-minimal .restaurant-tagline { color: #64748b; }
    .theme-minimal .table-badge { background: #0f172a; color: #ffffff; }

    /* 3. Burger & Grill (Dark Charcoal & Flame) */
    .theme-burger {
      background: linear-gradient(160deg, #18181b 0%, #09090b 100%);
      border: 2px solid #ea580c;
    }
    .theme-burger .card-frame-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid rgba(234, 88, 12, 0.4);
      border-radius: 20px;
      pointer-events: none;
    }
    .theme-burger .center-shield {
      background: rgba(24, 24, 27, 0.94);
      border: 1px solid rgba(234, 88, 12, 0.3);
    }
    .theme-burger .restaurant-name { color: #ffffff; }
    .theme-burger .restaurant-tagline { color: #fdba74; }
    .theme-burger .table-badge { background: #ea580c; color: #ffffff; }
    .theme-burger .welcome-text { color: #fed7aa; }
    .theme-burger .welcome-star { color: #ea580c; }
    .theme-burger .scan-prompt { color: #f4f4f5; }
    .theme-burger .step-num { background: #27272a; color: #f97316; }
    .theme-burger .step-text { color: #e4e4e7; }
    .theme-burger .footer-text { color: #a1a1aa; }

    /* 4. Warm Cafe & Bakery (Espresso & Latte) */
    .theme-cafe {
      background: linear-gradient(150deg, #fcf9f5 0%, #f3ece4 60%, #e8ddcf 100%);
      border: 2px solid #bda28b;
    }
    .theme-cafe .card-frame-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid #a68b75;
      border-radius: 20px;
      pointer-events: none;
    }
    .theme-cafe .restaurant-name { color: #2e1e14; }
    .theme-cafe .restaurant-tagline { color: #6f5647; }
    .theme-cafe .table-badge { background: #3e2723; color: #ffffff; }

    /* 5. Oriental Heritage (Olive & Damascene) */
    .theme-oriental {
      background: linear-gradient(150deg, #f8f6f0 0%, #efebe0 60%, #e3dcce 100%);
      border: 2px solid #1c3d2e;
    }
    .theme-oriental .card-frame-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid #1c3d2e;
      border-radius: 20px;
      pointer-events: none;
    }
    .theme-oriental .restaurant-name { color: #132e22; }
    .theme-oriental .restaurant-tagline { color: #4e6559; }
    .theme-oriental .table-badge { background: #132e22; color: #ffffff; }

    /* 6. Custom Background Uploaded */
    .theme-custom {
      background-color: #0f172a;
    }
    .theme-custom .card-frame-border {
      display: none;
    }

    /* ─── Center Shield Container ─── */
    .center-shield {
      width: 100%;
      height: 100%;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 18px 16px;
      position: relative;
      z-index: 10;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    .glass-shield {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* ─── Real HTML Background Image ─── */
    .card-bg-full {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
      border-radius: 26px;
      pointer-events: none;
    }

    /* ─── Text & Border Styling When Background Photo is Present ─── */
    .has-bg-img .card-frame-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid rgba(212, 175, 55, 0.85);
      border-radius: 20px;
      z-index: 5;
      pointer-events: none;
    }
    .has-bg-img .restaurant-name {
      color: #0f172a !important;
      text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95), 0 0 10px rgba(255, 255, 255, 0.9) !important;
    }
    .has-bg-img .restaurant-tagline {
      color: #1e293b !important;
      font-weight: 800 !important;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95) !important;
    }
    .has-bg-img .welcome-text {
      color: #0f172a !important;
      font-weight: 800 !important;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95) !important;
    }
    .has-bg-img .scan-prompt {
      color: #0f172a !important;
      font-weight: 800 !important;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95) !important;
    }
    .has-bg-img .step-text {
      color: #0f172a !important;
      font-weight: 800 !important;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95) !important;
    }
    .has-bg-img .footer-text {
      color: #1e293b !important;
      font-weight: 800 !important;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95) !important;
    }

    /* ─── Top Welcome Ribbon ─── */
    .welcome-ribbon {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .welcome-star {
      color: #d4af37;
      font-size: 14px;
    }
    .welcome-text {
      color: #1e293b;
    }

    /* ─── Brand Header ─── */
    .brand-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-top: 2px;
      margin-bottom: 2px;
    }
    .logo-ring {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      border: 3px solid #f2722b;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      background: #ffffff;
    }
    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .restaurant-name {
      font-size: 27px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }
    .restaurant-tagline {
      font-size: 11.5px;
      font-weight: 700;
      margin-top: 3px;
      max-width: 105mm;
      line-height: 1.3;
    }

    /* ─── Table Badge: طاولة [X] ─── */
    .table-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 16px;
      border-radius: 999px;
      border: 1.5px solid transparent;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
      margin: 4px 0;
    }
    .table-badge-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .table-badge-label {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .table-badge-number {
      font-size: 21px;
      font-weight: 900;
      line-height: 1;
      color: #facc15;
    }

    /* ─── QR Container ─── */
    .qr-box {
      background: #ffffff;
      border: 3.5px solid #f2722b;
      border-radius: 22px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      margin: 4px 0;
    }
    .qr-code-img {
      width: 146px;
      height: 146px;
      display: block;
      border-radius: 8px;
    }

    /* ─── Scan Prompt ─── */
    .scan-prompt {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 2px;
    }
    .scan-phone-icon {
      width: 16px;
      height: 16px;
      color: #10b981;
    }
    .scan-text {
      line-height: 1;
    }

    /* ─── 3 Steps Row ─── */
    .steps-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      margin: 4px 0;
    }
    .step-cell {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .step-num {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 11px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-text {
      font-size: 10.5px;
      font-weight: 800;
      color: #334155;
      white-space: nowrap;
    }
    .step-sep {
      width: 1px;
      height: 14px;
      background: #cbd5e1;
    }

    /* ─── Footer Courtesy ─── */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }
    .footer-dash {
      width: 32px;
      height: 1.5px;
      background: #cbd5e1;
      border-radius: 99px;
    }
    .footer-text {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>`;
}

export function printTableStand(stand: TableStandData) {
  if (typeof window === 'undefined') return;

  const existingFrame = document.getElementById('stand-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'stand-print-frame';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const html = buildStandCardHtml([stand], stand.brandColor || '#f2722b', {
    cardTheme: stand.cardTheme,
    cardBgImage: stand.cardBgImage,
    tagline: stand.tagline,
  });

  doc.open(); doc.write(html); doc.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => { iframe.remove(); }, 2000);
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = () => setTimeout(doPrint, 150);
  }
  setTimeout(doPrint, 500);
}

export function printAllTableStands(
  stands: TableStandData[],
  options?: {
    cardTheme?: StandCardTheme;
    cardBgImage?: string;
    tagline?: string;
    brandColor?: string;
  }
) {
  if (typeof window === 'undefined' || stands.length === 0) return;

  const existingFrame = document.getElementById('stands-all-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'stands-all-print-frame';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const brand = options?.brandColor || stands[0]?.brandColor || '#f2722b';
  const html = buildStandCardHtml(stands, brand, options);

  doc.open(); doc.write(html); doc.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => { iframe.remove(); }, 2000);
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = () => setTimeout(doPrint, 150);
  }
  setTimeout(doPrint, 500);
}
