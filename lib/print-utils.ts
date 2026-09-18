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
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
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
        <td style="padding: 4px 0; text-align: center; font-weight: bold; font-size: 13px; vertical-align: top;">
          ${it.quantity}×
        </td>
        <td style="padding: 4px 0; text-align: left; font-weight: bold; font-size: 13px; vertical-align: top;">
          ${it.price * it.quantity} ₪
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>بون طلب - ${order.id}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0mm;
        }
        @media print {
          html, body {
            width: 78mm;
            margin: 0 !important;
            padding: 4mm 2mm !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
        body {
          font-family: 'Courier New', Courier, monospace, 'Segoe UI', Tahoma, sans-serif;
          width: 78mm;
          margin: 0 auto;
          padding: 6px;
          background: #fff;
          color: #000;
          font-size: 12px;
          line-height: 1.35;
          direction: rtl;
        }
        * { box-sizing: border-box; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .double-divider { border-top: 2px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        th { border-bottom: 1.5px solid #000; padding: 4px 0; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <h2 style="margin: 0; font-size: 17px; font-weight: 900;">${order.restaurantName || 'Burger House نابلس'}</h2>
        <div style="font-size: 11px; margin-top: 2px;">فرع رفيديا الرئيسي · هاتف: 0599123456</div>
        <div class="double-divider"></div>
        <div style="font-size: 16px; font-weight: 900; margin: 4px 0;">
          بون طلب — طاولة رقم (${order.table})
        </div>
        <div style="font-size: 11px; font-weight: bold; color: #222;">
          ${order.id} | الوقت: ${order.time}
        </div>
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th class="text-right">الصنف</th>
            <th class="text-center" style="width: 38px;">الكمية</th>
            <th class="text-left" style="width: 48px;">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${
        order.notes
          ? `
        <div style="border: 1px solid #000; padding: 5px; margin: 6px 0; font-size: 11px; background: #fafafa;">
          <strong>⚠️ ملاحظات الزبون:</strong><br/>
          ${order.notes}
        </div>
      `
          : ''
      }

      <div class="double-divider"></div>

      <div style="font-size: 14px; font-weight: 900; display: flex; justify-content: space-between; margin-top: 4px;">
        <span>المجموع الكلي:</span>
        <span style="font-size: 16px;">${order.total} ₪</span>
      </div>
      <div style="font-size: 10px; color: #444; margin-top: 2px;">الضريبة والخدمة مشمولة</div>

      <div class="divider" style="margin-top: 10px;"></div>

      <div class="text-center" style="font-size: 10px; margin-top: 6px; color: #333;">
        <div>شكراً لزيارتكم! نتمنى لكم وجبة شهية ✨</div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 1500);
  }, 350);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper — builds full HTML document for one or many stand cards
// brandColor: hex color from restaurant settings (e.g. "#c8102e")
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
  brandColor: string
) {
  // Derive a lighter tint (20% opacity) for backgrounds/borders from the brand color
  const brandRgb = hexToRgb(brandColor);
  const brandLight = brandRgb ? `rgba(${brandRgb},0.15)` : 'rgba(15,23,42,0.08)';
  const brandMid   = brandRgb ? `rgba(${brandRgb},0.35)` : 'rgba(15,23,42,0.20)';

  const cardsHtml = stands.map((stand, idx) => `
    <div class="stand-wrapper ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="stand-card">

        <!-- Top accent bar -->
        <div class="top-bar"></div>

        <!-- Logo or icon -->
        <div class="logo-wrap">
          ${stand.logoUrl
            ? `<img src="${stand.logoUrl}" class="logo-img" alt="Logo" />`
            : `<div class="logo-placeholder">🍽️</div>`
          }
        </div>

        <!-- Restaurant name -->
        <h1 class="restaurant-title">${stand.restaurantName || 'أهلاً وسهلاً بكم'}</h1>
        <div class="menu-subtitle">قائمة الطعام الرقمية · الطلب المباشر</div>

        <!-- Table badge -->
        <div class="table-badge">
          <span class="badge-label">طاولة</span>
          <span class="badge-num">${stand.tableNumber}</span>
        </div>

        <!-- QR -->
        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="QR طاولة ${stand.tableNumber}" />
        </div>

        <!-- Instructions -->
        <p class="scan-label">📲 امسح الرمز لطلب طعامك مباشرة</p>

        <!-- Steps -->
        <div class="steps-row">
          <div class="step"><span>📷</span> وجّه الكاميرا</div>
          <div class="step-sep">›</div>
          <div class="step"><span>🍔</span> اختر وجبتك</div>
          <div class="step-sep">›</div>
          <div class="step"><span>⚡</span> الطلب يصلك</div>
        </div>

        <!-- Bottom accent bar -->
        <div class="bottom-bar"></div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>بطاقات الطاولات</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A5 portrait; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .page-break { page-break-after: always; break-after: page; }
      .stand-card { box-shadow: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', 'Segoe UI', system-ui, Tahoma, sans-serif;
      background: #f8fafc; direction: rtl;
    }

    /* ── Wrapper ── */
    .stand-wrapper {
      width: 148mm; height: 210mm;
      display: flex; align-items: center; justify-content: center;
      padding: 7mm;
    }

    /* ── Card ── */
    .stand-card {
      width: 134mm;
      background: #ffffff;
      border-radius: 24px;
      border: 2.5px solid ${brandColor};
      box-shadow: 0 8px 32px ${brandLight};
      display: flex; flex-direction: column;
      align-items: center;
      overflow: hidden;
      position: relative;
      padding: 0 18px 14px 18px;
      text-align: center;
    }

    /* ── Top / Bottom accent bars ── */
    .top-bar {
      width: 100%; height: 7px;
      background: ${brandColor};
      margin-bottom: 18px;
    }
    .bottom-bar {
      width: 60%; height: 4px;
      background: ${brandColor};
      border-radius: 99px;
      margin-top: 14px;
      opacity: 0.4;
    }

    /* ── Logo ── */
    .logo-wrap { margin-bottom: 10px; }
    .logo-img {
      width: 72px; height: 72px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid ${brandColor};
      box-shadow: 0 4px 16px ${brandMid};
    }
    .logo-placeholder {
      width: 72px; height: 72px; border-radius: 50%;
      background: ${brandLight};
      border: 3px solid ${brandColor};
      display: flex; align-items: center; justify-content: center;
      font-size: 28px;
    }

    /* ── Text ── */
    .restaurant-title {
      font-size: 26px; font-weight: 900;
      color: #0f172a; line-height: 1.2;
      margin-bottom: 2px;
    }
    .menu-subtitle {
      font-size: 10.5px; font-weight: 700;
      color: #64748b; letter-spacing: 0.8px;
      margin-bottom: 12px;
    }

    /* ── Table badge ── */
    .table-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: ${brandColor};
      color: #ffffff;
      padding: 7px 28px; border-radius: 999px;
      margin-bottom: 14px;
      box-shadow: 0 4px 12px ${brandMid};
    }
    .badge-label { font-size: 13px; font-weight: 700; opacity: 0.9; }
    .badge-num   { font-size: 22px; font-weight: 900; }

    /* ── QR frame ── */
    .qr-frame {
      width: 72mm; height: 72mm;
      background: #ffffff;
      border: 2px solid ${brandColor};
      border-radius: 18px;
      padding: 10px;
      margin-bottom: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px ${brandLight};
    }
    .qr-frame img {
      width: 100%; height: 100%;
      object-fit: contain; border-radius: 10px;
    }

    /* ── Scan label ── */
    .scan-label {
      font-size: 13px; font-weight: 900; color: #0f172a;
      margin-bottom: 10px;
    }

    /* ── Steps ── */
    .steps-row {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; flex-wrap: nowrap;
    }
    .step {
      background: ${brandLight};
      border: 1px solid ${brandColor};
      padding: 5px 10px; border-radius: 10px;
      font-size: 10px; font-weight: 800; color: #1e293b;
      display: flex; align-items: center; gap: 4px; white-space: nowrap;
    }
    .step-sep { color: ${brandColor}; font-size: 16px; font-weight: 900; }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>`;
}

/** Convert #rrggbb to "r,g,b" string for rgba() usage */
function hexToRgb(hex: string): string | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map(x => parseInt(x, 16)).join(',');
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

  const html = buildStandCardHtml([stand], stand.brandColor || '#0f172a');

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => { iframe.remove(); }, 1500);
  }, 400);
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

  const brand = stands[0]?.brandColor || '#0f172a';
  const html = buildStandCardHtml(stands, brand);

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => { iframe.remove(); }, 1500);
  }, 400);
}
