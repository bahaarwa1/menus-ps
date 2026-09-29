'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RESTAURANT_INFO, CATEGORIES, DISHES } from '@/data/menu-data';
import CategoryIcon from '@/components/CategoryIcon';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>('ar');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const navSectionRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Language toggle
  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // Handle category pill click: Tab filter mode
  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setSearchQuery('');

    // Smooth horizontal centering of active pill in the scroller
    if (pillsContainerRef.current) {
      const activeBtn = pillsContainerRef.current.querySelector(
        `[data-cat-id="${catId}"]`
      ) as HTMLElement | null;

      if (activeBtn) {
        const container = pillsContainerRef.current;
        const scrollLeft =
          activeBtn.offsetLeft -
          container.clientWidth / 2 +
          activeBtn.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      } else if (catId === 'all') {
        pillsContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }

    // Scroll smoothly to the start of the menu content
    if (navSectionRef.current) {
      const navBottom = navSectionRef.current.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: navBottom - 60, behavior: 'smooth' });
    }
  };

  // Filtered categories & items
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // If searching, search across all items
    if (query) {
      return CATEGORIES.map((cat) => {
        const items = DISHES.filter(
          (d) =>
            d.category === cat.id &&
            (d.name.toLowerCase().includes(query) ||
              d.nameEn.toLowerCase().includes(query) ||
              d.description.toLowerCase().includes(query) ||
              d.descriptionEn.toLowerCase().includes(query))
        );
        return { ...cat, items };
      }).filter((cat) => cat.items.length > 0);
    }

    // If a specific category tab is active, show ONLY that category
    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (cat) {
        const items = DISHES.filter((d) => d.category === cat.id);
        return [{ ...cat, items }];
      }
    }

    // Otherwise show all categories
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: DISHES.filter((d) => d.category === cat.id),
    })).filter((cat) => cat.items.length > 0);
  }, [activeCategory, searchQuery]);

  const currency = currentLang === 'ar' ? RESTAURANT_INFO.currency : RESTAURANT_INFO.currencyEn;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center selection:bg-[#8B1D2C]/10 selection:text-[#8B1D2C]">
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-sm border-x border-slate-100 relative flex flex-col pb-0">
        
        {/* 1. Top Header (Clean Pure White) */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full min-w-[70px]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-green-dot"></span>
            <span className="text-[11px] font-bold text-emerald-800 tracking-tight whitespace-nowrap">
              {currentLang === 'ar' ? 'مفتوح الآن' : 'Open Now'}
            </span>
          </div>

          {/* Centered Logo */}
          <div className="flex-1 flex justify-center items-center">
            <img
              src="/assets/logo.png"
              alt={RESTAURANT_INFO.name}
              className="h-10 w-auto max-w-[155px] object-contain drop-shadow-2xs"
            />
          </div>

          {/* Language Toggle Button */}
          <div className="min-w-[70px] flex justify-end">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition shadow-2xs"
              title="Change Language"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{currentLang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </header>

        {/* 2. Ambient Hero Banner (Natural Light, No Yellowing) */}
        <section className="relative w-full h-[155px] overflow-hidden bg-slate-900">
          <img
            src="/assets/cover.jpg"
            alt="Hero Cover"
            className="w-full h-full object-cover brightness-105 contrast-102 scale-106"
            style={{ filter: 'blur(2.5px)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent flex items-end p-4">
            <div className="flex flex-col gap-0.5 text-white">
              <span className="text-amber-300 text-[12.5px] font-bold tracking-tight drop-shadow-md">
                {currentLang === 'ar' ? '✨ مطعم وكافيه.. منذ 1930' : '✨ Restaurant & Cafe • Est. 1930'}
              </span>
              <p className="text-white text-[11.5px] font-normal leading-relaxed drop-shadow-md m-0">
                {currentLang === 'ar'
                  ? 'قائمة الطعام الرقمية • خدمة استثنائية وأطباق مميزة'
                  : 'Digital Menu • Exceptional Hospitality & Signature Dishes'}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Search Bar & Horizontal Category Tabs */}
        <div ref={navSectionRef} className="bg-white border-b border-slate-100 shadow-2xs">
          {/* Search Box */}
          <div className="p-3 pb-1.5">
            <div className="relative flex items-center">
              <svg className="absolute start-3 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentLang === 'ar' ? 'ابحث عن صنف، منقوشة، حمص، فطور...' : 'Search for manoushe, hummus, grill...'}
                className="w-full ps-9 pe-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-[12.5px] font-normal text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 text-slate-400 hover:text-slate-600 text-sm font-medium cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs Scroller (Clean Modern Pills) */}
          <div ref={pillsContainerRef} className="flex gap-2 overflow-x-auto hide-scrollbar px-3 py-2 scroll-smooth">
            {/* 'All' Pill */}
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition cursor-pointer border ${
                activeCategory === 'all'
                  ? 'bg-[#8B1D2C] text-white border-[#8B1D2C] shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <span>{currentLang === 'ar' ? 'الكل' : 'All'}</span>
            </button>

            {/* Individual Category Pills (Clean Text-Only) */}
            {CATEGORIES.map((cat) => {
              const name = currentLang === 'ar' ? cat.name : (cat.nameEn || cat.name);
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  data-cat-id={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? 'bg-[#8B1D2C] text-white border-[#8B1D2C] shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Menu Main Content */}
        <main className="flex-1 p-3">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3 className="text-[15px] font-bold text-slate-700 mb-1">
                {currentLang === 'ar' ? 'لم نجد أصناف مطابقة' : 'No matching items'}
              </h3>
              <p className="text-[12px] font-normal text-slate-400">
                {currentLang === 'ar' ? 'جرب البحث بكلمة أخرى أو تصفح باقي الأقسام' : 'Try another search term or browse other categories'}
              </p>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const catTitle = currentLang === 'ar' ? cat.name : (cat.nameEn || cat.name);

              return (
                <section
                  key={cat.id}
                  id={`cat-sec-${cat.id}`}
                  className="mb-7 category-tab-animate"
                >
                  {/* Category Title Header with Burgundy Accent Bar (Clean Text-Only) */}
                  <div className="flex items-center justify-between gap-3 mb-3.5 px-1 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-5 bg-[#8B1D2C] rounded-full shadow-2xs"></span>
                      <h3 className="text-[17px] font-bold text-slate-800 tracking-tight m-0">
                        {catTitle}
                      </h3>
                    </div>

                    {activeCategory !== 'all' && !searchQuery && (
                      <button
                        onClick={() => handleCategoryClick('all')}
                        className="text-[11px] font-bold text-[#8B1D2C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#8B1D2C]/20 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                      >
                        {currentLang === 'ar' ? 'عرض الكل ✨' : 'View All ✨'}
                      </button>
                    )}
                  </div>

                  {/* 2-Column Dish Cards Grid (Crisp Clean White Style) */}
                  <div className="grid grid-cols-2 gap-3">
                    {cat.items.map((dish) => {
                      const title = currentLang === 'ar' ? dish.name : (dish.nameEn || dish.name);
                      const desc = currentLang === 'ar' ? dish.description : (dish.descriptionEn || dish.description);
                      const displayPrice = dish.hasSizes ? (dish.priceS || dish.price) : dish.price;
                      const hasSizes = dish.hasSizes;

                      return (
                        <div
                          key={dish.id}
                          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                          {/* Image Frame: Clean Light Slate Frame Background */}
                          <div className="relative w-full aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100">
                            <img
                              src={dish.image || '/assets/cover.jpg'}
                              alt={title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/cover.jpg';
                              }}
                            />
                          </div>

                          {/* Card Body with Clean, Crisp, Eye-Resting Typography */}
                          <div className="p-2.5 flex flex-col justify-between flex-1 min-h-[96px] bg-white">
                            <div>
                              {/* Dish Title in Soft Dark Slate (#1E293B) */}
                              <h4 className="text-[14.5px] font-bold text-slate-800 leading-snug tracking-tight m-0">
                                {title}
                              </h4>

                              {/* Arabic Description in Clean Neutral Slate (#64748B) */}
                              {desc && (
                                <p className="text-[12px] font-normal leading-[1.55] text-slate-500 mt-1 mb-0 line-clamp-2">
                                  {desc}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Price on visual left, sizes pill on right */}
                            <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                              {/* Sizes Pill */}
                              {hasSizes && dish.priceS && dish.priceL ? (
                                <div className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                  <span>{dish.priceS} / {dish.priceL}</span>
                                </div>
                              ) : <div></div>}

                              {/* Price in Rich Burgundy on visual left */}
                              <div className="inline-flex items-baseline gap-0.5 ms-auto">
                                {hasSizes && (
                                  <span className="text-[10px] font-semibold text-slate-400 me-0.5">
                                    {currentLang === 'ar' ? 'من' : 'From'}
                                  </span>
                                )}
                                <span className="text-[16px] font-bold text-[#8B1D2C] tracking-tight leading-none">
                                  {displayPrice}
                                </span>
                                <span className="text-[11px] font-bold text-[#8B1D2C]/85">
                                  {currency}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </main>

        {/* 5. Footer (Clean Slate & Pure White) */}
        <footer className="mt-auto bg-slate-50 border-t border-slate-100 py-6 px-4 text-center">
          <img
            src="/assets/logo.png"
            alt={RESTAURANT_INFO.name}
            className="h-9 w-auto max-w-[140px] object-contain mx-auto mb-2 opacity-90"
          />
          <h4 className="text-[12.5px] font-bold text-slate-800 tracking-tight">
            مطعم وكافيه شيشة ومنقوشة (خميس منذ 1930)
          </h4>
          <p className="text-[11px] font-normal text-slate-500 mt-1 mb-0">
            أطيب الأطباق والمناقيش والمشاوي • نسعد دائماً بخدمتكم
          </p>
        </footer>

        {/* Floating Back To Top Button */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 start-6 z-50 w-10 h-10 rounded-full bg-[#8B1D2C] text-white shadow-lg flex items-center justify-center hover:bg-[#731824] transition-all duration-200 hover:scale-105 cursor-pointer"
            title="Scroll to Top"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        )}

      </div>
    </div>
  );
}
