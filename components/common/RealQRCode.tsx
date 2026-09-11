'use client';

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { Download, Check, Copy, Printer } from 'lucide-react';

interface RealQRCodeProps {
  value: string;
  size?: number;
  tableNumber?: number;
  restaurantName?: string;
  showActions?: boolean;
  className?: string;
}

export default function RealQRCode({
  value,
  size = 220,
  tableNumber,
  restaurantName = 'Burger House نابلس',
  showActions = false,
  className = ''
}: RealQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Strictly sanitize the URL so phones ALWAYS recognize it as an actionable web link:
  // 1) Must start with https://
  // 2) Never localhost (which phones reject or classify as text)
  // 3) Complete and valid TLD
  const sanitizedUrl = useMemo(() => {
    if (!value) return '';
    let url = value.trim();

    // If local or relative, route to live production deployment
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('/')) {
      const match = url.match(/([?&].*)$/);
      const query = match ? match[1] : `?table=${tableNumber || 1}`;
      url = `https://menus-ps.vercel.app/m${query.startsWith('?') ? query : `?${query}`}`;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Force https protocol so phone cameras immediately detect URI schema
    if (url.startsWith('http://') && !url.includes('localhost')) {
      url = url.replace('http://', 'https://');
    }

    return url;
  }, [value, tableNumber]);

  useEffect(() => {
    if (!sanitizedUrl) return;

    // Generate high-resolution, high-contrast QR code
    QRCode.toDataURL(sanitizedUrl, {
      width: size * 2.5, // Ultra crisp resolution for print and camera scanning
      margin: 1, // Compact clean white border
      color: {
        dark: '#000000', // Pure black for 100% camera contrast
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M' // Standard medium error correction (optimum for smartphone cameras)
    })
      .then((url) => {
        setDataUrl(url);
        setError('');
      })
      .catch((err) => {
        console.error('QR Generation error:', err);
        setError('تعذر توليد كود الـ QR');
      });
  }, [sanitizedUrl, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `table-${tableNumber || 'menu'}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(sanitizedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintStand = () => {
    document.body.classList.add('printable-stand-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printable-stand-mode');
    }, 1000);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 1. On-Screen Display Container */}
      <div 
        className="relative bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        {dataUrl ? (
          <div className="relative w-full h-full flex items-center justify-center bg-white">
            {/* Pure unobstructed QR code - Guaranteed to trigger URL detection on iOS & Android */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={dataUrl} 
              alt={`QR Code طاولة ${tableNumber || ''}`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : error ? (
          <div className="text-xs text-rose-500 text-center font-bold">{error}</div>
        ) : (
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Target Link Information */}
      <div className="mt-2.5 text-center max-w-[280px]">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold mb-1">
          <span>✓ رابط ويب مباشر (HTTPS)</span>
        </div>
        <p className="text-[11px] font-mono text-slate-600 truncate dir-ltr font-semibold">
          {sanitizedUrl}
        </p>
      </div>

      {/* Optional Quick Actions Bar */}
      {showActions && (
        <div className="flex flex-col gap-2 mt-3 w-full">
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleDownload}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200"
            >
              <Download size={14} />
              <span>تحميل PNG</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border border-slate-200 shrink-0"
              title="نسخ الرابط"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>

          <button
            onClick={handlePrintStand}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Printer size={15} />
            <span>طباعة ستاند طاولة {tableNumber || ''}</span>
          </button>
        </div>
      )}

      {/* 2. Hidden Dedicated Print Stand Layout (Used ONLY when printing) */}
      <div id="printable-qr-stand" className="hidden">
        <div className="w-[120mm] border-4 border-slate-900 rounded-3xl p-8 text-center bg-white flex flex-col items-center justify-between mx-auto my-auto shadow-none">
          
          {/* Stand Header */}
          <div className="mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-xl flex items-center justify-center mx-auto mb-2 border-2 border-slate-900">
              BH
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">{restaurantName}</h1>
            <div className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white font-black text-sm">
              طاولة رقم {tableNumber || 1}
            </div>
          </div>

          {/* Large Sharp QR Code for table stand */}
          <div className="w-56 h-56 p-2 bg-white border-2 border-slate-300 rounded-2xl my-2 flex items-center justify-center">
            {dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={dataUrl} 
                alt={`كود طاولة ${tableNumber || 1}`} 
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 space-y-1">
            <h2 className="text-lg font-black text-slate-900">امسح الكود لطلب الطعام والدفع</h2>
            <p className="text-xs text-slate-600 font-bold">
              افتح كاميرا جوالك ووجّهها نحو الكود لتصفح المنيو فوراً
            </p>
            <p className="text-[10px] font-mono text-slate-400 dir-ltr pt-2">
              {sanitizedUrl}
            </p>
          </div>

          {/* Stand Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>نتمنى لكم وجبة شهية! ✨</span>
            <span>بواسطة Menus.ps</span>
          </div>

        </div>
      </div>

    </div>
  );
}
