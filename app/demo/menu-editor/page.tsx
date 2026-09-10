'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, Plus, Search, Edit3, Trash2, Check, X, 
  Eye, EyeOff, RotateCcw
} from 'lucide-react';
import { menuItems as initialMenuItems, categories as initialCategories, MenuItem } from '@/data/demo-data';

export default function MenuEditorPage() {
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'burgers',
    price: '',
    description: '',
    imageUrl: '',
    popular: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle item availability & sync with backend cache
  const toggleItemAvailability = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const isOutOfStock = !(item as any).isOutOfStock;
        showToast(isOutOfStock ? `تم تحديد "${item.name}" كـ (غير متوفر حالياً)` : `تم تحديد "${item.name}" كـ (متوفر للطلب)`);
        fetch('/api/v1/menu/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: id, isAvailable: !isOutOfStock })
        }).catch(() => {});
        return { ...item, isOutOfStock };
      }
      return item;
    }));
  };

  // Delete item
  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من رغبتك بحذف "${name}" من القائمة؟`)) {
      setItems(prev => prev.filter(i => i.id !== id));
      showToast(`تم حذف "${name}" بنجاح.`);
    }
  };

  // Open modal for new or existing item
  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        description: item.description,
        imageUrl: item.imageUrl || '',
        popular: !!item.popular
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: categories[0]?.id || 'burgers',
        price: '',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        popular: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    if (editingItem) {
      // Update & sync backend cache
      fetch('/api/v1/menu/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingItem.id,
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
        })
      }).catch(() => {});

      setItems(prev => prev.map(i => {
        if (i.id === editingItem.id) {
          return {
            ...i,
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            description: formData.description,
            imageUrl: formData.imageUrl,
            popular: formData.popular
          };
        }
        return i;
      }));
      showToast(`تم تحديث "${formData.name}" وتحديث الذاكرة المخبأة بنجاح!`);
    } else {
      // Create
      const newItem: MenuItem = {
        id: `custom-${Date.now()}`,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        image: '🍽️',
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        popular: formData.popular
      };
      setItems(prev => [newItem, ...prev]);
      showToast(`تم إضافة صنف جديد "${formData.name}" للقائمة!`);
    }

    setIsModalOpen(false);
  };

  // Filtered items
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans text-slate-800" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-slate-700"
          >
            <Check size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">تعديل وإدارة قائمة الطعام (المنيو)</h1>
              <p className="text-xs text-slate-400">إضافة أطباق جديدة، تعديل الأسعار، وتحديد الأصناف المتوفرة فورياً</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal()}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus size={16} />
            <span>+ إضافة طبق جديد</span>
          </button>

          <button
            onClick={() => setItems(initialMenuItems)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
            title="استرجاع القائمة الافتراضية"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Categories Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">
                ({items.filter(i => i.category === cat.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المكونات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400">
            <UtensilsCrossed size={40} className="mx-auto mb-2 opacity-30" />
            <p className="font-bold text-slate-700 text-sm">لا توجد أطباق مطابقة للبحث</p>
            <p className="text-xs text-slate-400 mt-1">جرّب اختيار قسم آخر أو إضافة طبق جديد</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOutOfStock = !!(item as any).isOutOfStock;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                  isOutOfStock ? 'border-rose-200 bg-rose-50/20 opacity-80' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Photo & Badge */}
                  <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 mb-3">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className={`w-full h-full object-cover transition-transform duration-300 ${isOutOfStock ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-orange-50">
                        {item.image}
                      </div>
                    )}

                    {item.popular && (
                      <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        مميز 🔥
                      </span>
                    )}

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-rose-900/60 backdrop-blur-2xs flex items-center justify-center">
                        <span className="bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                          نفدت الكمية ✕
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-extrabold text-slate-900 text-sm">{item.name}</h3>
                    <span className="font-black text-orange-600 text-sm shrink-0">{item.price} ₪</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                {/* Actions Strip */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleItemAvailability(item.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {isOutOfStock ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{isOutOfStock ? 'غير متوفر' : 'متوفر للطلب'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                      title="تعديل بيانات الطبق"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="حذف من القائمة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Item Modal */}
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl z-10 border border-slate-100 max-h-[90vh] overflow-y-auto text-right"
            >
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">
                  {editingItem ? 'تعديل بيانات الطبق' : 'إضافة طبق جديد للمنيو'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف أو الوجبة *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: تربل تشيز برغر"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">القسم / التصنيف *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">السعر (₪) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="مثال: 38"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والمكونات</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="مثال: لحم بقر طازج مشوي مع صوص خاص وخس وجبنة شيدر..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة الطبق (URL)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={formData.imageUrl} alt="معاينة" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="popularCheck"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <label htmlFor="popularCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    تمييز الصنف كصنف شائع أو الأكثر طلباً 🔥
                  </label>
                </div>

                <div className="pt-4 flex gap-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 transition-all"
                  >
                    {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف للقائمة'}
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
