'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, Search, Flame } from 'lucide-react';

interface MenuItemType {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  popular?: boolean;
  spicy?: boolean;
}

export default function ProductionMenuPage() {
  const categories = [
    { id: 'all', name: 'كل الأصناف', icon: '🍽️' },
    { id: 'burgers', name: 'البرجر والساندويش', icon: '🍔' },
    { id: 'pizza', name: 'البيتزا والمعجنات', icon: '🍕' },
    { id: 'sides', name: 'المقبلات والبطاطا', icon: '🍟' },
    { id: 'drinks', name: 'المشروبات والعصائر', icon: '🥤' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Menu Items
  const [items, setItems] = useState<MenuItemType[]>([
    {
      id: 'item-1',
      name: 'برجر كلاسيك بيف فاخر',
      category: 'burgers',
      price: 35,
      description: 'شريحة لحم بقري أنجوس طازجة 180 غم مع جبنة شيدر صوص خاص وخس ومخلل.',
      available: true,
      popular: true,
    },
    {
      id: 'item-2',
      name: 'برجر دجاج كرسبي سبايسي',
      category: 'burgers',
      price: 32,
      description: 'صدر دجاج مقرمش متبل بخلطة حارة مع صوص الرانش وخس كولسلو.',
      available: true,
      popular: true,
      spicy: true,
    },
    {
      id: 'item-3',
      name: 'بيتزا مارجريتا إيطالية',
      category: 'pizza',
      price: 45,
      description: 'صلصة طماطم سان مارزانو، جبنة موزاريلا طازجة، ريحان وزيت زيتون.',
      available: true,
    },
    {
      id: 'item-4',
      name: 'بطاطا مقلية بالبهارات',
      category: 'sides',
      price: 14,
      description: 'بطاطا مقلية ذهبية مقرمشة متبلة ببهارات المطعم الخاصة.',
      available: true,
    },
    {
      id: 'item-5',
      name: 'عصير برتقال طبيعي طازج',
      category: 'drinks',
      price: 12,
      description: 'عصير برتقال طبيعي معصور يومياً بدون سكر مضاف.',
      available: true,
    },
  ]);

  // Form State for Adding New Item
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('burgers');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPopular, setNewPopular] = useState(false);
  const [newSpicy, setNewSpicy] = useState(false);

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, available: !it.available } : it))
    );
  };

  const deleteItem = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف من المنيو؟')) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    const newItem: MenuItemType = {
      id: `item-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice),
      description: newDescription.trim(),
      available: true,
      popular: newPopular,
      spicy: newSpicy,
    };

    setItems((prev) => [newItem, ...prev]);
    setIsModalOpen(false);

    // Reset Form
    setNewName('');
    setNewPrice('');
    setNewDescription('');
    setNewPopular(false);
    setNewSpicy(false);
  };

  const filteredItems = items.filter((it) => {
    if (activeCategory !== 'all' && it.category !== activeCategory) return false;
    if (searchQuery && !it.name.includes(searchQuery) && !it.description.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة قائمة الطعام (المنيو)</h1>
          <p className="text-xs text-slate-500 mt-1">تعديل الأطباق، الأسعار، وإتاحة الأصناف فورياً للزبائن على الهواتف</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>إضافة طبق جديد للمنيو</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="ابحث عن طبق أو وجبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
              item.available ? 'border-slate-200/80 hover:shadow-md' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
            }`}
          >
            <div>
              {/* Item Badges */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {item.popular && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame size={10} className="text-amber-500" /> الأكثر طلباً
                    </span>
                  )}
                  {item.spicy && (
                    <span className="text-xs" title="حار">🌶️</span>
                  )}
                </div>

                {/* Availability Toggle */}
                <button
                  onClick={() => toggleAvailability(item.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                    item.available
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                  title="انقر لتغيير التوفر"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span>{item.available ? 'متاح للطلب' : 'نفد من المطبخ'}</span>
                </button>
              </div>

              {/* Title & Price */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-black text-sm text-slate-900 leading-snug">{item.name}</h3>
                <span className="font-black text-sm text-orange-600 font-mono shrink-0">{item.price} ₪</span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {item.description}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                القسم: {categories.find((c) => c.id === item.category)?.name || item.category}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف الصنف"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 text-right">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">إضافة طبق أو وجبة جديدة للمنيو</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطبق / الوجبة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: برجر مشروم سويس"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم والتصنيف</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="burgers">البرجر والساندويش</option>
                    <option value="pizza">البيتزا والمعجنات</option>
                    <option value="sides">المقبلات والبطاطا</option>
                    <option value="drinks">المشروبات والعصائر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر بالشيكل (₪)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="35"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والمكونات</label>
                <textarea
                  rows={3}
                  placeholder="اكتب مكونات الوجبة لجذب الزبائن..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPopular}
                    onChange={(e) => setNewPopular(e.target.checked)}
                    className="accent-orange-500 rounded"
                  />
                  <span>تمييز كـ &quot;الأكثر طلباً&quot; 🔥</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSpicy}
                    onChange={(e) => setNewSpicy(e.target.checked)}
                    className="accent-orange-500 rounded"
                  />
                  <span>طبق حار / سبايسي 🌶️</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20"
                >
                  حفظ وإضافة للمنيو فوراً 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
