import { CARD_TEMPLATE_WEBP } from './stand-card-template';

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
// buildStandCardHtml — 100% faithful to the user's reference design
// Features: Real hummus plate corner, skillet tomatoes corner, dark green waves,
// botanical leaf watermark, welcome text with orange swoosh, table badge,
// orange rounded QR frame, phone icon with scan text, 3 action steps, and footer.
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
  brandColor: string = '#f37324'
) {
  const cardsHtml = stands.map((stand, idx) => {
    const customName = stand.restaurantName && stand.restaurantName.trim() !== '' && stand.restaurantName !== 'المطعم' && stand.restaurantName !== 'المنيو' ? stand.restaurantName : null;

    return `
    <div class="page ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="card">
        <!-- Exact reference design template with real food photography corners, leaves, welcome text & footer -->
        <img class="template-bg" src="${CARD_TEMPLATE_WEBP}" alt="Stand Card Background" />

        <!-- Optional custom logo overlay (inside top circle) -->
        ${stand.logoUrl ? `
          <div class="logo-overlay">
            <img src="${stand.logoUrl}" alt="Logo" />
          </div>
        ` : ''}

        <!-- Optional custom restaurant name overlay -->
        ${customName ? `
          <div class="custom-name-overlay">
            <div class="name-text">${customName}</div>
          </div>
        ` : ''}

        <!-- Dynamic Table Number in the table badge -->
        <div class="table-num-overlay">
          ${stand.tableNumber}
        </div>

        <!-- Dynamic QR Code inside the orange rounded frame -->
        <div class="qr-overlay">
          <img src="${stand.qrDataUrl}" alt="QR" />
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
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&display=swap" rel="stylesheet">
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
      .card {
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
    .card {
      position: relative;
      width: 140mm;
      height: 153.06mm;
      background: #f8f4ef;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }
    .template-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      display: block;
      z-index: 1;
    }
    .logo-overlay {
      position: absolute;
      top: 8.5%;
      left: 43.7%;
      width: 11.2%;
      aspect-ratio: 1;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      z-index: 10;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .logo-overlay img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .custom-name-overlay {
      position: absolute;
      top: 19.8%;
      left: 20%;
      width: 60%;
      height: 8.5%;
      background: #f8f4ef;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .name-text {
      font-family: 'Cairo', sans-serif;
      font-size: 24px;
      font-weight: 900;
      color: #12211c;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .table-num-overlay {
      position: absolute;
      top: 35.2%;
      left: 42.5%;
      width: 9%;
      height: 5.8%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-family: 'Cairo', sans-serif;
      font-size: 20px;
      font-weight: 900;
      line-height: 1;
      z-index: 10;
      text-align: center;
      direction: ltr;
    }
    .qr-overlay {
      position: absolute;
      top: 45.8%;
      left: 30.6%;
      width: 32.2%;
      height: 28.0%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .qr-overlay img {
      width: 92%;
      height: 92%;
      object-fit: contain;
      display: block;
      border-radius: 6px;
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

  const html = buildStandCardHtml([stand], stand.brandColor || '#f37324');

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

  const brand = stands[0]?.brandColor || '#f37324';
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
