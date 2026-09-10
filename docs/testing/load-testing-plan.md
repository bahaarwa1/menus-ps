# Menus.ps — High-Traffic Load Testing Plan & Benchmark Protocols

## 1. أهداف خطة اختبارات الأحمال
التحقق بالأرقام والقياسات الفعلية (وليس الافتراضات النظرية) من قدرة المنصة على استيعاب:
- **المستوى الأول**: 100 مستخدم متزامن (حالة تشغيل 3-5 مطاعم في وقت الذروة).
- **المستوى الثاني**: 500 مستخدم متزامن (حالة تشغيل 15-25 مطعماً في وقت الذروة).
- **المستوى الثالث**: 1,000 مستخدم متزامن (حالة تشغيل 50+ مطعماً وفتح متزامن لأكواد الـ QR).

الأداة المعتمدة: **k6 (Grafana Labs)** لما تمتاز به من سرعة خفيفة واستهلاك قليل لموارد جهاز الاختبار ومحاكاة بروتوكولات HTTP و WebSockets.

---

## 2. مصفوفة سيناريوهات الاختبار وحدود القبول (Thresholds)

| السيناريو (Scenario) | حركة البيانات المحاكاة | الحجم المستهدف | زمن الاستجابة المقبول (p95) | معدل الأخطاء الأقصى (Error Rate) |
| :--- | :--- | :--- | :--- | :--- |
| **1. مسح QR وفتح المنيو** | قراءة كاش المنيو والأقسام والصور | 1,000 مستخدم متزامن | **< 600ms** | < 0.1% |
| **2. إرسال الطلب للمطبخ** | كتابة طلب جديد في قاعدة البيانات وبث الـ WebSocket | 200 طلب في الدقيقة | **< 800ms** | < 0.5% |
| **3. شاشة المطبخ المتزامنة** | اتصال WebSockets مستمر لاستقبال التذاكر | 50 شاشة مطبخ متزامنة | **تأخير وصول < 300ms** | 0% |
| **4. لوحة تحكم الإدارة** | استعراض لوحة التحليلات والمخططات | 50 مديراً متزامناً | **< 1,200ms** | < 0.5% |

---

## 3. سكريبت فحص الأحمال بـ k6 (`load-test-k6.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // صعود تدريجي لـ 100 مستخدم
    { duration: '2m', target: 500 },   // صعود لـ 500 مستخدم (ذروة غداء)
    { duration: '3m', target: 1000 },  // ضغط الذروة الأقصى 1,000 مستخدم
    { duration: '1m', target: 0 },     // هبوط تدريجي
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],  // 95% من الطلبات يجب أن تكتمل بأقل من 800ms
    http_req_failed: ['rate<0.01'],    // نسبة الفشل الإجمالية أقل من 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. الزبون يمسح كود الـ QR ويفتح المنيو
  const menuRes = http.get(`${BASE_URL}/m`);
  check(menuRes, {
    'Menu loaded 200': (r) => r.status === 200,
    'Fast menu response': (r) => r.timings.duration < 600,
  });

  sleep(Math.random() * 3 + 2); // محاكاة تصفح الزبون لمدة 2-5 ثوانٍ

  // 2. الزبون يختار وجبة ويرسل الطلب للمطبخ (محاكاة 10% من الزوار يطلبون فوراً)
  if (Math.random() < 0.1) {
    const payload = JSON.stringify({
      tableId: 'tbl_12',
      customerNote: 'بدون بصل، استواء جيد',
      items: [
        { itemId: 'b1', quantity: 2, unitPrice: 42, notes: 'ميديوم' }
      ]
    });

    const headers = { 'Content-Type': 'application/json' };
    const orderRes = http.post(`${BASE_URL}/api/v1/orders/submit`, payload, { headers });

    check(orderRes, {
      'Order submitted successfully': (r) => r.status === 201 || r.status === 200,
    });
  }

  sleep(1);
}
```

---

## 4. خطة التشغيل ومراحل الاعتماد (Execution Phases)
1. **الخطوة الأولى (Baseline Test)**: تشغيل الاختبار لـ 100 مستخدم لقياس الأداء الطبيعي وتسجيل الأرقام كمرجع أساسي.
2. **الخطوة الثانية (Stress Test)**: رفع الضغط إلى 500 مستخدم ومراقبة نسبة استهلاك الذاكرة في Next.js وتشبع مجمع اتصالات Postgres.
3. **الخطوة الثالثة (Spike Test)**: قفزة مفاجئة من 100 إلى 1,000 مستخدم خلال 30 ثانية لمحاكاة إقبال لحظي في مهرجان أو نهاية أسبوع، ومراقبة عمل الـ CDN Cache والـ Rate Limiting.
4. **الخطوة الرابعة (Analysis & Remediation)**: تحديد أي مسار يتجاوز زمن استجابته 800ms وتطبيق الفهرسة أو زيادة كاش الـ Edge فوراً.
