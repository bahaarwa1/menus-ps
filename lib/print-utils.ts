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
        @page { size: 80mm auto; margin: 0mm; }
        @media print {
          html, body { width: 78mm; margin: 0 !important; padding: 4mm 2mm !important; background: #fff !important; color: #000 !important; }
        }
        body { font-family: 'Courier New', Courier, monospace, 'Segoe UI', Tahoma, sans-serif; width: 78mm; margin: 0 auto; padding: 6px; background: #fff; color: #000; font-size: 12px; line-height: 1.35; direction: rtl; }
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

      ${order.notes ? `
        <div style="border: 1px solid #000; padding: 5px; margin: 6px 0; font-size: 11px; background: #fafafa;">
          <strong>⚠️ ملاحظات الزبون:</strong><br/>
          ${order.notes}
        </div>
      ` : ''}

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
    setTimeout(() => { iframe.remove(); }, 1500);
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
  const brandRgb  = hexToRgb(brandColor);
  const brandLight = brandRgb ? `rgba(${brandRgb},0.12)` : 'rgba(15,23,42,0.08)';
  const brandMid   = brandRgb ? `rgba(${brandRgb},0.30)` : 'rgba(15,23,42,0.20)';

  const cardsHtml = stands.map((stand, idx) => `
    <div class="stand-wrapper ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="stand-card">

        <!-- Colored header bar with decorative dots -->
        <div class="card-header">
          <div class="header-line"></div>
          <div class="header-dots">
            <span class="dot sm"></span>
            <span class="dot lg"></span>
            <span class="dot sm"></span>
          </div>
          <div class="header-line"></div>
        </div>

        <!-- Restaurant name — the hero -->
        <div class="hero">
          <div class="hero-label">✦ قائمة الطعام الرقمية ✦</div>
          <h1 class="hero-title">${stand.restaurantName || 'أهلاً وسهلاً'}</h1>
        </div>

        <!-- Table badge -->
        <div class="table-badge">
          <span class="badge-label">طاولة رقم</span>
          <span class="badge-num">${stand.tableNumber}</span>
        </div>

        <!-- QR code — the main element -->
        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="QR طاولة ${stand.tableNumber}" />
        </div>

        <!-- Scan instruction -->
        <p class="scan-text">وجّه كاميرا هاتفك نحو الرمز لعرض القائمة والطلب مباشرةً</p>

        <!-- Steps -->
        <div class="steps">
          <div class="step"><span class="si">📷</span><span>وجّه</span></div>
          <div class="arrow">›</div>
          <div class="step"><span class="si">🍽️</span><span>اختر</span></div>
          <div class="arrow">›</div>
          <div class="step"><span class="si">⚡</span><span>استمتع</span></div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <div class="footer-line"></div>
          <span class="footer-text">menus.cool</span>
          <div class="footer-line"></div>
        </div>

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
      html, body {
        margin: 0 !important; padding: 0 !important; background: #fff !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }
      .page-break { page-break-after: always; break-after: page; }
      .stand-card { box-shadow: none !important; }
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Cairo', 'Segoe UI', system-ui, Tahoma, sans-serif;
      background: #fff; direction: rtl;
    }

    /* ── Page wrapper ── */
    .stand-wrapper {
      width: 148mm; height: 210mm;
      display: flex; align-items: center; justify-content: center;
      padding: 6mm;
    }

    /* ── Card ── */
    .stand-card {
      width: 136mm;
      background: #ffffff;
      border-radius: 22px;
      border: 2px solid ${brandColor};
      box-shadow: 0 10px 36px ${brandLight};
      display: flex; flex-direction: column; align-items: center;
      overflow: hidden; text-align: center;
    }

    /* ── Colored header ── */
    .card-header {
      width: 100%; background: ${brandColor};
      display: flex; align-items: center; justify-content: center;
      gap: 10px; padding: 11px 20px 10px;
    }
    .header-line { flex: 1; height: 1px; background: rgba(255,255,255,0.35); }
    .header-dots { display: flex; gap: 6px; align-items: center; }
    .dot { display: block; border-radius: 50%; background: rgba(255,255,255,0.9); }
    .dot.sm { width: 6px; height: 6px; }
    .dot.lg { width: 11px; height: 11px; background: #fff; }

    /* ── Hero name ── */
    .hero { padding: 14px 16px 8px; width: 100%; }
    .hero-label {
      font-size: 9px; font-weight: 700; color: ${brandColor};
      letter-spacing: 2.5px; margin-bottom: 5px;
    }
    .hero-title {
      font-size: 31px; font-weight: 900;
      color: #0f172a; line-height: 1.1;
    }

    /* ── Table badge ── */
    .table-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: ${brandColor}; color: #fff;
      padding: 6px 26px; border-radius: 999px;
      margin: 0 0 12px;
      box-shadow: 0 4px 12px ${brandMid};
    }
    .badge-label { font-size: 12px; font-weight: 700; opacity: 0.88; }
    .badge-num   { font-size: 25px; font-weight: 900; }

    /* ── QR frame ── */
    .qr-frame {
      width: 80mm; height: 80mm;
      background: #fff;
      border: 2px solid ${brandColor};
      border-radius: 16px;
      padding: 8px;
      margin-bottom: 10px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 18px ${brandLight};
    }
    .qr-frame img {
      width: 100%; height: 100%;
      object-fit: contain; border-radius: 8px; display: block;
    }

    /* ── Scan text ── */
    .scan-text {
      font-size: 10.5px; font-weight: 700; color: #475569;
      margin-bottom: 10px; padding: 0 14px; line-height: 1.55;
    }

    /* ── Steps ── */
    .steps {
      display: flex; align-items: center; justify-content: center;
      gap: 5px; margin-bottom: 12px;
    }
    .step {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      background: ${brandLight}; border: 1px solid ${brandColor};
      padding: 6px 13px; border-radius: 12px; min-width: 50px;
    }
    .si { font-size: 15px; }
    .step span:last-child { font-size: 9px; font-weight: 800; color: #1e293b; }
    .arrow { color: ${brandColor}; font-size: 20px; font-weight: 900; line-height: 1; }

    /* ── Footer ── */
    .card-footer {
      width: 100%; display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 8px 20px 11px;
      border-top: 1px solid ${brandLight};
    }
    .footer-line { flex: 1; height: 1px; background: ${brandLight}; }
    .footer-text { font-size: 9px; font-weight: 700; color: ${brandColor}; letter-spacing: 1.5px; }
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
  const html  = buildStandCardHtml(stands, brand);

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => { iframe.remove(); }, 1500);
  }, 400);
}
