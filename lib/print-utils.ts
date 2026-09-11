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
        <div style="font-weight: bold; margin-top: 2px;">نظام Menus.ps للطلبات الحية</div>
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

export function printTableStand(stand: {
  tableNumber: number | string;
  restaurantName?: string;
  qrDataUrl: string;
  targetUrl: string;
}) {
  if (typeof window === 'undefined') return;

  const existingFrame = document.getElementById('stand-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'stand-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>ستاند طاولة ${stand.tableNumber}</title>
      <style>
        @page {
          size: A5 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 148mm;
            height: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .stand-card {
            box-shadow: none !important;
            border: 4px solid #1e293b !important;
          }
        }
        body {
          font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 8mm;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          box-sizing: border-box;
          direction: rtl;
        }
        * { box-sizing: border-box; }
        .stand-card {
          width: 132mm;
          background: #ffffff;
          border-radius: 28px;
          border: 4px solid #0f172a;
          padding: 24px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 10px;
          background: linear-gradient(90deg, #f97316, #ea580c, #f59e0b);
        }
        .mascot-badge {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: #fff7ed;
          border: 2px solid #ea580c;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          margin-top: 6px;
        }
        .restaurant-title {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .restaurant-sub {
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
          margin-top: 2px;
        }
        .table-pill {
          display: inline-block;
          background: #0f172a;
          color: #ffffff;
          padding: 6px 22px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
          margin: 12px 0 10px 0;
          border: 2px solid #f97316;
        }
        .qr-frame {
          width: 72mm;
          height: 72mm;
          background: #ffffff;
          border: 3px solid #f97316;
          border-radius: 24px;
          padding: 8px;
          margin: 6px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .qr-frame img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .instructions {
          margin-top: 10px;
        }
        .instructions h3 {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .instructions p {
          font-size: 11px;
          color: #475569;
          font-weight: 700;
          margin: 0;
          line-height: 1.4;
        }
        .steps-container {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1.5px dashed #cbd5e1;
        }
        .step-item {
          flex: 1;
          font-size: 10px;
          font-weight: 800;
          color: #334155;
        }
        .step-icon {
          font-size: 18px;
          display: block;
          margin-bottom: 2px;
        }
        .url-text {
          font-family: monospace;
          font-size: 9px;
          color: #94a3b8;
          direction: ltr;
          margin-top: 8px;
        }
        .footer-brand {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="stand-card">
        <div class="accent-bar"></div>
        
        <!-- Burger Mascot Character -->
        <div class="mascot-badge">
          <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Top Bun -->
            <path d="M12 28C12 17.5066 20.9543 9 32 9C43.0457 9 52 17.5066 52 28C52 29 51 29 50 29H14C13 29 12 29 12 28Z" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
            <!-- Sesame seeds -->
            <ellipse cx="24" cy="18" rx="2" ry="1" fill="#FEF3C7" transform="rotate(-15 24 18)"/>
            <ellipse cx="32" cy="15" rx="2" ry="1" fill="#FEF3C7"/>
            <ellipse cx="40" cy="18" rx="2" ry="1" fill="#FEF3C7" transform="rotate(15 40 18)"/>
            <!-- Cheese with melt -->
            <path d="M10 32H54L48 38L32 34L20 40L10 32Z" fill="#FBBF24"/>
            <!-- Patty -->
            <rect x="11" y="34" width="42" height="8" rx="4" fill="#78350F" stroke="#451A03" stroke-width="1.5"/>
            <!-- Lettuce ruffle -->
            <path d="M8 30C10 28 12 31 15 29C18 31 21 28 24 30C27 28 30 31 33 29C36 31 39 28 42 30C45 28 48 31 51 29C54 31 56 28 56 30" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/>
            <!-- Bottom Bun -->
            <path d="M14 43H50C51 43 52 44 52 45C52 50 43.0457 53 32 53C20.9543 53 12 50 12 45C12 44 13 43 14 43Z" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
            <!-- Cool sunglasses on burger -->
            <rect x="20" y="22" width="10" height="5" rx="2.5" fill="#0F172A"/>
            <rect x="34" y="22" width="10" height="5" rx="2.5" fill="#0F172A"/>
            <line x1="30" y1="24" x2="34" y2="24" stroke="#0F172A" stroke-width="2"/>
            <path d="M22 23L25 25" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
            <path d="M36 23L39 25" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
            <!-- Happy smile -->
            <path d="M29 30C30 31 34 31 35 30" stroke="#78350F" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>

        <h1 class="restaurant-title">${stand.restaurantName || 'Burger House نابلس'}</h1>
        <div class="restaurant-sub">الفرع الرئيسي · رفيديا</div>

        <div class="table-pill">
          ★ طاولة رقم ${stand.tableNumber} ★
        </div>

        <!-- QR Code Framed -->
        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="كود طاولة ${stand.tableNumber}" />
        </div>

        <div class="instructions">
          <h3>امسح الكود لفتح المنيو والطلب 🍔</h3>
          <p>افتح كاميرا الهاتف ووجّهها نحو الكود للتصفح والطلب المباشر</p>
        </div>

        <!-- 3 Quick Steps -->
        <div class="steps-container">
          <div class="step-item">
            <span class="step-icon">📱</span>
            <span>١. امسح الكود</span>
          </div>
          <div class="step-item">
            <span class="step-icon">🍔</span>
            <span>٢. اختر وجبتك</span>
          </div>
          <div class="step-item">
            <span class="step-icon">⚡</span>
            <span>٣. استلم طلبك</span>
          </div>
        </div>

        <div class="url-text">${stand.targetUrl}</div>

        <div class="footer-brand">
          نتمنى لكم وجبة شهية! · Menus.ps
        </div>
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

export function printAllTableStands(stands: Array<{
  tableNumber: number | string;
  restaurantName?: string;
  targetUrl: string;
  qrDataUrl: string;
  branchName?: string;
}>) {
  if (typeof window === 'undefined' || stands.length === 0) return;

  const existingFrame = document.getElementById('stands-all-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'stands-all-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const cardsHtml = stands.map((stand, idx) => `
    <div class="stand-wrapper ${idx < stands.length - 1 ? 'page-break' : ''}">
      <div class="stand-card">
        <div class="accent-bar"></div>
        <div class="mascot-badge">🍽️</div>
        <h1 class="restaurant-title">${stand.restaurantName || 'قائمة الطعام الإلكترونية'}</h1>
        ${stand.branchName ? `<div class="restaurant-sub">${stand.branchName}</div>` : ''}

        <div class="table-pill">طاولة رقم ${stand.tableNumber}</div>

        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="كود طاولة ${stand.tableNumber}" />
        </div>

        <div class="instructions">
          <h3>امسح الكود لفتح المنيو والطلب 📱</h3>
          <p>افتح كاميرا الهاتف ووجّهها نحو الكود للتصفح والطلب المباشر</p>
        </div>

        <div class="steps-container">
          <div class="step-item"><span class="step-icon">📱</span><span>١. امسح الكود</span></div>
          <div class="step-item"><span class="step-icon">🍽️</span><span>٢. اختر وجبتك</span></div>
          <div class="step-item"><span class="step-icon">⚡</span><span>٣. أرسل طلبك</span></div>
        </div>

        <div class="url-text">${stand.targetUrl}</div>
        <div class="footer-brand">نتمنى لكم تجربة مميزة! · Menus.ps</div>
      </div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة بطاقات الطاولات</title>
      <style>
        @page { size: A5 portrait; margin: 0; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break { page-break-after: always; break-after: page; }
          .stand-card { box-shadow: none !important; border: 4px solid #1e293b !important; }
        }
        body {
          font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0; padding: 0; background: #ffffff; direction: rtl;
        }
        * { box-sizing: border-box; }
        .stand-wrapper {
          width: 148mm; height: 210mm; display: flex; align-items: center; justify-content: center; padding: 8mm; box-sizing: border-box;
        }
        .stand-card {
          width: 132mm; background: #ffffff; border-radius: 28px; border: 4px solid #0f172a;
          padding: 24px 20px; text-align: center; position: relative; overflow: hidden;
          display: flex; flex-direction: column; align-items: center;
        }
        .accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(90deg, #f97316, #ea580c, #f59e0b); }
        .mascot-badge { width: 56px; height: 56px; border-radius: 18px; background: #fff7ed; border: 2px solid #ea580c; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 6px 0 8px 0; }
        .restaurant-title { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; }
        .restaurant-sub { font-size: 11px; color: #64748b; font-weight: 700; margin-top: 2px; }
        .table-pill { display: inline-block; background: #0f172a; color: #ffffff; padding: 6px 22px; border-radius: 999px; font-size: 15px; font-weight: 900; margin: 10px 0; border: 2px solid #f97316; }
        .qr-frame { width: 70mm; height: 70mm; background: #ffffff; border: 3px solid #f97316; border-radius: 24px; padding: 8px; margin: 4px auto; display: flex; align-items: center; justify-content: center; }
        .qr-frame img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
        .instructions h3 { margin: 8px 0 2px 0; font-size: 14px; font-weight: 800; color: #0f172a; }
        .instructions p { margin: 0 0 8px 0; font-size: 11px; color: #64748b; font-weight: 500; }
        .steps-container { display: flex; gap: 6px; justify-content: center; margin-bottom: 8px; }
        .step-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px 8px; font-size: 10px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px; }
        .url-text { font-size: 9px; color: #94a3b8; font-family: monospace; direction: ltr; margin-bottom: 4px; }
        .footer-brand { font-size: 10px; font-weight: 700; color: #ea580c; border-top: 1px solid #f1f5f9; padding-top: 6px; width: 100%; }
      </style>
    </head>
    <body>
      ${cardsHtml}
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
  }, 400);
}
