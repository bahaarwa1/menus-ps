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
      <title>طاولة ${stand.tableNumber}</title>
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
            border: 1.5px solid #e2e8f0 !important;
          }
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 8mm;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          direction: rtl;
        }
        .stand-card {
          width: 132mm;
          background: #ffffff;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 32px 24px 28px 24px;
          text-align: center;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .restaurant-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .table-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          color: #0f172a;
          padding: 6px 20px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          margin: 12px 0 16px 0;
          border: 1px solid #cbd5e1;
        }
        .qr-frame {
          width: 76mm;
          height: 76mm;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 12px;
          margin: 0 auto 16px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        .qr-frame img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .instructions {
          margin-top: 4px;
        }
        .instructions h3 {
          font-size: 15px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        .instructions p {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin: 0;
        }
        .steps-container {
          display: flex;
          justify-content: center;
          gap: 16px;
          width: 100%;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
        }
        .step-item {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      </style>
    </head>
    <body>
      <div class="stand-card">
        <h1 class="restaurant-title">${stand.restaurantName || 'أهلاً بكم'}</h1>

        <div class="table-pill">
          طاولة ${stand.tableNumber}
        </div>

        <!-- Clean Luxury QR Stand Frame -->
        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="كود طاولة ${stand.tableNumber}" />
        </div>

        <div class="instructions">
          <h3>امسح الكود لطلب الطعام</h3>
          <p>وجّه كاميرا هاتفك نحو الكود لتصفح القائمة والطلب مباشرة</p>
        </div>

        <!-- Minimal Steps -->
        <div class="steps-container">
          <div class="step-item"><span>١. امسح الكود</span></div>
          <div class="step-item"><span>•</span></div>
          <div class="step-item"><span>٢. اختر وجبتك</span></div>
          <div class="step-item"><span>•</span></div>
          <div class="step-item"><span>٣. أرسل طلبك</span></div>
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
        <h1 class="restaurant-title">${stand.restaurantName || 'أهلاً بكم'}</h1>

        <div class="table-pill">طاولة ${stand.tableNumber}</div>

        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="كود طاولة ${stand.tableNumber}" />
        </div>

        <div class="instructions">
          <h3>امسح الكود لطلب الطعام</h3>
          <p>وجّه كاميرا هاتفك نحو الكود لتصفح القائمة والطلب مباشرة</p>
        </div>

        <div class="steps-container">
          <div class="step-item"><span>١. امسح الكود</span></div>
          <div class="step-item"><span>•</span></div>
          <div class="step-item"><span>٢. اختر وجبتك</span></div>
          <div class="step-item"><span>•</span></div>
          <div class="step-item"><span>٣. أرسل طلبك</span></div>
        </div>
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
          .stand-card { box-shadow: none !important; border: 1.5px solid #e2e8f0 !important; }
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, Tahoma, Geneva, Verdana, sans-serif;
          margin: 0; padding: 0; background: #ffffff; direction: rtl;
        }
        .stand-wrapper {
          width: 148mm; height: 210mm; display: flex; align-items: center; justify-content: center; padding: 8mm; box-sizing: border-box;
        }
        .stand-card {
          width: 132mm; background: #ffffff; border-radius: 24px; border: 1.5px solid #e2e8f0;
          padding: 32px 24px 28px 24px; text-align: center; position: relative;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .restaurant-title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
        .table-pill { display: inline-flex; align-items: center; justify-content: center; background: #f8fafc; color: #0f172a; padding: 6px 20px; border-radius: 999px; font-size: 14px; font-weight: 700; margin: 12px 0 16px 0; border: 1px solid #cbd5e1; }
        .qr-frame { width: 76mm; height: 76mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 12px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
        .qr-frame img { width: 100%; height: 100%; object-fit: contain; }
        .instructions h3 { margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #1e293b; }
        .instructions p { margin: 0; font-size: 12px; color: #64748b; font-weight: 500; }
        .steps-container { display: flex; justify-content: center; gap: 16px; width: 100%; margin-top: 18px; padding-top: 14px; border-top: 1px solid #f1f5f9; }
        .step-item { font-size: 11px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 4px; }
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
