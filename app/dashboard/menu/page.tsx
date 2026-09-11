'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Trash2, X, Search, Flame, Utensils, RefreshCw, 
  Edit3, Loader2, UploadCloud, Image as ImageIcon, Link as LinkIcon, 
  Check, Sparkles, AlertCircle
} from 'lucide-react';

interface MenuItemType {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  available: boolean;
  popular?: boolean;
  spicy?: boolean;
}

const FOOD_PRESETS = [
  { name: 'برجر لحم فاخر', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { name: 'بيتزا إيطالية', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { name: 'شاورما وساندوتش', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80' },
  { name: 'دجاج مقرمش / كريسبي', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80' },
  { name: 'ستيك ومشاوي', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { name: 'بطاطا مقلية مقرمشة', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80' },
  { name: 'سلطة خضراء طازجة', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' },
  { name: 'باستا ومعكرونة', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80' },
  { name: 'مشروبات باردة وعصائر', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
  { name: 'قهوة ساخنة مميزة', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
  { name: 'حلويات وكيك', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80' },
  { name: 'فطور شرقي منوع', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80' },
];

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
  const [newImage, setNewImage] = useState('');
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [showPresetsNew, setShowPresetsNew] = useState(false);

  // Form State for Editing Existing Item
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPopular, setEditPopular] = useState(false);
  const [editSpicy, setEditSpicy] = useState(false);
  const [editImage, setEditImage] = useState('');
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const [showPresetsEdit, setShowPresetsEdit] = useState(false);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  const fileInputNewRef = useRef<HTMLInputElement>(null);
  const fileInputEditRef = useRef<HTMLInputElement>(null);

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
                image: it.image || it.image_url || undefined,
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
    loadMenu();

    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        const slug = data.user?.restaurantSlug || '';
        if (slug) setCurrentSlug(slug);
      })
      .catch(() => {});
  }, [loadMenu]);

  // Upload image handler
  const handleUploadFile = async (
    file: File, 
    setImageFn: (url: string) => void, 
    setUploadingFn: (val: boolean) => void
  ) => {
    setUploadingFn(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImageFn(data.url);
      } else {
        alert(data.error || 'فشل رفع الصورة، يرجى المحاولة بصيغة أخرى');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('حدث خطأ في الاتصال أثناء رفع الصورة');
    } finally {
      setUploadingFn(false);
    }
  };

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
          imageUrl: newImage.trim() || undefined,
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
        setNewImage('');
        setNewPopular(false);
        setNewSpicy(false);
        setShowPresetsNew(false);
      } else {
        alert(data.error || 'فشل حفظ الصنف');
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      alert('حدث خطأ أثناء حفظ الصنف');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: MenuItemType) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDescription(item.description);
    setEditImage(item.image || '');
    setEditPopular(Boolean(item.popular));
    setEditSpicy(Boolean(item.spicy));
    setShowPresetsEdit(false);
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
          imageUrl: editImage.trim() || undefined,
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
                  image: editImage.trim() || undefined,
                  popular: editPopular,
                  spicy: editSpicy,
                }
              : it
          )
        );
        setEditingItem(null);
      } else {
        alert(data.error || 'فشل تحديث الصنف');
      }
    } catch (err) {
      console.error('Failed to update menu item:', err);
      alert('حدث خطأ أثناء تحديث الصنف');
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة قائمة الطعام والأطباق</h1>
          <p className="text-xs text-slate-500 mt-1">أضف الأطباق، صور الوجبات، الأسعار، وحالة التوفر مع تحديث لحظي على جوالات الزبائن</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadMenu(currentSlug)}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="تحديث المنيو"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-orange-500' : 'text-slate-500'} />
            <span>تحديث</span>
          </button>

          <button
            onClick={() => {
              setNewName('');
              setNewPrice('');
              setNewDescription('');
              setNewImage('');
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            <span>إضافة طبق وصورة جديدة</span>
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
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
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

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="بحث في الأطباق والوجبات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
          />
          <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Menu Items Grid or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400 font-medium">
          <Loader2 size={24} className="animate-spin text-orange-500 mx-auto mb-2" />
          <span>جاري تحميل قائمة الطعام...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4 border border-orange-100">
            <Utensils size={32} />
          </div>
          <h3 className="font-black text-slate-900 text-base mb-1">
            {items.length === 0 ? 'قائمتك فارغة — ابدأ بإضافة أطباقك الآن' : 'لا توجد أطباق تطابق هذا البحث'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            {items.length === 0
              ? 'أضف وجباتك مع الصور المميزة والأسعار لتظهر فوراً لزبائنك عند مسح كود الطاولة.'
              : 'جرّب تغيير التصنيف أو مسح كلمة البحث لرؤية كل الأصناف.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer hover:scale-105"
            >
              <Plus size={16} />
              <span>إضافة أول طبق مع الصورة</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all group ${
                !item.available ? 'opacity-60 bg-slate-50/70 border-slate-200' : 'hover:shadow-md hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  {/* Item Image Display */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative shadow-2xs">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <ImageIcon size={20} className="mb-0.5 opacity-60" />
                        <span className="text-[9px] font-bold">بدون صورة</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-black text-sm text-slate-900 truncate">{item.name}</h3>
                      <span className="font-mono font-black text-sm text-orange-600 shrink-0">
                        {item.price} ₪
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {item.popular && (
                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 text-[10px] font-bold flex items-center gap-0.5">
                          <Flame size={10} className="text-orange-500" />
                          <span>الأكثر طلباً</span>
                        </span>
                      )}
                      {item.spicy && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                          🌶️ حار
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description || 'لا يوجد وصف مضاف لهذا الطبق.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => toggleAvailability(item.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    item.available
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {item.available ? 'متاح للطلب' : 'غير متوفر (نفد)'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                    title="تعديل الصنف والصورة"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف الصنف من المنيو"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================
          ADD NEW ITEM MODAL (WITH IMAGE UPLOAD + PRESETS)
      ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Utensils size={18} className="text-orange-500" />
                <span>إضافة طبق جديد للمنيو</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              
              {/* IMAGE SELECTION & UPLOAD SECTION */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  صورة الطبق (رفع من جهازك أو اختيار صورة جاهزة)
                </label>

                {newImage ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2 group">
                    <img src={newImage} alt="معاينة" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputNewRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-slate-100"
                      >
                        تغيير الصورة
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImage('')}
                        className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-rose-700"
                      >
                        إزالة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl p-4 text-center bg-slate-50/50 transition-colors">
                    {isUploadingNew ? (
                      <div className="py-4 flex flex-col items-center gap-2 text-orange-600">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="font-bold text-xs">جاري رفع الصورة إلى سحابة التخزين...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputNewRef.current?.click()}
                            className="px-4 py-2 bg-white border border-slate-300 hover:border-orange-500 hover:text-orange-600 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <UploadCloud size={16} />
                            <span>رفع صورة من جهازك</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPresetsNew(!showPresetsNew)}
                            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles size={15} />
                            <span>صور أطباق جاهزة</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">يدعم صيغ JPG, PNG, WEBP حتى 6 ميغابايت</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputNewRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file, setNewImage, setIsUploadingNew);
                  }}
                />

                {/* Preset Picker Dropdown */}
                {showPresetsNew && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="text-[11px] font-bold text-slate-600">اختر صورة مناسبة لطبقك بنقرة واحدة:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {FOOD_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewImage(preset.url);
                            setShowPresetsNew(false);
                          }}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-orange-500 aspect-square cursor-pointer"
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 text-center truncate font-bold">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct URL input fallback */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="أو الصق رابط صورة مباشر هنا (اختياري)..."
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Dish Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الصنف / الوجبة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شاورما عربي دبل، برجر كلاسيك"
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
                    placeholder="مثال: الأطباق الرئيسية، سناك"
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
                  placeholder="مكونات الوجبة، نوع اللحم، الصوصات الإضافية..."
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر في المنيو'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT EXISTING ITEM MODAL (WITH IMAGE UPLOAD + PRESETS)
      ============================================================ */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-orange-500" />
                <h2 className="text-base font-black text-slate-900">تعديل بيانات وصورة الطبق</h2>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditItem} className="space-y-4 text-xs">
              {/* IMAGE EDIT SECTION */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  صورة الطبق
                </label>

                {editImage ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2 group">
                    <img src={editImage} alt="معاينة" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputEditRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-slate-100"
                      >
                        استبدال الصورة
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImage('')}
                        className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-rose-700"
                      >
                        حذف الصورة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl p-4 text-center bg-slate-50/50 transition-colors">
                    {isUploadingEdit ? (
                      <div className="py-4 flex flex-col items-center gap-2 text-orange-600">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="font-bold text-xs">جاري رفع الصورة الجديدة...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputEditRef.current?.click()}
                            className="px-4 py-2 bg-white border border-slate-300 hover:border-orange-500 hover:text-orange-600 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <UploadCloud size={16} />
                            <span>رفع صورة من جهازك</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPresetsEdit(!showPresetsEdit)}
                            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles size={15} />
                            <span>صور أطباق جاهزة</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">يدعم صيغ JPG, PNG, WEBP حتى 6 ميغابايت</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputEditRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file, setEditImage, setIsUploadingEdit);
                  }}
                />

                {/* Preset Picker Dropdown */}
                {showPresetsEdit && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="text-[11px] font-bold text-slate-600">اختر صورة مناسبة لطبقك:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {FOOD_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditImage(preset.url);
                            setShowPresetsEdit(false);
                          }}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-orange-500 aspect-square cursor-pointer"
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 text-center truncate font-bold">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct URL input fallback */}
                <div className="mt-2">
                  <input
                    type="url"
                    placeholder="رابط الصورة المباشر..."
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

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
