'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, MapPin, X } from 'lucide-react';
import { branches as initialBranches, BranchData } from '@/data/demo-data';

export default function BranchesPage() {
  const [branchesList, setBranchesList] = useState<BranchData[]>(initialBranches);
  const [activeBranchId, setActiveBranchId] = useState<string>('b1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', city: 'جنين', tables: '12' });

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) return;

    const b: BranchData = {
      id: `b-${Date.now()}`,
      name: newBranch.name,
      city: newBranch.city,
      tables: parseInt(newBranch.tables) || 10,
      todaySales: 0,
      todayOrders: 0
    };

    setBranchesList(prev => [...prev, b]);
    setIsModalOpen(false);
    setNewBranch({ name: '', city: 'جنين', tables: '12' });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans text-slate-800" dir="rtl">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">إدارة فروع المطعم</h1>
              <p className="text-xs text-slate-400">متابعة الأداء ومقارنة مبيعات الفروع من لوحة تحكم مركزية واحدة</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus size={16} />
          <span>+ إضافة فرع جديد</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branchesList.map(branch => {
          const isCurrentActive = branch.id === activeBranchId;

          return (
            <div
              key={branch.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                isCurrentActive ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{branch.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-orange-500" />
                      <span>{branch.city}</span>
                    </p>
                  </div>
                  {isCurrentActive ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                      الفرع الحالي النشط ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveBranchId(branch.id)}
                      className="text-[11px] font-bold text-orange-600 hover:bg-orange-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      التبديل إليه
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3 my-4 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400">مبيعات اليوم</p>
                    <p className="font-black text-slate-900 text-xs mt-0.5">{branch.todaySales} ₪</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">الطلبات</p>
                    <p className="font-black text-slate-900 text-xs mt-0.5">{branch.todayOrders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">الطاولات</p>
                    <p className="font-black text-slate-900 text-xs mt-0.5">{branch.tables}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">حالة الفرع: <strong className="text-emerald-600 font-bold">مفتوح الآن</strong></span>
                <span className="text-orange-600 font-bold">عرض تقرير الفرع ←</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Branch Modal */}
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
                <h3 className="text-lg font-black text-slate-900">إضافة فرع جديد للمطعم</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddBranch} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفرع *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فرع جنين — شارع الجامعة"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المدينة *</label>
                    <select
                      value={newBranch.city}
                      onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
                    >
                      <option value="جنين">جنين</option>
                      <option value="طولكرم">طولكرم</option>
                      <option value="بيت لحم">بيت لحم</option>
                      <option value="قلقيلية">قلقيلية</option>
                      <option value="أريحا">أريحا</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عدد الطاولات *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newBranch.tables}
                      onChange={(e) => setNewBranch({ ...newBranch, tables: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20"
                  >
                    حفظ وإضافة الفرع
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
