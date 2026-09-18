import { HUMMUS_BASE64, SKILLET_BASE64 } from './food-assets';

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
// buildStandCardHtml — 100% Coded From Scratch Vector & High-Res Food Design
// Matches the exact reference design:
// - Real corner food 1 (Hummus + olive oil + paprika) top-left with orange arc
// - Real corner food 2 (Skillet roasted tomatoes + herbs) bottom-right with orange arc
// - Top-right deep forest green wave + "أهلاً وسهلاً بكم" + orange curved swoosh
// - Bottom-left deep forest green wave
// - Delicate botanical leaf watermarks on left and right
// - Center logo badge: circle with orange border, white fork & spoon + leaf accent
// - "المنيو" / Restaurant name in large bold Arabic calligraphy font
// - Dark pill table badge with orange table & chairs icon + table number
// - QR code in rounded orange border frame
// - Scan prompt with smartphone icon
// - 3 steps: تصفح المنيو | اختر طلبك | أرسل الطلب with orange vertical dividers
// - Footer: ─── نتمنى لك وجبة شهية ───
// ─────────────────────────────────────────────────────────────────────────────
function buildStandCardHtml(
  stands: Array<{
    tableNumber: number | string;
    restaurantName?: string;
    qrDataUrl: string;
    targetUrl?: string;
    logoUrl?: string;
    branchName?: string;
  }>,
  brandColor: string = '#f2722b'
) {
  const cardsHtml = stands.map((stand, idx) => {
    const titleText = stand.restaurantName && stand.restaurantName.trim() !== '' && stand.restaurantName !== 'المطعم'
      ? stand.restaurantName
      : 'المنيو';

    return `
    <div class="page ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="card-wrap">
        <!-- Inset Dark Line Frame -->
        <div class="card-frame"></div>

        <!-- Top-Left Corner: Hummus Dish with Orange Arc -->
        <div class="corner-tl">
          <img src="${HUMMUS_BASE64}" alt="Hummus" />
        </div>

        <!-- Bottom-Right Corner: Skillet Tomatoes with Orange Arc -->
        <div class="corner-br">
          <img src="${SKILLET_BASE64}" alt="Skillet Tomatoes" />
        </div>

        <!-- Top-Right Deep Forest Green Wave -->
        <svg class="corner-tr-wave" viewBox="0 0 135 120" fill="none" preserveAspectRatio="none">
          <path d="M135 0 H0 C48 10 95 42 110 85 C118 102 125 112 135 120 V0 Z" fill="#122722"/>
        </svg>

        <!-- Bottom-Left Deep Forest Green Wave -->
        <svg class="corner-bl-wave" viewBox="0 0 135 120" fill="none" preserveAspectRatio="none">
          <path d="M0 120 H135 C88 110 40 78 25 35 C18 18 10 8 0 0 V120 Z" fill="#122722"/>
        </svg>

        <!-- Welcome Box + Hand-drawn Orange Swoosh Underline -->
        <div class="welcome-box">
          <span class="welcome-text">أهلاً وسهلاً</span>
          <span class="welcome-text">بكم</span>
          <svg class="welcome-swoosh" viewBox="0 0 60 12" fill="none">
            <path d="M2 9 C 20 2, 45 4, 58 7" stroke="${brandColor}" stroke-width="3.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Botanical Leaf Watermarks (Left & Right) -->
        <svg class="leaf-watermark-left" viewBox="0 0 70 140" fill="none">
          <path d="M10 135 Q 25 70 45 10" stroke="#bda995" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M20 105 Q 40 95 48 80 C 40 85 30 88 20 105 Z" fill="#bda995"/>
          <path d="M28 75 Q 52 65 60 48 C 50 55 38 60 28 75 Z" fill="#bda995"/>
          <path d="M38 45 Q 60 35 66 18 C 58 26 48 30 38 45 Z" fill="#bda995"/>
          <path d="M15 118 Q -2 108 -6 95 C 2 98 10 105 15 118 Z" fill="#bda995"/>
          <path d="M23 88 Q 5 78 0 65 C 8 68 18 75 23 88 Z" fill="#bda995"/>
        </svg>

        <svg class="leaf-watermark-right" viewBox="0 0 70 140" fill="none">
          <path d="M10 135 Q 25 70 45 10" stroke="#bda995" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M20 105 Q 40 95 48 80 C 40 85 30 88 20 105 Z" fill="#bda995"/>
          <path d="M28 75 Q 52 65 60 48 C 50 55 38 60 28 75 Z" fill="#bda995"/>
          <path d="M38 45 Q 60 35 66 18 C 58 26 48 30 38 45 Z" fill="#bda995"/>
          <path d="M15 118 Q -2 108 -6 95 C 2 98 10 105 15 118 Z" fill="#bda995"/>
          <path d="M23 88 Q 5 78 0 65 C 8 68 18 75 23 88 Z" fill="#bda995"/>
        </svg>

        <!-- Center Content Stack -->
        <div class="center-content">
          <!-- Logo Circle Badge -->
          <div class="logo-ring">
            ${stand.logoUrl ? `
              <img src="${stand.logoUrl}" class="logo-img" alt="Logo" />
            ` : `
              <svg viewBox="0 0 24 24" width="38" height="38" fill="white">
                <path d="M7 2v5c0 1.1.9 2 2 2v11a1 1 0 0 0 2 0V9c1.1 0 2-.9 2-2V2h-1.5v4h-1V2H9.5v4h-1V2H7z"/>
                <path d="M15 2c-1.66 0-3 1.79-3 4 0 1.48.61 2.76 1.5 3.42V20a1 1 0 0 0 2 0V9.42C16.39 8.76 17 7.48 17 6c0-2.21-1.34-4-3-4z"/>
              </svg>
            `}
            <svg class="logo-leaf" viewBox="0 0 24 24" fill="${brandColor}">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.75C12 8.5 15 8 17 8z"/>
            </svg>
          </div>

          <!-- Restaurant / Menu Title -->
          <h1 class="title-main">${titleText}</h1>
          <div class="title-sub">أطباقنا .. بنكهات أصيلة</div>

          <!-- Dark Pill Table Badge -->
          <div class="table-badge">
            <div class="table-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="${brandColor}">
                <rect x="5" y="8" width="14" height="2.5" rx="1"/>
                <rect x="11" y="10.5" width="2" height="7.5" rx="0.5"/>
                <rect x="8" y="17" width="8" height="2" rx="1"/>
                <rect x="2" y="5" width="2" height="13" rx="1"/>
                <rect x="2" y="11" width="4" height="2" rx="0.5"/>
                <rect x="20" y="5" width="2" height="13" rx="1"/>
                <rect x="18" y="11" width="4" height="2" rx="0.5"/>
              </svg>
            </div>
            <span class="table-num">${stand.tableNumber}</span>
            <span class="table-label">الطاولة</span>
          </div>

          <!-- QR Code Box with Rounded Orange Frame -->
          <div class="qr-container">
            <img class="qr-img" src="${stand.qrDataUrl}" alt="QR" />
          </div>

          <!-- Scan Hint Row -->
          <div class="scan-hint">
            <svg class="scan-phone-icon" viewBox="0 0 20 28" fill="none">
              <rect x="1.5" y="1.5" width="17" height="25" rx="3.5" stroke="#122722" stroke-width="2"/>
              <circle cx="10" cy="22" r="1.5" fill="#122722"/>
              <line x1="7" y1="5" x2="13" y2="5" stroke="#122722" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <div class="scan-text-box">
              <div class="scan-text-main">امسح الرمز لعرض منيو المطعم</div>
              <div class="scan-text-sub">واطلب ما تشتهيه</div>
            </div>
          </div>

          <!-- 3 Steps Row -->
          <div class="steps-row">
            <div class="step-item">
              <div class="step-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#122722">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM8 7h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
                </svg>
              </div>
              <span class="step-label">تصفح المنيو</span>
            </div>

            <div class="step-divider"></div>

            <div class="step-item">
              <div class="step-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#122722">
                  <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
                </svg>
              </div>
              <span class="step-label">اختر طلبك</span>
            </div>

            <div class="step-divider"></div>

            <div class="step-item">
              <div class="step-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#122722">
                  <path d="M12 2a5 5 0 0 0-4.9 4.08A4.5 4.5 0 0 0 4 10.5C4 12.44 5.23 14.1 7 14.72V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4.28c1.77-.62 3-2.28 3-4.22a4.5 4.5 0 0 0-3.1-4.42A5 5 0 0 0 12 2zm3 17H9v-3h6v3z"/>
                </svg>
              </div>
              <span class="step-label">أرسل الطلب</span>
            </div>
          </div>

          <!-- Footer Bar -->
          <div class="footer-bar">
            <div class="footer-dash"></div>
            <span class="footer-msg">نتمنى لك وجبة شهية</span>
            <div class="footer-dash"></div>
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
  <title>بطاقات الطاولات</title>
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
        background: #fff !important;
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
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
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
    .card-wrap {
      width: 140mm;
      height: 154mm;
      background: #faf7f2;
      border-radius: 18px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 32px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
    }
    .card-frame {
      position: absolute;
      inset: 9px;
      border: 1.5px solid #162a24;
      border-radius: 13px;
      pointer-events: none;
      z-index: 15;
    }

    /* ─── Top-Left Corner Food: Hummus ─── */
    .corner-tl {
      position: absolute;
      top: 0;
      left: 0;
      width: 155px;
      height: 155px;
      z-index: 5;
      overflow: hidden;
      border-bottom-right-radius: 125px;
      border-right: 4.5px solid ${brandColor};
      border-bottom: 4.5px solid ${brandColor};
    }
    .corner-tl img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* ─── Bottom-Right Corner Food: Skillet Tomatoes ─── */
    .corner-br {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 155px;
      height: 155px;
      z-index: 5;
      overflow: hidden;
      border-top-left-radius: 125px;
      border-left: 4.5px solid ${brandColor};
      border-top: 4.5px solid ${brandColor};
    }
    .corner-br img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* ─── Top-Right Deep Teal Wave ─── */
    .corner-tr-wave {
      position: absolute;
      top: 0;
      right: 0;
      width: 130px;
      height: 115px;
      z-index: 2;
      pointer-events: none;
    }

    /* ─── Bottom-Left Deep Teal Wave ─── */
    .corner-bl-wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 130px;
      height: 115px;
      z-index: 2;
      pointer-events: none;
    }

    /* ─── Welcome text (Top-Right) ─── */
    .welcome-box {
      position: absolute;
      top: 22px;
      right: 26px;
      z-index: 10;
      text-align: center;
      line-height: 1.15;
    }
    .welcome-text {
      font-size: 14px;
      font-weight: 800;
      color: #122722;
      display: block;
    }
    .welcome-swoosh {
      width: 56px;
      height: 11px;
      margin-top: 3px;
      display: block;
    }

    /* ─── Botanical Leaf Watermarks ─── */
    .leaf-watermark-left {
      position: absolute;
      left: 6px;
      top: 32%;
      width: 65px;
      height: 150px;
      opacity: 0.35;
      z-index: 3;
      pointer-events: none;
    }
    .leaf-watermark-right {
      position: absolute;
      right: 6px;
      top: 35%;
      width: 65px;
      height: 150px;
      opacity: 0.35;
      z-index: 3;
      pointer-events: none;
      transform: scaleX(-1);
    }

    /* ─── Center Content ─── */
    .center-content {
      position: relative;
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin-top: 4px;
    }

    /* Logo Ring */
    .logo-ring {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      border: 3.5px solid ${brandColor};
      background: #122722;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      box-shadow: 0 4px 12px rgba(18, 39, 34, 0.2);
    }
    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .logo-leaf {
      position: absolute;
      right: -8px;
      bottom: 2px;
      width: 22px;
      height: 22px;
    }

    /* Title */
    .title-main {
      font-size: 38px;
      font-weight: 900;
      color: #122722;
      line-height: 1.05;
      letter-spacing: -0.5px;
    }
    .title-sub {
      font-size: 12.5px;
      font-weight: 700;
      color: #63726c;
      margin-top: 2px;
      margin-bottom: 9px;
    }

    /* Table Badge */
    .table-badge {
      background: #122722;
      border-radius: 999px;
      padding: 5px 20px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 9px;
      box-shadow: 0 4px 12px rgba(18, 39, 34, 0.25);
    }
    .table-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .table-num {
      color: #ffffff;
      font-size: 20px;
      font-weight: 900;
      line-height: 1;
    }
    .table-label {
      color: #ffffff;
      font-size: 13.5px;
      font-weight: 800;
      line-height: 1;
    }

    /* QR Box */
    .qr-container {
      background: #ffffff;
      border: 3.5px solid ${brandColor};
      border-radius: 22px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      box-shadow: 0 4px 16px rgba(242, 114, 43, 0.15);
    }
    .qr-img {
      width: 142px;
      height: 142px;
      display: block;
      border-radius: 6px;
    }

    /* Scan Hint */
    .scan-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .scan-phone-icon {
      width: 18px;
      height: 24px;
    }
    .scan-text-box {
      text-align: right;
      line-height: 1.25;
    }
    .scan-text-main {
      font-size: 12.5px;
      font-weight: 800;
      color: #122722;
    }
    .scan-text-sub {
      font-size: 10.5px;
      font-weight: 600;
      color: #71807b;
    }

    /* 3 Steps Row */
    .steps-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      width: 100%;
      padding: 0 10px;
      margin-bottom: 6px;
    }
    .step-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .step-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-label {
      font-size: 10.5px;
      font-weight: 800;
      color: #122722;
      white-space: nowrap;
    }
    .step-divider {
      width: 1.5px;
      height: 20px;
      background: ${brandColor};
      opacity: 0.8;
      border-radius: 2px;
    }

    /* Footer Bar */
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      margin-bottom: 2px;
    }
    .footer-dash {
      width: 40px;
      height: 2px;
      background: ${brandColor};
      border-radius: 99px;
    }
    .footer-msg {
      font-size: 11.5px;
      font-weight: 800;
      color: #122722;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>`;
}

export function printTableStand(stand: {
  tableNumber: number | string;
  restaurantName?: string;
  qrDataUrl: string;
  targetUrl: string;
  logoUrl?: string;
  brandColor?: string;
}) {
  if (typeof window === 'undefined') return;

  const existingFrame = document.getElementById('stand-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'stand-print-frame';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const html = buildStandCardHtml([stand], stand.brandColor || '#f2722b');

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

export function printAllTableStands(stands: Array<{
  tableNumber: number | string;
  restaurantName?: string;
  targetUrl: string;
  qrDataUrl: string;
  branchName?: string;
  logoUrl?: string;
  brandColor?: string;
}>) {
  if (typeof window === 'undefined' || stands.length === 0) return;

  const existingFrame = document.getElementById('stands-all-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'stands-all-print-frame';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const brand = stands[0]?.brandColor || '#f2722b';
  const html  = buildStandCardHtml(stands, brand);

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
