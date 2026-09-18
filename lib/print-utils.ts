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
// buildStandCardHtml — Premium restaurant table tent design
// Inspired by professional Arabic restaurant QR stands
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
  const rgb = hexToRgb(brandColor);
  const brandAlpha = (a: number) => rgb ? `rgba(${rgb},${a})` : `rgba(15,23,42,${a})`;

  // Dark complementary color for corners (darken brand color)
  const cornerColor = darkenHex(brandColor, 0.55);

  // Inline SVG leaf decoration
  const leafSvg = (flip = false) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80" style="width:52px;height:70px;opacity:0.55;${flip ? 'transform:scaleX(-1);' : ''}">
      <path d="M30 75 C5 55 5 20 30 5 C55 20 55 55 30 75Z" fill="rgba(255,255,255,0.25)"/>
      <path d="M30 75 C30 55 30 20 30 5" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none"/>
      <path d="M30 35 C18 30 10 25 8 15" stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none"/>
      <path d="M30 45 C42 40 50 35 52 25" stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none"/>
      <path d="M30 25 C22 20 16 16 14 8" stroke="rgba(255,255,255,0.25)" stroke-width="1" fill="none"/>
      <path d="M30 25 C38 20 44 16 46 8" stroke="rgba(255,255,255,0.25)" stroke-width="1" fill="none"/>
    </svg>`;

  // Table icon SVG
  const tableIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white">
    <rect x="2" y="6" width="20" height="3" rx="1.5"/>
    <rect x="4" y="9" width="3" height="9" rx="1.5"/>
    <rect x="17" y="9" width="3" height="9" rx="1.5"/>
  </svg>`;

  const cardsHtml = stands.map((stand, idx) => `
    <div class="page ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="card">

        <!-- Top-left corner -->
        <div class="corner tl">
          <div class="corner-food tl-food"></div>
          ${leafSvg()}
        </div>

        <!-- Top-right corner -->
        <div class="corner tr">
          <div class="corner-food tr-food"></div>
          ${leafSvg(true)}
          <div class="welcome-text">أهلاً وسهلاً<br>بكم</div>
        </div>

        <!-- Main content -->
        <div class="content">

          <!-- Logo -->
          ${stand.logoUrl
            ? `<div class="logo-ring"><img src="${stand.logoUrl}" class="logo-img" alt="logo"/></div>`
            : `<div class="logo-ring logo-default">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="${brandColor}">
                  <path d="M11 2v7.268A2 2 0 0 0 9 11v9h6v-9a2 2 0 0 0-2-7.268V2h-2zm4 0h2v5h-2V2zm-8 0H5v5h2V2zM3 9h18v2H3V9z"/>
                </svg>
               </div>`
          }

          <!-- Restaurant name -->
          <h1 class="rest-name">${stand.restaurantName || 'المطعم'}</h1>
          <div class="rest-sub">أطباقنا .. بنكهات أصيلة</div>

          <!-- Table badge -->
          <div class="table-badge">
            ${tableIcon}
            <span class="badge-label">الطاولة</span>
            <span class="badge-divider">|</span>
            <span class="badge-num">${stand.tableNumber}</span>
          </div>

          <!-- QR code -->
          <div class="qr-wrap">
            <div class="qr-inner">
              <img src="${stand.qrDataUrl}" alt="QR" />
            </div>
          </div>

          <!-- Scan instruction -->
          <div class="scan-row">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="${brandColor}">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
            </svg>
            <div class="scan-text">
              <div class="scan-main">امسح الرمز لعرض منيو المطعم</div>
              <div class="scan-sub">واطلب ما تشتهيه</div>
            </div>
          </div>

          <!-- Steps -->
          <div class="steps-row">
            <div class="step-item">
              <div class="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="${brandColor}"><path d="M12 6a6 6 0 0 1 6 6H6a6 6 0 0 1 6-6zm0-4C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
              </div>
              <div class="step-label">تصفح المنيو</div>
            </div>
            <div class="step-sep">|</div>
            <div class="step-item">
              <div class="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="${brandColor}"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z"/></svg>
              </div>
              <div class="step-label">اختر طبلك</div>
            </div>
            <div class="step-sep">|</div>
            <div class="step-item">
              <div class="step-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="${brandColor}"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </div>
              <div class="step-label">أرسل الطلب</div>
            </div>
          </div>

          <!-- Footer line -->
          <div class="footer-line">
            <div class="fl-dash"></div>
            <span class="fl-text">نتمنى لك وجبة شهية</span>
            <div class="fl-dash"></div>
          </div>
        </div>

        <!-- Bottom-left corner -->
        <div class="corner bl">
          <div class="corner-food bl-food"></div>
          ${leafSvg()}
        </div>

        <!-- Bottom-right corner -->
        <div class="corner br">
          <div class="corner-food br-food"></div>
          ${leafSvg(true)}
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
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A5 portrait; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .page-break { page-break-after: always; break-after: page; }
      .card { box-shadow: none !important; }
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: #f0ece4; direction: rtl; }

    /* ── Page / Card ── */
    .page {
      width: 148mm; height: 210mm;
      display: flex; align-items: center; justify-content: center;
    }
    .card {
      width: 140mm; height: 200mm;
      background: #f7f3ec;
      border-radius: 18px;
      border: 1.5px solid ${brandAlpha(0.35)};
      box-shadow: 0 8px 40px rgba(0,0,0,0.13);
      position: relative;
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Corners ── */
    .corner {
      position: absolute;
      width: 80px; height: 90px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .corner.tl { top: 0; right: 0; border-radius: 0 18px 0 0; }
    .corner.tr { top: 0; left: 0; border-radius: 18px 0 0 0; }
    .corner.bl { bottom: 0; right: 0; border-radius: 0 0 0 18px; }
    .corner.br { bottom: 0; left: 0; border-radius: 0 0 18px 0; }

    /* Corner background color */
    .corner::before {
      content: '';
      position: absolute; inset: 0;
      background: ${cornerColor};
    }
    .corner.tl::before { border-radius: 0 18px 60% 0; }
    .corner.tr::before { border-radius: 18px 0 0 60%; }
    .corner.bl::before { border-radius: 0 60% 0 18px; }
    .corner.br::before { border-radius: 60% 0 18px 0; }

    /* ── Welcome text (top-left corner in reference) ── */
    .welcome-text {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 8.5px;
      font-weight: 800;
      text-align: center;
      line-height: 1.4;
      z-index: 2;
      white-space: nowrap;
    }

    /* ── Main content ── */
    .content {
      position: relative; z-index: 5;
      display: flex; flex-direction: column;
      align-items: center; text-align: center;
      width: 100%; padding: 0 14px;
      gap: 0;
    }

    /* ── Logo ── */
    .logo-ring {
      width: 72px; height: 72px;
      border-radius: 50%;
      border: 3px solid ${brandColor};
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px ${brandAlpha(0.25)};
      margin-bottom: 8px;
      overflow: hidden;
    }
    .logo-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

    /* ── Restaurant name ── */
    .rest-name {
      font-size: 32px; font-weight: 900;
      color: #1a1a1a; line-height: 1.1;
      margin-bottom: 3px;
    }
    .rest-sub {
      font-size: 11px; font-weight: 600;
      color: #7a6f61; letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    /* ── Table badge ── */
    .table-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: #1a1a1a; color: #fff;
      padding: 6px 20px; border-radius: 999px;
      margin-bottom: 12px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    }
    .badge-label { font-size: 13px; font-weight: 700; }
    .badge-divider { font-size: 16px; color: ${brandColor}; font-weight: 900; }
    .badge-num { font-size: 20px; font-weight: 900; color: ${brandColor}; }

    /* ── QR ── */
    .qr-wrap {
      background: #fff;
      border: 2.5px solid ${brandColor};
      border-radius: 14px;
      padding: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 16px ${brandAlpha(0.2)};
    }
    .qr-inner {
      width: 70mm; height: 70mm;
      display: flex; align-items: center; justify-content: center;
    }
    .qr-inner img { width: 100%; height: 100%; object-fit: contain; display: block; border-radius: 6px; }

    /* ── Scan ── */
    .scan-row {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 10px;
    }
    .scan-text { text-align: right; }
    .scan-main { font-size: 12px; font-weight: 800; color: #1a1a1a; }
    .scan-sub { font-size: 10px; font-weight: 600; color: #8a7d70; }

    /* ── Steps ── */
    .steps-row {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; margin-bottom: 10px;
      border-top: 1px dashed ${brandAlpha(0.3)};
      border-bottom: 1px dashed ${brandAlpha(0.3)};
      padding: 8px 0;
      width: 100%;
    }
    .step-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .step-icon { display: flex; align-items: center; justify-content: center; }
    .step-label { font-size: 9.5px; font-weight: 800; color: #3a3530; }
    .step-sep { font-size: 20px; color: ${brandAlpha(0.3)}; font-weight: 300; margin: 0 2px; }

    /* ── Footer ── */
    .footer-line {
      display: flex; align-items: center; gap: 8px;
      width: 100%;
    }
    .fl-dash { flex: 1; height: 1.5px; background: ${brandColor}; opacity: 0.5; border-radius: 99px; }
    .fl-text { font-size: 10px; font-weight: 700; color: #6b6158; white-space: nowrap; }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>`;
}

/** Darken a hex color by a factor (0-1) */
function darkenHex(hex: string, factor: number): string {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return '#1a2c1e';
  const [r, g, b] = m.map(x => Math.round(parseInt(x, 16) * (1 - factor)));
  return `rgb(${r},${g},${b})`;
}

/** Convert #rrggbb to "r,g,b" string */
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

  const html = buildStandCardHtml([stand], stand.brandColor || '#e07b2a');

  doc.open(); doc.write(html); doc.close();
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

  const brand = stands[0]?.brandColor || '#e07b2a';
  const html  = buildStandCardHtml(stands, brand);

  doc.open(); doc.write(html); doc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => { iframe.remove(); }, 1500);
  }, 400);
}
