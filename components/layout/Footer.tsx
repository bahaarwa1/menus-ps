import Link from 'next/link';
import Logo from '@/components/common/Logo';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo size="lg" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              حوّل مطعمك لتجربة رقمية متكاملة. منيو QR تفاعلي، طلب مباشر من الطاولة، إدارة طلبات لحظية، وتعديل المنيو بمرونة كاملة.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-it-works" className="hover:text-orange-400 transition-colors">كيف يعمل</Link></li>
              <li><Link href="/features" className="hover:text-orange-400 transition-colors">المميزات</Link></li>
              <li><Link href="/pricing" className="hover:text-orange-400 transition-colors">الأسعار</Link></li>
              <li><Link href="/faq" className="hover:text-orange-400 transition-colors">الأسئلة الشائعة</Link></li>
              <li><a href="https://menus-ps-demo.vercel.app" target="_blank" className="hover:text-orange-400 transition-colors">موقع الديمو التجريبي ↗</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">ابدأ تجربة مجانية</Link></li>
              <li className="text-slate-400">info@menus.ps</li>
              <li className="text-slate-400">+970 59 123 4567</li>
              <li className="text-slate-400">نابلس، فلسطين</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2026 MENUS — جميع الحقوق محفوظة
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>صُنع بـ ❤️ في فلسطين</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
