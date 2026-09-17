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
  logoUrl?: string;
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
      <title>طاولة ${stand.tableNumber} - ${stand.restaurantName || 'مطعمنا'}</title>
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
            border: 2px solid #eab308 !important;
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
          border-radius: 28px;
          border: 2px solid #eab308;
          padding: 24px 20px 20px 20px;
          text-align: center;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(217, 119, 6, 0.08);
          background-image: radial-gradient(circle at top, rgba(254, 243, 199, 0.35) 0%, #ffffff 70%);
        }
        .luxury-crest {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #d97706;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 6px;
        }
        .crest-icon {
          font-size: 18px;
        }
        .restaurant-title {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .menu-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #b45309;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 4px 0 14px 0;
        }
        .table-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          padding: 8px 30px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 16px;
          border: 1.5px solid #eab308;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
        }
        .table-badge span.num {
          font-size: 20px;
          color: #fde047;
          font-weight: 900;
        }
        .qr-frame {
          width: 76mm;
          height: 76mm;
          background: #ffffff;
          border: 2px solid #fde68a;
          border-radius: 24px;
          padding: 12px;
          margin: 0 auto 14px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(217, 119, 6, 0.12);
          position: relative;
        }
        .qr-frame img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          border-radius: 12px;
        }
        .instructions {
          margin-top: 2px;
        }
        .instructions h3 {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .instructions p {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          margin: 0;
          max-width: 110mm;
        }
        .steps-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #fef3c7;
        }
        .step-item {
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          color: #92400e;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .footer-note {
          margin-top: 12px;
          font-size: 11px;
          font-weight: 700;
          color: #b45309;
        }
        .secure-tag {
          margin-top: 4px;
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="stand-card">
        <div class="luxury-crest">
          ${stand.logoUrl ? `
            <img src="${stand.logoUrl}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid #eab308; margin-bottom: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);" alt="Logo" />
          ` : `
            <span>✦</span>
            <span class="crest-icon">🍽️</span>
            <span>✦</span>
          `}
        </div>

        <h1 class="restaurant-title">${stand.restaurantName || 'أهلاً وسهلاً بكم'}</h1>
        <div class="menu-subtitle">قائمة الطعام الرقمية والطلب المباشر</div>

        <div class="table-badge">
          <span>طاولة رقم</span>
          <span class="num">${stand.tableNumber}</span>
        </div>

        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="كود طاولة ${stand.tableNumber}" />
        </div>

        <div class="instructions">
          <h3>امسح الرمز لطلب طعامك مباشرة 📲</h3>
          <p>وجّه كاميرا هاتفك نحو الرمز لتصفح القائمة والطلب إلى طاولتك</p>
        </div>

        <div class="steps-container">
          <div class="step-item"><span>📷</span><span>١. وجّه الكاميرا</span></div>
          <div class="step-item"><span>🍔</span><span>٢. اختر وجبتك</span></div>
          <div class="step-item"><span>⚡</span><span>٣. طلبك يجهز فوراً</span></div>
        </div>

        <div class="footer-note">نتمنى لكم وقتاً ممتعاً ووجبة شهية ✨</div>
        <div class="secure-tag">🔒 رمز طلب مشفر ومعتمد للطاولة</div>
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
  logoUrl?: string;
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
        <div class="luxury-crest">
          ${stand.logoUrl ? `
            <img src="${stand.logoUrl}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid #eab308; margin-bottom: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);" alt="Logo" />
          ` : `
            <span>✦</span>
            <span class="crest-icon">🍽️</span>
            <span>✦</span>
          `}
        </div>

        <h1 class="restaurant-title">${stand.restaurantName || 'أهلاً وسهلاً بكم'}</h1>
        <div class="menu-subtitle">قائمة الطعام الرقمية والطلب المباشر</div>

        <div class="table-badge">
          <span>طاولة رقم</span>
          <span class="num">${stand.tableNumber}</span>
        </div>

        <div class="qr-frame">
          <img src="${stand.qrDataUrl}" alt="كود طاولة ${stand.tableNumber}" />
        </div>

        <div class="instructions">
          <h3>امسح الرمز لطلب طعامك مباشرة 📲</h3>
          <p>وجّه كاميرا هاتفك نحو الرمز لتصفح القائمة والطلب إلى طاولتك</p>
        </div>

        <div class="steps-container">
          <div class="step-item"><span>📷</span><span>١. وجّه الكاميرا</span></div>
          <div class="step-item"><span>🍔</span><span>٢. اختر وجبتك</span></div>
          <div class="step-item"><span>⚡</span><span>٣. طلبك يجهز فوراً</span></div>
        </div>

        <div class="footer-note">نتمنى لكم وقتاً ممتعاً ووجبة شهية ✨</div>
        <div class="secure-tag">🔒 رمز طلب مشفر ومعتمد للطاولة</div>
      </div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة بطاقات الطاولات الفاخرة</title>
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
          .stand-card { box-shadow: none !important; border: 2px solid #eab308 !important; }
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
          width: 132mm; background: #ffffff; border-radius: 28px; border: 2px solid #eab308;
          padding: 26px 22px 22px 22px; text-align: center; position: relative;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background-image: radial-gradient(circle at top, rgba(254, 243, 199, 0.35) 0%, #ffffff 70%);
        }
        .luxury-crest { display: flex; align-items: center; justify-content: center; gap: 6px; color: #d97706; font-size: 13px; font-weight: 800; letter-spacing: 2px; margin-bottom: 6px; }
        .crest-icon { font-size: 18px; }
        .restaurant-title { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; line-height: 1.2; }
        .menu-subtitle { font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0 14px 0; }
        .table-badge { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 8px 30px; border-radius: 999px; font-size: 15px; font-weight: 900; margin-bottom: 16px; border: 1.5px solid #eab308; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15); }
        .table-badge span.num { font-size: 20px; color: #fde047; font-weight: 900; }
        .qr-frame { width: 76mm; height: 76mm; background: #ffffff; border: 2px solid #fde68a; border-radius: 24px; padding: 12px; margin: 0 auto 14px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(217, 119, 6, 0.12); }
        .qr-frame img { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; }
        .instructions h3 { margin: 0 0 4px 0; font-size: 16px; font-weight: 900; color: #0f172a; }
        .instructions p { margin: 0; font-size: 12px; color: #64748b; font-weight: 600; max-width: 110mm; }
        .steps-container { display: flex; justify-content: center; gap: 8px; width: 100%; margin-top: 14px; padding-top: 12px; border-top: 1px solid #fef3c7; }
        .step-item { background: #fffbeb; border: 1px solid #fde68a; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; color: #92400e; display: flex; align-items: center; gap: 5px; }
        .footer-note { margin-top: 12px; font-size: 11px; font-weight: 700; color: #b45309; }
        .secure-tag { margin-top: 4px; font-size: 9px; font-weight: 600; color: #94a3b8; }
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
