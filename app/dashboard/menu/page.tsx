'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Search, Flame, Utensils, RefreshCw, Edit3, Loader2 } from 'lucide-react';

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
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([
    { id: 'all', name: 'كل الأصناف', icon: '🍽️' },
  ]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Adding New Item
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('الأطباق الرئيسية');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPopular, setNewPopular] = useState(false);
  const [newSpicy, setNewSpicy] = useState(false);

  // Form State for Editing Existing Item
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPopular, setEditPopular] = useState(false);
  const [editSpicy, setEditSpicy] = useState(false);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  const loadMenu = useCallback(async (slug?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/menu${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`);
      const data = await res.json();
      if (data.categories && Array.isArray(data.categories)) {
        const loadedItems: MenuItemType[] = [];
        const dynamicCats = [{ id: 'all', name: 'كل الأصناف', icon: '🍽️' }];

        data.categories.forEach((cat: any) => {
          dynamicCats.push({
            id: cat.id || cat.name,
            name: cat.name,
            icon: cat.icon || '🍽️',
          });

          if (Array.isArray(cat.items)) {
            cat.items.forEach((it: any) => {
              loadedItems.push({
                id: it.id,
                name: it.name,
                category: cat.id || cat.name,
                price: Number(it.price) || 0,
                description: it.description || '',
                available: it.available !== false,
                popular: Boolean(it.popular),
                spicy: Boolean(it.spicy),
              });
            });
          }
        });

        setCategories(dynamicCats);
        setItems(loadedItems);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fire menu fetch immediately on mount
    loadMenu();

    // Concurrently cache currentSlug if needed
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        const slug = data.user?.restaurantSlug || '';
        if (slug) setCurrentSlug(slug);
      })
      .catch(() => {});
  }, [loadMenu]);

  const toggleAvailability = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const newAvail = !item.available;

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, available: newAvail } : it))
    );

    try {
      await fetch('/api/v1/menu/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, isAvailable: newAvail }),
      });
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف من المنيو؟')) return;

    setItems((prev) => prev.filter((it) => it.id !== id));

    try {
      await fetch('/api/v1/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      });
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/v1/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          price: parseFloat(newPrice),
          description: newDescription.trim(),
          categoryName: newCategory,
          isPopular: newPopular,
          isSpicy: newSpicy,
          slug: currentSlug,
        }),
      });

      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => [data.item, ...prev]);
        setIsModalOpen(false);

        // Reset Form
        setNewName('');
        setNewPrice('');
        setNewDescription('');
        setNewPopular(false);
        setNewSpicy(false);
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: MenuItemType) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDescription(item.description);
    setEditPopular(Boolean(item.popular));
    setEditSpicy(Boolean(item.spicy));
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim() || !editPrice) return;
    setIsEditingSaving(true);

    try {
      const res = await fetch('/api/v1/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingItem.id,
          name: editName.trim(),
          price: parseFloat(editPrice),
          description: editDescription.trim(),
          isPopular: editPopular,
          isSpicy: editSpicy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? {
                  ...it,
                  name: editName.trim(),
                  price: parseFloat(editPrice),
                  description: editDescription.trim(),
                  popular: editPopular,
                  spicy: editSpicy,
                }
              : it
          )
        );
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Failed to update menu item:', err);
    } finally {
      setIsEditingSaving(false);
    }
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
          <p className="text-xs text-slate-500 mt-1">تعديل الأطباق، الأسعار، وإتاحة الأصناف فورياً للزبائن في قاعدة البيانات</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMenu(currentSlug)}
            disabled={isLoading}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="تحديث المنيو"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-orange-500' : 'text-slate-500'} />
            <span>تحديث</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
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
                    ? 'bg-slate-900 text-white shadow-sm'
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
            placeholder="بحث في المنيو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Menu Items Grid or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400 font-medium">
          جاري تحميل قائمة الطعام الحقيقية...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <Utensils size={32} />
          </div>
          <h3 className="font-black text-slate-900 text-base mb-1">
            {items.length === 0 ? 'لا توجد أصناف في قائمتك بعد' : 'لا توجد أصناف تطابق هذا البحث'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            {items.length === 0
              ? 'أضف وجبات وأطباق مطعمك الأولى مع الأسعار والوصف لتظهر مباشرة على هواتف الزبائن عند مسح الباركود.'
              : 'جرّب تغيير التصنيف أو مسح كلمة البحث لرؤية كل الأصناف.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>إضافة أول طبق الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                !item.available ? 'opacity-60 bg-slate-50/50' : 'hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-black text-sm text-slate-900">{item.name}</h3>
                    {item.popular && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 text-[10px] font-black">
                        الأكثر طلباً
                      </span>
                    )}
                    {item.spicy && (
                      <span className="text-rose-500 flex items-center" title="حار">
                        <Flame size={12} />
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-sm text-orange-600 shrink-0">
                    {item.price} ₪
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {item.description || 'لا يوجد وصف مضاف لهذا الصنف.'}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      item.available
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {item.available ? 'متاح للطلب' : 'نفذت الكمية'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                    title="تعديل الصنف والسعر"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف الصنف من المنيو"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">إضافة صنف جديد للمنيو</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الصنف / الوجبة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شاورما عربي دبل"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر (₪) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="25"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم</label>
                  <input
                    type="text"
                    placeholder="مثال: الوجبات الرئيسية"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف والمكونات</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر لمكونات الطبق والصلصات..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newPopular}
                    onChange={(e) => setNewPopular(e.target.checked)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>تمييز كـ (الأكثر طلباً)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newSpicy}
                    onChange={(e) => setNewSpicy(e.target.checked)}
                    className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span>وجبة حارة 🌶️</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ الصنف في المنيو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-orange-500" />
                <h2 className="text-base font-black text-slate-900">تعديل الصنف والسعر</h2>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الصنف / الوجبة *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">السعر (₪) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف والمكونات</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editPopular}
                    onChange={(e) => setEditPopular(e.target.checked)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>الأكثر طلباً</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editSpicy}
                    onChange={(e) => setEditSpicy(e.target.checked)}
                    className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span>وجبة حارة 🌶️</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isEditingSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isEditingSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>{isEditingSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
