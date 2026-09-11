'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Check, Copy } from 'lucide-react';

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

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for retina crispiness
      margin: 2,
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H' // High error correction level allows center logo or phone scanning easily
    })
      .then((url) => {
        setDataUrl(url);
        setError('');
      })
      .catch((err) => {
        console.error('QR Generation failed:', err);
        setError('تعذر توليد كود الـ QR');
      });
  }, [value, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `table-${tableNumber || 'menu'}-qrcode.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR Container */}
      <div 
        className="relative bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        {dataUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={dataUrl} 
              alt={`QR Code طاولة ${tableNumber || ''}`}
              className="w-full h-full object-contain rounded-lg"
            />
            
            {/* Center Brand Badge (Standard on modern restaurant QR stands) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                BH
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-xs text-rose-500 text-center font-bold">{error}</div>
        ) : (
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Target Link Info */}
      <div className="mt-2.5 text-center max-w-[260px]">
        <p className="text-[11px] font-mono text-slate-500 truncate dir-ltr">
          {value}
        </p>
      </div>

      {/* Optional Quick Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200"
          >
            <Download size={14} />
            <span>تحميل الصورة (PNG)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border border-slate-200"
            title="نسخ الرابط"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
