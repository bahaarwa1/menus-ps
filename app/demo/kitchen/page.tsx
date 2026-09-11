'use client';

import Link from 'next/link';
import { ChefHat, ExternalLink, Info } from 'lucide-react';
import OrdersManagementPage from '@/app/demo/orders/page';

export default function KitchenDemoPage() {
  return (
    <div className="space-y-3">
      {/* Demo Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">هذه بيانات تجريبية للعرض فقط</p>
            <p className="text-xs text-amber-700 mt-0.5">
              شاشة المطبخ الحقيقية المرتبطة بمطعمك وقاعدة بياناتك هي صفحة <strong>KDS المطبخ</strong> — تدخل عليها بكود PIN الموظف.
            </p>
          </div>
        </div>
        <Link
          href="/staff"
          target="_blank"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
        >
          <ChefHat size={14} />
          <span>فتح المطبخ الحقيقي KDS</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Demo Orders UI */}
      <OrdersManagementPage />
    </div>
  );
}
