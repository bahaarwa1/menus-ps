# Menus.ps — Engineering & Agent Operating Instructions

## 1. Continuous Git Synchronization Policy (إلزامية مزامنة Git مع كل خطوة)
> [!IMPORTANT]
> مع كل خطوة عمل أو تعديل كود أو إصلاح أو إضافة ميزة يطلبها المستخدم:
> 1. فحص سلامة بناء المشروع (`npm run build`).
> 2. تجهيز الملفات المعدلة: `git add .`
> 3. إنشاء Commit معبر وواضح: `git commit -m "..."`
> 4. الرفع المباشر إلى المستودع البعيد: `git push origin main`
> 5. ممنوع إنهاء أي خطوة دون إتمام عملية المزامنة والرفع لـ GitHub.

## 2. Design & Architecture Standards
- شاشة الموظفين (`/staff`): 3 طاولات متجاورة في كل صف (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3` مع `lg:col-span-8`).
- هرمية الألوان الداكنة: `text-slate-900 font-bold` للعناوين والأرقام، `text-slate-800 font-semibold` للأصناف، `text-slate-600` للملخص، `text-slate-500` للوصف والملاحظات، `text-slate-400` للوقت.
- الحواف: ناعمة `border border-slate-200/80 shadow-xs`.
- ثيم النظام: `darkMode: 'class'` في tailwind.config.ts.
- العملة: ₪ (شيكل).
