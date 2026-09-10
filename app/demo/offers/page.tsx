'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Plus, Tag, Trash2, Check, X, Percent, Calendar, Eye, EyeOff 
} from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  code: string;
  discount: string;
  type: 'percentage' | 'fixed';
  description: string;
  usesCount: number;
  active: boolean;
  expiresAt: string;
}

const initialOffers: Offer[] = [
  {
    id: 'o1',
    title: 'عرض الغداء الذهبي 🍔',
    code: 'LUNCH20',
    discount: '20%',
    type: 'percentage',
    description: 'خصم 20% على جميع وجبات البرغر من الساعة 12:00 حتى 4:00 مساءً',
    usesCount: 142,
    active: true,
    expiresAt: '2026-10-31'
  },
  {
    id: 'o2',
    title: 'كومبو نهاية الأسبوع 🔥',
    code: 'WEEKEND15',
    discount: '15 ₪',
    type: 'fixed',
    description: 'وفر 15 شيكل عند طلب وجبتين دبل سماش مع تشيز فرايز',
    usesCount: 89,
    active: true,
    expiresAt: '2026-09-30'
  },
  {
    id: 'o3',
    title: 'مشروب مجاني مع كل راب 🥤',
    code: 'FREEDRINK',
    discount: '100%',
    type: 'percentage',
    description: 'احصل على مشروب كولا أو مياه مجانية عند طلب أي راب عجل أو دجاج',
    usesCount: 215,
    active: false,
    expiresAt: '2026-08-31'
  }
];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const toggleOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));
  };

  const deleteOffer = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      setOffers(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode || !newDiscount) return;

    const offer: Offer = {
      id: `offer-${Date.now()}`,
      title: newTitle,
      code: newCode.toUpperCase(),
      discount: newDiscount,
      type: newDiscount.includes('%') ? 'percentage' : 'fixed',
      description: newDesc,
      usesCount: 0,
      active: true,
      expiresAt: '2026-12-31'
    };

    setOffers(prev => [offer, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewCode('');
    setNewDiscount('');
    setNewDesc('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans text-slate-800" dir="rtl">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
              <Gift size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">العروض والخصومات الخاصة</h1>
              <p className="text-xs text-slate-400">إنشاء كوبونات ترويجية وعروض لزيادة زيارات الزبائن</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus size={16} />
          <span>+ إنشاء عرض جديد</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map(offer => (
          <div
            key={offer.id}
            className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
              offer.active ? 'border-slate-200/80' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-black text-slate-900 text-base">{offer.title}</h3>
                <span className="bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-1 rounded-xl shrink-0">
                  {offer.discount}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {offer.description}
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400 font-medium">كود الخصم:</span>
                <span className="font-mono font-black text-slate-900 text-xs tracking-wider bg-white px-2 py-1 rounded-lg border border-slate-200">
                  {offer.code}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
                <span>تم الاستخدام: <strong className="text-slate-800 font-bold">{offer.usesCount} مرة</strong></span>
                <span className="flex items-center gap-1"><Calendar size={13} /> {offer.expiresAt}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => toggleOffer(offer.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  offer.active
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {offer.active ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{offer.active ? 'العرض نشط' : 'متوقف'}</span>
              </button>

              <button
                onClick={() => deleteOffer(offer.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="حذف"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Offer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl z-10 border border-slate-100 text-right"
            >
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">إنشاء عرض أو كوبون جديد</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddOffer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العرض *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خصم افتتاح فرع جديد"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كود الخصم *</label>
                    <input
                      type="text"
                      required
                      placeholder="OPEN25"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 font-mono text-slate-800 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">قيمة الخصم *</label>
                    <input
                      type="text"
                      required
                      placeholder="25% أو 20 ₪"
                      value={newDiscount}
                      onChange={(e) => setNewDiscount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شرح وتفاصيل العرض</label>
                  <textarea
                    rows={2}
                    placeholder="شرح شروط العرض والوجبات المشمولة..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20"
                  >
                    حفظ ونشر العرض
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
