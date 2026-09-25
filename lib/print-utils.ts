
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

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>فاتورة طلب - ${order.id}</title>
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
      <div style="font-size:16px;font-weight:900;margin:4px 0;">فاتورة طلب — طاولة رقم (${order.table})</div>
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
  | 'crystal_gold'
  | 'imperial_obsidian'
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
      stand.cardTheme || globalOptions?.cardTheme || (stand.cardBgImage || globalOptions?.cardBgImage ? 'custom_bg' : 'crystal_gold');
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
    let themeWrapClass = 'theme-crystal';
    if (theme === 'crystal_gold') themeWrapClass = 'theme-crystal';
    else if (theme === 'imperial_obsidian') themeWrapClass = 'theme-obsidian';
    else if (theme === 'modern_luxury') themeWrapClass = 'theme-luxury';
    else if (theme === 'clean_minimal') themeWrapClass = 'theme-minimal';
    else if (theme === 'burger_grill') themeWrapClass = 'theme-burger';
    else if (theme === 'cafe_warm') themeWrapClass = 'theme-cafe';
    else if (theme === 'oriental_heritage') themeWrapClass = 'theme-oriental';
    else if (theme === 'custom_bg') {
      themeWrapClass = 'theme-crystal';
    }

    const hasBgImage = Boolean(bgImage);

    return `
    <div class="page ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="card-wrap ${themeWrapClass} ${hasBgImage ? 'has-bg-img' : ''}" style="${hasBgImage ? `background-image: url('${bgImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : ''}">
        
        ${hasBgImage ? `
          <img src="${bgImage}" class="card-bg-full" alt="خلفية البطاقة" />
          <div class="card-bg-overlay"></div>
        ` : ''}

        <!-- Royal Central Stand Plaque (لوح الطاولة الملكي الموحد والمزخرف) -->
        <div class="stand-plaque">
          
          <!-- 4 Royal Corner Filigrees (زخارف الأركان الكلاسيكية الفاخرة) -->
          <svg class="corner-filigree corner-tl" viewBox="0 0 32 32" fill="none">
            <path d="M2 2h22M2 2v22M5 5h14M5 5v14M2 2l10 10M5 5l7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="15" cy="15" r="2.2" fill="currentColor"/>
          </svg>
          <svg class="corner-filigree corner-tr" viewBox="0 0 32 32" fill="none">
            <path d="M30 2H8M30 2v22M27 5H13M27 5v14M30 2L20 12M27 5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="17" cy="15" r="2.2" fill="currentColor"/>
          </svg>
          <svg class="corner-filigree corner-bl" viewBox="0 0 32 32" fill="none">
            <path d="M2 30h22M2 30V8M5 27h14M5 27V13M2 30l10-10M5 27l7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="15" cy="17" r="2.2" fill="currentColor"/>
          </svg>
          <svg class="corner-filigree corner-br" viewBox="0 0 32 32" fill="none">
            <path d="M30 30H8M30 30V8M27 27H13M27 27V13M30 30L20 20M27 27l-7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="17" cy="17" r="2.2" fill="currentColor"/>
          </svg>

          <!-- Inner Hairline Border (الإطار الداخلي المذهب) -->
          <div class="plaque-inset-frame"></div>

          <!-- Top Brand & Identity Section -->
          <div class="brand-section">
            <div class="welcome-ribbon">
              <span class="ribbon-leaf">❖</span>
              <span class="ribbon-text">أهلاً وسهلاً بكم</span>
              <span class="ribbon-leaf">❖</span>
            </div>

            <div class="brand-header">
              ${stand.logoUrl ? `
                <div class="logo-medallion">
                  <img src="${stand.logoUrl}" class="logo-img" alt="شعار المطعم" />
                </div>
              ` : `
                <div class="logo-medallion default-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#c5a059">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
              `}

              <h1 class="restaurant-name">${titleText}</h1>
              <p class="restaurant-tagline">${taglineText}</p>
            </div>

            <!-- Royal Table Seal Badge (شارة الطاولة الملكية) -->
            <div class="table-seal-badge">
              <span class="seal-icon">👑</span>
              <span class="seal-label">طاولة</span>
              <span class="seal-num">${stand.tableNumber}</span>
            </div>
          </div>

          <!-- Centerpiece QR Code Hero (منصة باركود الـ QR المزخرفة) -->
          <div class="qr-pedestal">
            <div class="qr-prompt-banner">
              <svg class="qr-camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="3"/>
                <line x1="12" y1="18" x2="12" y2="18.01" stroke-width="3" stroke-linecap="round"/>
              </svg>
              <span>وجّه الكاميرا وامسح للطلب</span>
            </div>

            <div class="qr-box-wrap">
              <!-- 4 Viewfinder Corner Brackets -->
              <span class="vf-bracket vf-tl"></span>
              <span class="vf-bracket vf-tr"></span>
              <span class="vf-bracket vf-bl"></span>
              <span class="vf-bracket vf-br"></span>
              
              <img class="qr-code-img" src="${stand.qrDataUrl}" alt="رمز QR طاولة ${stand.tableNumber}" />
            </div>
          </div>

          <!-- Bottom Steps & Hospitality Line -->
          <div class="guide-section">
            <div class="steps-flow">
              <div class="step-badge">
                <span class="step-coin">١</span>
                <span class="step-label">تصفح القائمة</span>
              </div>
              <span class="step-dot">•</span>
              <div class="step-badge">
                <span class="step-coin">٢</span>
                <span class="step-label">اختر طلبك</span>
              </div>
              <span class="step-dot">•</span>
              <div class="step-badge">
                <span class="step-coin">٣</span>
                <span class="step-label">يصلك لطاولتك</span>
              </div>
            </div>

            <div class="courtesy-line">
              <span class="flourish-dash"></span>
              <span class="courtesy-text">نتمنى لكم وجبة شهية وتجربة استثنائية</span>
              <span class="flourish-dash"></span>
            </div>
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
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
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
      font-family: 'Cairo', 'Tajawal', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      font-family: 'Cairo', 'Tajawal', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

    /* ─── Card Container Base ─── */
    .card-wrap {
      width: 138mm;
      height: 196mm;
      border-radius: 26px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 48px rgba(0,0,0,0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    /* ─── Background Photo & Vignette ─── */
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
    .card-bg-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0.02) 50%, rgba(15, 23, 42, 0.25) 100%);
      z-index: 2;
      border-radius: 26px;
      pointer-events: none;
    }

    /* ─── Unified Royal Stand Plaque (اللوح الملكي المتكامل) ─── */
    .stand-plaque {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 22px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 18px 16px 14px;
      z-index: 10;
      border: 2px solid #c5a059;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Corner Filigrees (زخارف الأركان الملكية) */
    .corner-filigree {
      position: absolute;
      width: 32px;
      height: 32px;
      z-index: 15;
      pointer-events: none;
    }
    .corner-tl { top: 6px; left: 6px; }
    .corner-tr { top: 6px; right: 6px; }
    .corner-bl { bottom: 6px; left: 6px; }
    .corner-br { bottom: 6px; right: 6px; }

    /* Inset Hairline Frame */
    .plaque-inset-frame {
      position: absolute;
      inset: 6px;
      border-radius: 17px;
      border: 1px solid rgba(197, 160, 89, 0.45);
      pointer-events: none;
      z-index: 11;
    }

    /* ─── Header: Brand, Ribbon & Table Badge ─── */
    .brand-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 12;
    }
    .welcome-ribbon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .ribbon-leaf {
      font-size: 13px;
    }
    .brand-header {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      margin: 0 auto;
    }
    .logo-medallion {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 3px solid #fbbf24;
      padding: 3px;
      margin: 0 auto 6px auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .logo-medallion img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    .logo-medallion.default-icon {
      background: #0f172a;
    }
    .restaurant-name {
      font-size: 34px;
      font-weight: 900;
      line-height: 1.2;
      margin: 3px 0 2px;
      letter-spacing: -0.3px;
    }
    .restaurant-tagline {
      font-size: 13.5px;
      font-weight: 700;
      max-width: 110mm;
      line-height: 1.4;
      margin: 0 auto 8px auto;
    }
    .table-seal-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 22px;
      border-radius: 999px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      margin-top: 2px;
    }
    .seal-icon {
      font-size: 14px;
    }
    .seal-label {
      font-size: 13.5px;
      font-weight: 900;
      letter-spacing: 0.3px;
    }
    .seal-num {
      font-size: 20px;
      font-weight: 900;
      line-height: 1;
    }

    /* ─── QR Code Centerpiece Pedestal ─── */
    .qr-pedestal {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 4px 0;
      z-index: 12;
    }
    .qr-prompt-banner {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 7px;
    }
    .qr-camera-icon {
      width: 17px;
      height: 17px;
      stroke-width: 2.3;
    }
    .qr-box-wrap {
      position: relative;
      padding: 10px;
      background: #ffffff;
      border-radius: 22px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
      border: 2.5px solid #fbbf24;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vf-bracket {
      position: absolute;
      width: 14px;
      height: 14px;
      pointer-events: none;
    }
    .vf-tl { top: 5px; left: 5px; border-top: 3px solid #fbbf24; border-left: 3px solid #fbbf24; border-top-left-radius: 6px; }
    .vf-tr { top: 5px; right: 5px; border-top: 3px solid #fbbf24; border-right: 3px solid #fbbf24; border-top-right-radius: 6px; }
    .vf-bl { bottom: 5px; left: 5px; border-bottom: 3px solid #fbbf24; border-left: 3px solid #fbbf24; border-bottom-left-radius: 6px; }
    .vf-br { bottom: 5px; right: 5px; border-bottom: 3px solid #fbbf24; border-right: 3px solid #fbbf24; border-bottom-right-radius: 6px; }
    .qr-code-img {
      width: 205px;
      height: 205px;
      display: block;
      border-radius: 10px;
    }

    /* ─── Footer: Steps Flow & Courtesy Line ─── */
    .guide-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 12;
    }
    .steps-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
    }
    .step-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 800;
    }
    .step-coin {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11.5px;
      font-weight: 900;
      line-height: 1;
    }
    .step-label {
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }
    .step-dot {
      font-size: 14px;
      opacity: 0.85;
    }
    .courtesy-divider,
    .courtesy-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      margin-top: 1px;
    }
    .flourish-dash {
      height: 1.5px;
      width: 32px;
      border-radius: 2px;
      opacity: 0.8;
    }
    .courtesy-text {
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    /* ─── THEME 1: SMOKED LUXURY GLASS & PURE WHITE FONTS (زجاج فاخر مدخن بخط أبيض ناصع) ─── */
    .theme-crystal .stand-plaque,
    .theme-custom .stand-plaque,
    .has-bg-img .stand-plaque {
      background: linear-gradient(165deg, rgba(15, 23, 42, 0.76) 0%, rgba(2, 6, 23, 0.82) 100%) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 2px solid #fbbf24 !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .theme-crystal .corner-filigree,
    .theme-custom .corner-filigree,
    .has-bg-img .corner-filigree { color: #fbbf24 !important; }

    .theme-crystal .plaque-inset-frame,
    .theme-custom .plaque-inset-frame,
    .has-bg-img .plaque-inset-frame { border-color: rgba(251, 191, 36, 0.45) !important; }

    .theme-crystal .welcome-ribbon,
    .theme-custom .welcome-ribbon,
    .has-bg-img .welcome-ribbon { color: #fde047 !important; }

    /* ALL FONTS IN PURE WHITE */
    .theme-crystal .restaurant-name,
    .theme-custom .restaurant-name,
    .has-bg-img .restaurant-name { 
      color: #ffffff !important; 
      text-shadow: 0 2px 10px rgba(0,0,0,0.7) !important;
    }

    .theme-crystal .restaurant-tagline,
    .theme-custom .restaurant-tagline,
    .has-bg-img .restaurant-tagline { 
      color: #f1f5f9 !important; 
      text-shadow: 0 1px 6px rgba(0,0,0,0.6) !important;
    }

    .theme-crystal .table-seal-badge,
    .theme-custom .table-seal-badge,
    .has-bg-img .table-seal-badge {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
      color: #ffffff !important;
      border: 1.5px solid #fde047 !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4) !important;
    }
    .theme-crystal .seal-label,
    .theme-custom .seal-label,
    .has-bg-img .seal-label { color: #ffffff !important; }
    .theme-crystal .seal-num,
    .theme-custom .seal-num,
    .has-bg-img .seal-num { color: #fef08a !important; }

    .theme-crystal .qr-prompt-banner,
    .theme-custom .qr-prompt-banner,
    .has-bg-img .qr-prompt-banner { 
      color: #ffffff !important; 
      text-shadow: 0 1px 4px rgba(0,0,0,0.6) !important;
    }
    .theme-crystal .qr-camera-icon,
    .theme-custom .qr-camera-icon,
    .has-bg-img .qr-camera-icon { color: #34d399 !important; }

    .theme-crystal .qr-box-wrap,
    .theme-custom .qr-box-wrap,
    .has-bg-img .qr-box-wrap { 
      border-color: #fbbf24 !important; 
      box-shadow: 0 10px 28px rgba(0,0,0,0.4) !important;
    }
    .theme-crystal .vf-bracket,
    .theme-custom .vf-bracket,
    .has-bg-img .vf-bracket { border-color: #fbbf24 !important; }
    .theme-crystal .step-coin,
    .theme-custom .step-coin,
    .has-bg-img .step-coin { 
      background: rgba(251, 191, 36, 0.25) !important; 
      color: #fde047 !important; 
      border: 1px solid #fbbf24 !important; 
    }
    .theme-crystal .step-label,
    .theme-custom .step-label,
    .has-bg-img .step-label { 
      color: #ffffff !important; 
      text-shadow: 0 1px 4px rgba(0,0,0,0.6) !important; 
    }
    .theme-crystal .step-dot,
    .theme-custom .step-dot,
    .has-bg-img .step-dot { color: #fbbf24 !important; }
    .theme-crystal .courtesy-text,
    .theme-custom .courtesy-text,
    .has-bg-img .courtesy-text { 
      color: #e2e8f0 !important; 
      text-shadow: 0 1px 4px rgba(0,0,0,0.6) !important; 
    }
    .theme-crystal .flourish-dash,
    .theme-custom .flourish-dash,
    .has-bg-img .flourish-dash { background: #fbbf24 !important; }

    /* ─── THEME 2: IMPERIAL OBSIDIAN & GOLD (الأسود والذهب الملكي الإمبراطوري) ─── */
    .theme-obsidian .stand-plaque {
      background: linear-gradient(165deg, rgba(15, 23, 42, 0.93) 0%, rgba(10, 14, 26, 0.96) 100%) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      border: 2px solid #d4af37 !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.48) !important;
    }
    .theme-obsidian .corner-filigree { color: #d4af37 !important; }
    .theme-obsidian .plaque-inset-frame { border-color: rgba(212, 175, 55, 0.45) !important; }
    .theme-obsidian .welcome-ribbon { color: #fef3c7 !important; }
    .theme-obsidian .restaurant-name { color: #ffffff !important; text-shadow: 0 2px 10px rgba(0,0,0,0.5) !important; }
    .theme-obsidian .restaurant-tagline { color: #fde68a !important; }
    .theme-obsidian .table-seal-badge {
      background: linear-gradient(135deg, #ea580c 0%, #d97706 100%) !important;
      color: #ffffff !important;
      border: 1.5px solid #fbbf24 !important;
    }
    .theme-obsidian .seal-num { color: #fef08a !important; }
    .theme-obsidian .qr-prompt-banner { color: #ffffff !important; }
    .theme-obsidian .qr-camera-icon { color: #34d399 !important; }
    .theme-obsidian .qr-box-wrap { border-color: #fbbf24 !important; }
    .theme-obsidian .vf-bracket { border-color: #fbbf24 !important; }
    .theme-obsidian .step-coin { background: rgba(251, 191, 36, 0.22) !important; color: #fbbf24 !important; border: 1px solid #fbbf24 !important; }
    .theme-obsidian .step-label { color: #f8fafc !important; }
    .theme-obsidian .step-dot { color: #d4af37 !important; }
    .theme-obsidian .courtesy-text { color: #cbd5e1 !important; }
    .theme-obsidian .flourish-dash { background: #d4af37 !important; }

    /* ─── THEME 3: MODERN LUXURY (الذهبي الكلاسيكي) ─── */
    .theme-luxury {
      background: linear-gradient(150deg, #fdfbf7 0%, #f7f2e9 50%, #eee5d3 100%);
    }
    .theme-luxury .stand-plaque {
      background: rgba(255, 255, 255, 0.85);
      border: 2px solid #dfc79b;
      box-shadow: 0 16px 36px rgba(0,0,0,0.1);
    }
    .theme-luxury .corner-filigree { color: #c5a059; }
    .theme-luxury .plaque-inset-frame { border-color: rgba(223, 199, 155, 0.5); }
    .theme-luxury .restaurant-name { color: #11221b; }
    .theme-luxury .restaurant-tagline { color: #5a6b63; }
    .theme-luxury .table-seal-badge { background: #11221b; color: #ffffff; border: 1.5px solid #c5a059; }
    .theme-luxury .seal-num { color: #fde047; }
    .theme-luxury .qr-box-wrap { border-color: #dfc79b; }
    .theme-luxury .vf-bracket { border-color: #c5a059; }
    .theme-luxury .step-coin { background: #fef3c7; color: #92400e; border: 1px solid #d97706; }
    .theme-luxury .step-label { color: #334155; }
    .theme-luxury .courtesy-text { color: #64748b; }
    .theme-luxury .flourish-dash { background: #dfc79b; }

    /* ─── THEME 4: BURGER & GRILL (برجر ومشاوي داكن) ─── */
    .theme-burger {
      background: linear-gradient(160deg, #18181b 0%, #09090b 100%);
    }
    .theme-burger .stand-plaque {
      background: rgba(24, 24, 27, 0.95);
      border: 2px solid #ea580c;
      box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    }
    .theme-burger .corner-filigree { color: #ea580c; }
    .theme-burger .plaque-inset-frame { border-color: rgba(234, 88, 12, 0.4); }
    .theme-burger .welcome-ribbon { color: #fed7aa; }
    .theme-burger .restaurant-name { color: #ffffff; }
    .theme-burger .restaurant-tagline { color: #fdba74; }
    .theme-burger .table-seal-badge { background: #ea580c; color: #ffffff; border: 1px solid #fbbf24; }
    .theme-burger .seal-num { color: #fef08a; }
    .theme-burger .qr-prompt-banner { color: #f4f4f5; }
    .theme-burger .qr-camera-icon { color: #f97316; }
    .theme-burger .qr-box-wrap { border-color: #ea580c; }
    .theme-burger .vf-bracket { border-color: #ea580c; }
    .theme-burger .step-coin { background: #27272a; color: #f97316; border: 1px solid #ea580c; }
    .theme-burger .step-label { color: #e4e4e7; }
    .theme-burger .courtesy-text { color: #a1a1aa; }
    .theme-burger .flourish-dash { background: #ea580c; }

    /* ─── THEME 5: WARM CAFE & BAKERY (كافيه دافئ ومخبوزات) ─── */
    .theme-cafe {
      background: linear-gradient(150deg, #fcf9f5 0%, #f3ece4 60%, #e8ddcf 100%);
    }
    .theme-cafe .stand-plaque {
      background: rgba(255, 255, 255, 0.88);
      border: 2px solid #bda28b;
      box-shadow: 0 16px 36px rgba(0,0,0,0.1);
    }
    .theme-cafe .corner-filigree { color: #a68b75; }
    .theme-cafe .plaque-inset-frame { border-color: rgba(189, 162, 139, 0.4); }
    .theme-cafe .welcome-ribbon { color: #6f5647; }
    .theme-cafe .restaurant-name { color: #2e1e14; }
    .theme-cafe .restaurant-tagline { color: #6f5647; }
    .theme-cafe .table-seal-badge { background: #3e2723; color: #ffffff; border: 1px solid #bda28b; }
    .theme-cafe .seal-num { color: #fde047; }
    .theme-cafe .qr-box-wrap { border-color: #bda28b; }
    .theme-cafe .vf-bracket { border-color: #a68b75; }
    .theme-cafe .step-coin { background: #efebe6; color: #3e2723; border: 1px solid #bda28b; }
    .theme-cafe .step-label { color: #4e342e; }
    .theme-cafe .courtesy-text { color: #795548; }
    .theme-cafe .flourish-dash { background: #bda28b; }

    /* ─── THEME 6: CLEAN MINIMAL (أبيض مودرن ناصع) ─── */
    .theme-minimal {
      background: #ffffff;
    }
    .theme-minimal .stand-plaque {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      box-shadow: 0 16px 36px rgba(0,0,0,0.06);
    }
    .theme-minimal .corner-filigree { color: #94a3b8; }
    .theme-minimal .plaque-inset-frame { border-color: #cbd5e1; }
    .theme-minimal .welcome-ribbon { color: #64748b; }
    .theme-minimal .restaurant-name { color: #0f172a; }
    .theme-minimal .restaurant-tagline { color: #64748b; }
    .theme-minimal .table-seal-badge { background: #0f172a; color: #ffffff; border: 1px solid #cbd5e1; }
    .theme-minimal .seal-num { color: #ffffff; }
    .theme-minimal .qr-box-wrap { border-color: #e2e8f0; }
    .theme-minimal .vf-bracket { border-color: #94a3b8; }
    .theme-minimal .step-coin { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
    .theme-minimal .step-label { color: #334155; }
    .theme-minimal .courtesy-text { color: #64748b; }
    .theme-minimal .flourish-dash { background: #cbd5e1; }

    /* ─── THEME 7: ORIENTAL HERITAGE (تراث شرقي) ─── */
    .theme-oriental {
      background: linear-gradient(150deg, #f8f6f0 0%, #efebe0 60%, #e3dcce 100%);
    }
    .theme-oriental .stand-plaque {
      background: rgba(255, 255, 255, 0.88);
      border: 2px solid #1c3d2e;
      box-shadow: 0 16px 36px rgba(0,0,0,0.1);
    }
    .theme-oriental .corner-filigree { color: #1c3d2e; }
    .theme-oriental .plaque-inset-frame { border-color: rgba(28, 61, 46, 0.4); }
    .theme-oriental .restaurant-name { color: #132e22; }
    .theme-oriental .restaurant-tagline { color: #4e6559; }
    .theme-oriental .table-seal-badge { background: #132e22; color: #ffffff; border: 1px solid #1c3d2e; }
    .theme-oriental .seal-num { color: #fde047; }
    .theme-oriental .qr-box-wrap { border-color: #1c3d2e; }
    .theme-oriental .vf-bracket { border-color: #1c3d2e; }
    .theme-oriental .step-coin { background: #e8ede9; color: #132e22; border: 1px solid #1c3d2e; }
    /* ─── DEFINITIVE OVERRIDES FOR CUSTOM BACKGROUND IMAGE (خلفية صورة مخصصة) ─── */
    /* ضمان تطبيق الزجاج المدخن والخطوط البيضاء الصافية مهما كان القالب المختار */
    .card-wrap.has-bg-img .stand-plaque {
      background: linear-gradient(165deg, rgba(15, 23, 42, 0.78) 0%, rgba(2, 6, 23, 0.84) 100%) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 2.5px solid #fbbf24 !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .card-wrap.has-bg-img .corner-filigree { color: #fbbf24 !important; }
    .card-wrap.has-bg-img .plaque-inset-frame { border-color: rgba(251, 191, 36, 0.5) !important; }
    .card-wrap.has-bg-img .welcome-ribbon { color: #fde047 !important; }
    
    .card-wrap.has-bg-img .brand-header {
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      margin: 0 auto 6px auto !important;
    }
    .card-wrap.has-bg-img .logo-medallion {
      width: 72px !important;
      height: 72px !important;
      margin: 0 auto 6px auto !important;
      border: 3px solid #fbbf24 !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
    }
    .card-wrap.has-bg-img .restaurant-name { 
      color: #ffffff !important; 
      font-size: 34px !important;
      font-weight: 900 !important;
      text-shadow: 0 2px 12px rgba(0,0,0,0.85) !important;
      text-align: center !important;
    }
    .card-wrap.has-bg-img .restaurant-tagline { 
      color: #f8fafc !important; 
      font-size: 13.5px !important;
      font-weight: 700 !important;
      text-shadow: 0 1px 8px rgba(0,0,0,0.8) !important;
      text-align: center !important;
    }
    .card-wrap.has-bg-img .table-seal-badge {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
      color: #ffffff !important;
      border: 1.5px solid #fde047 !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5) !important;
    }
    .card-wrap.has-bg-img .seal-label { color: #ffffff !important; }
    .card-wrap.has-bg-img .seal-num { color: #fef08a !important; }
    .card-wrap.has-bg-img .qr-prompt-banner { 
      color: #ffffff !important; 
      text-shadow: 0 1px 6px rgba(0,0,0,0.8) !important;
    }
    .card-wrap.has-bg-img .qr-camera-icon { color: #34d399 !important; }
    .card-wrap.has-bg-img .qr-box-wrap { 
      border-color: #fbbf24 !important; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.45) !important;
    }
    .card-wrap.has-bg-img .qr-code-img {
      width: 205px !important;
      height: 205px !important;
    }
    .card-wrap.has-bg-img .vf-bracket { border-color: #fbbf24 !important; }
    .card-wrap.has-bg-img .step-coin { 
      background: rgba(251, 191, 36, 0.25) !important; 
      color: #fde047 !important; 
      border: 1px solid #fbbf24 !important; 
    }
    .card-wrap.has-bg-img .step-label { 
      color: #ffffff !important; 
      text-shadow: 0 1px 6px rgba(0,0,0,0.8) !important; 
    }
    .card-wrap.has-bg-img .step-dot { color: #fbbf24 !important; }
    .card-wrap.has-bg-img .courtesy-text { 
      color: #e2e8f0 !important; 
      text-shadow: 0 1px 6px rgba(0,0,0,0.8) !important; 
    }
    .card-wrap.has-bg-img .flourish-dash { background: #fbbf24 !important; }
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
    setTimeout(() => { iframe.remove(); }, 2500);
  };

  const schedulePrint = () => {
    const frameDoc = iframe.contentWindow?.document;
    if (frameDoc && (frameDoc as any).fonts?.ready) {
      (frameDoc as any).fonts.ready.then(() => {
        setTimeout(doPrint, 200);
      }).catch(() => {
        setTimeout(doPrint, 350);
      });
    } else {
      setTimeout(doPrint, 400);
    }
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = schedulePrint;
  }
  setTimeout(schedulePrint, 700);
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
    setTimeout(() => { iframe.remove(); }, 2500);
  };

  const schedulePrint = () => {
    const frameDoc = iframe.contentWindow?.document;
    if (frameDoc && (frameDoc as any).fonts?.ready) {
      (frameDoc as any).fonts.ready.then(() => {
        setTimeout(doPrint, 200);
      }).catch(() => {
        setTimeout(doPrint, 350);
      });
    } else {
      setTimeout(doPrint, 400);
    }
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = schedulePrint;
  }
  setTimeout(schedulePrint, 700);
}
