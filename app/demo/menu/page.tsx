'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, X, Check, ChevronRight } from 'lucide-react';
import { menuItems, categories, upsellRules } from '@/data/demo-data';

export default function CustomerMenuDemo() {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || 'burgers');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showUpsell, setShowUpsell] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<any>({});
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Calculate item price
  const calculateItemPrice = () => {
    if (!selectedItem) return 0;
    let price = selectedItem.price;
    selectedExtras.forEach(extraName => {
      const extra = selectedItem.extras?.find((e: any) => e.name === extraName);
      if (extra) price += extra.price;
    });
    return price * itemQuantity;
  };

  const handleAddToCart = () => {
    const newItem = {
      id: Math.random().toString(),
      item: selectedItem,
      quantity: itemQuantity,
      customizations: selectedCustomizations,
      extras: selectedExtras,
      totalPrice: calculateItemPrice()
    };
    
    setCart([...cart, newItem]);
    
    // Check for upsell - upsellRules is Record<string, string[]> keyed by category
    const suggestedIds = upsellRules[selectedItem.category];
    setSelectedItem(null);
    setItemQuantity(1);
    setSelectedCustomizations({});
    setSelectedExtras([]);

    if (suggestedIds && suggestedIds.length > 0) {
      const suggestedItems = menuItems.filter(m => suggestedIds.includes(m.id)).slice(0, 3);
      if (suggestedItems.length > 0) {
        setShowUpsell(suggestedItems);
      } else {
        setShowUpsell(null);
      }
    } else {
      setShowUpsell(null);
    }
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(cart.filter(c => c.id !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmitOrder = () => {
    setIsCartOpen(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setCart([]);
    }, 3000);
  };

  const openItemModal = (item: any) => {
    setSelectedItem(item);
    setItemQuantity(1);
    const initialCust: any = {};
    item.customizations?.forEach((c: any) => {
      initialCust[c.name] = c.options[0];
    });
    setSelectedCustomizations(initialCust);
    setSelectedExtras([]);
  };

  return (
    <div className="py-4 lg:py-6 px-2 sm:px-4 font-sans text-slate-800" dir="rtl">
      {/* Explanation Banner */}
      <div className="max-w-md mx-auto mb-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full mb-2">
          <span>📱 تجربة شاشة العميل الحية</span>
        </div>
        <h2 className="text-slate-900 font-bold text-base sm:text-lg">منيو الزبون — طاولة 12</h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
          هذه هي الشاشة التفاعلية التي تظهر للزبون عند مسح كود QR على الطاولة في <strong>Burger House نابلس</strong>.
        </p>
        <div className="mt-3">
          <a 
            href="/m" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all"
          >
            <span>📱 فتح في شاشة جوال كاملة منفصلة (/m)</span>
          </a>
        </div>
      </div>

      {/* Mobile Frame Simulation */}
      <div className="max-w-sm sm:max-w-md mx-auto bg-slate-50 h-[740px] max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative border-[8px] border-slate-900 flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 shadow-sm z-10 relative shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Burger House نابلس</h1>
              <p className="text-sm text-slate-500">برجر ومشويات</p>
            </div>
            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
              طاولة 12
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto whitespace-nowrap px-4 py-3 bg-white scrollbar-hide border-b border-slate-100 flex gap-2 shrink-0">
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
                activeCategory === cat.id 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="ml-2 text-lg">{cat.icon || cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-4 pb-28 overflow-y-auto">
          <div className="grid gap-4">
            {menuItems
              .filter((item: any) => item.category === activeCategory || item.categoryId === activeCategory)
              .map((item: any) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex gap-3.5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openItemModal(item)}
              >
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-3xl shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.image || item.emoji
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">{item.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-orange-600 text-sm">{item.price} ₪</span>
                    <button className="bg-orange-50 text-orange-600 p-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-6 left-6 right-6 z-40"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-orange-500 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <ShoppingCart size={20} />
                </div>
                <span>{cart.length} أصناف</span>
              </div>
              <span>{cartTotal} ₪</span>
            </button>
          </motion.div>
        )}

        {/* Item Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="absolute inset-0 z-50 flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setSelectedItem(null)}
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative bg-white w-full rounded-t-3xl max-h-[90vh] flex flex-col"
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/50 rounded-full" />
                
                <div className="overflow-y-auto p-6 pb-32">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-4xl">
                      {selectedItem.imageUrl ? (
                        <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedItem.image || selectedItem.emoji
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                  <p className="text-slate-500 mb-6 leading-relaxed">{selectedItem.description}</p>

                  {/* Customizations */}
                  {selectedItem.customizations?.map((cust: any) => (
                    <div key={cust.name} className="mb-6">
                      <h4 className="font-bold text-slate-900 mb-3">{cust.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {cust.options.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => setSelectedCustomizations({...selectedCustomizations, [cust.name]: opt})}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                              selectedCustomizations[cust.name] === opt
                                ? 'border-orange-500 bg-orange-50 text-orange-600'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Extras */}
                  {selectedItem.extras?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold text-slate-900 mb-3">إضافات</h4>
                      <div className="space-y-3">
                        {selectedItem.extras.map((extra: any) => (
                          <label key={extra.name} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                selectedExtras.includes(extra.name) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                              }`}>
                                {selectedExtras.includes(extra.name) && <Check size={14} className="text-white" />}
                              </div>
                              <span className="text-slate-700">{extra.name}</span>
                            </div>
                            <span className="text-slate-500 text-sm">+{extra.price} ₪</span>
                            <input 
                              type="checkbox" 
                              className="hidden"
                              checked={selectedExtras.includes(extra.name)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedExtras([...selectedExtras, extra.name]);
                                else setSelectedExtras(selectedExtras.filter(ex => ex !== extra.name));
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex items-center justify-center gap-6 mt-8 mb-4">
                    <button 
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold w-8 text-center">{itemQuantity}</span>
                    <button 
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100">
                  <button 
                    onClick={handleAddToCart}
                    className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold flex justify-between px-6 items-center hover:bg-orange-600 transition-colors"
                  >
                    <span>أضف للطلب</span>
                    <span>{calculateItemPrice()} ₪</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Upsell Modal */}
        <AnimatePresence>
          {showUpsell && showUpsell.length > 0 && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white rounded-3xl p-6 w-full text-center shadow-2xl"
              >
                <div className="text-4xl mb-4">{showUpsell[0].image}</div>
                <h3 className="text-xl font-bold mb-2">حابب تضيف {showUpsell[0].name}؟</h3>
                <p className="text-slate-500 mb-6 text-sm">زبائن كثير بيطلبوه مع طلبهم!</p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setCart([...cart, {
                        id: Math.random().toString(),
                        item: showUpsell[0],
                        quantity: 1,
                        customizations: {},
                        extras: [],
                        totalPrice: showUpsell[0].price
                      }]);
                      setShowUpsell(null);
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors"
                  >
                    أضف للطلب (+{showUpsell[0].price} ₪)
                  </button>
                  <button 
                    onClick={() => setShowUpsell(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-medium transition-colors"
                  >
                    لا، شكراً
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="absolute inset-0 z-50 flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsCartOpen(false)}
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative bg-white w-full h-[80%] rounded-t-3xl flex flex-col"
              >
                <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart size={24} className="text-orange-500" />
                    سلة الطلبات
                  </h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <ShoppingCart size={64} className="mb-4 opacity-50" />
                      <p>السلة فارغة</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(cartItem => (
                        <div key={cartItem.id} className="flex gap-4 pb-4 border-b border-slate-50">
                          <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                            {cartItem.item.image || cartItem.item.emoji}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800">{cartItem.item.name}</h4>
                              <span className="font-bold text-orange-600">{cartItem.totalPrice} ₪</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">الكمية: {cartItem.quantity}</p>
                            {(Object.keys(cartItem.customizations).length > 0 || cartItem.extras.length > 0) && (
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {Object.values(cartItem.customizations).join('، ')}
                                {cartItem.extras.length > 0 && (Object.keys(cartItem.customizations).length > 0 ? ' + ' : '')}
                                {cartItem.extras.join('، ')}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleRemoveFromCart(cartItem.id)}
                            className="text-red-400 p-2 hover:bg-red-50 rounded-lg h-fit"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-4 text-lg font-bold">
                      <span>المجموع:</span>
                      <span className="text-xl text-orange-600">{cartTotal} ₪</span>
                    </div>
                    <button 
                      onClick={handleSubmitOrder}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      أرسل الطلب
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success State */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6"
              >
                <Check size={48} />
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">تم إرسال طلبك! 🎉</h2>
              <p className="text-slate-500 text-lg">جاري تحضير الطلب، صحتين وعافية!</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
