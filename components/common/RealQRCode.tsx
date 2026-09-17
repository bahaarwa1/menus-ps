'use client';

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { Download, Check, Copy, Printer, Sparkles, Smartphone } from 'lucide-react';
import { printTableStand } from '@/lib/print-utils';

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

  // Strictly format the URL so smartphone cameras ALWAYS recognize it as an actionable web link:
  // 1) Must start with https://
  // 2) Point to the live public domain menus-ps.vercel.app
  // 3) Clean query parameters without invalid characters
  const sanitizedUrl = useMemo(() => {
    if (!value) return '';
    let url = value.trim();

    // If local, relative, or placeholder domain, route to the live production deployment
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('/') || url.includes('menus.ps') || url.includes('menus-ps.vercel.app')) {
      const match = url.match(/([?&].*)$/);
      const query = match ? match[1] : `?table=${tableNumber || 1}`;
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://menus.cool';
      url = `${base}/m${query.startsWith('?') ? query : `?${query}`}`;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Force https protocol so phone cameras immediately detect URI schema
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    return url;
  }, [value, tableNumber]);

  useEffect(() => {
    if (!sanitizedUrl) return;

    // Generate high-resolution, high-contrast QR code
    QRCode.toDataURL(sanitizedUrl, {
      width: Math.max(size * 2.5, 450), // Ultra crisp resolution for print and camera scanning
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
    if (!dataUrl) return;
    printTableStand({
      tableNumber: tableNumber || 1,
      restaurantName,
      qrDataUrl: dataUrl,
      targetUrl: sanitizedUrl
    });
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
          <Smartphone size={11} />
          <span>رابط مباشر فوري للكاميرا (HTTPS)</span>
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
            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all"
          >
            <Printer size={15} />
            <span>طباعة ستاند مميز مع الكركتر (طاولة {tableNumber || ''})</span>
            <Sparkles size={13} className="text-amber-200" />
          </button>
        </div>
      )}
    </div>
  );
}
