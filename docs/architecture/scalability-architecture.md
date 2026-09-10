# Menus.ps — Scalability & High-Traffic Architecture Blueprint

## 1. الفلسفة الأساسية للتوسع (Core Scaling Philosophy)
> **"Simple now → Scalable later → Zero unnecessary cloud costs"**
> (بسيط الآن ← قابل للتوسع مستقبلاً ← صفر تكاليف سحابية غير ضرورية)

لا تعتمد المنصة على زيادة قوة السيرفر رأسياً (Vertical Scaling / Bigger Server) فقط، بل تم تصميمها وفق معمارية **Modular Monolith عديمة الحالة (Stateless)** قابلة للتوسع أفقياً (Horizontal Scaling) عبر مضاعفة عدد الـ Instances خلف Load Balancer وشبكة Edge CDN، دون الحاجة لتقسيم معقد إلى Microservices أو بنية Kubernetes باهظة التكاليف في المراحل المبكرة.

---

## 2. مخطط المعمارية عالية الأداء (High-Traffic Architecture Diagram)

```mermaid
graph TD
    subgraph Traffic Ingress
        U1[زبائن QR في المطاعم\nSmartphones] -->|فتح المنيو 98% قراءة| CDN[Cloudflare Edge Network / CDN]
        U2[طواقم المطابخ\nTablets / Phones /staff] -->|اتصال لحظي WebSockets| WS[Supabase Realtime Gateway]
        U3[أصحاب المطاعم والإدارة\n/demo/*] -->|HTTPS Requests| LB[Vercel / Cloud Load Balancer]
    end

    subgraph CDN & Caching Tier
        CDN -->|Cache Hit 95%| CacheEdge[Edge HTML & JSON Cache\nStale-While-Revalidate]
        CDN -->|Cache Miss / Orders Post| LB
        CDN -->|Static Food Images| Storage[Object Storage\nSupabase Storage / R2]
    end

    subgraph Stateless Application Tier (Auto-Scaling)
        LB --> App1[Next.js App Instance 1]
        LB --> App2[Next.js App Instance 2]
        LB --> AppN[Next.js App Instance N\nAuto-scaled on CPU/RPS]
    end

    subgraph API Protection & Rate Limiting
        App1 & App2 & AppN --> RL[Edge Rate Limiter\nToken Bucket 10 req/min/table]
        App1 & App2 & AppN --> AI_Guard[AI Throttling & Semantic Cache]
    end

    subgraph Database & Persistence Tier
        App1 & App2 & AppN --> Pooler[Supavisor / PgBouncer Connection Pooler\nPort 6543]
        Pooler --> MasterDB[(PostgreSQL Primary\nWrites & Realtime WAL)]
        MasterDB -.->|Replication| ReadReplica[(Read Replica\nAnalytics & Heavy Queries)]
    end

    subgraph Async Background Tasks
        App1 & App2 & AppN -.-> Queue[Async Background Queue\nPDF Standees / Reports]
    end
```

---

## 3. الركائز الست للمعمارية اللامركزية (The 6 Pillars)

### 3.1 معمارية التطبيق عديم الحالة (Stateless Architecture)
- **منع استخدام الذاكرة المحلية كقاعدة بيانات**: لا يتم تخزين جلسات المستخدمين (Sessions) أو الطلبات داخل ذاكرة الـ RAM لأي Instance.
- **منع استخدام نظام الملفات المحلي (No Local Filesystem)**: لا يتم تخزين صور الوجبات أو ملفات الـ PDF على قرص السيرفر. يتم رفعها مباشرة إلى Object Storage (Supabase Storage / Cloudflare R2).
- **سهولة التوسع الأفقي**: يمكن تشغيل 10 نسخ متطابقة من Next.js دون أي مشاكل تعارض أو فقدان للجلسات لأن التوثيق مبني على JWT Tokens مشفرة.

### 3.2 استراتيجية التخزين المؤقت لمنيو الـ QR (High-Traffic QR Read-Heavy Caching)
في أوقات الذروة بمطعم يحتوي على 30 طاولة مع 4 زبائن لكل طاولة، قد يمسح 120 شخصاً كود الـ QR في نفس اللحظة:
- **طبيعة حركة البيانات**: 98% قراءة (تصفح الأطباق، الصور، الأسعار)، 2% كتابة (إرسال الطلب النهائي).
- **آلية الكاش**:
  - تفعيل `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` على مسار منيو المطعم.
  - استخدام Next.js `unstable_cache` مع وسوم إعادة التحديث (Tags):
    ```typescript
    // جلب منيو المطعم من الكاش الفوري
    export const getCachedMenu = unstable_cache(
      async (branchId: string) => fetchBranchMenuFromDB(branchId),
      ['branch-menu'],
      { tags: [`menu:${branchId}`], revalidate: 3600 }
    );
    ```
  - **إبطال الكاش الذكي (Tag Invalidation)**: عند تعديل أي سعر أو نفاد أي صنف في `/demo/menu-editor`، يتم إطلاق `revalidateTag('menu:branch_123')` فوراً ليتحدث الكاش خلال ثوانٍ معدودة دون إعادة تحميل ما لم يتغير.

### 3.3 حماية قاعدة البيانات ومجمع الاتصالات (Database Connection Pooling)
- **المشكلة في بيئات Serverless/Edge**: عند فتح مئات المستخدمين للموقع، تفتح دوال السيرفر مئات اتصالات Postgres المباشرة مما يؤدي إلى انهيار السيرفر بخطأ `FATAL: remaining connection slots are reserved`.
- **الحل الهندسي**:
  - حظر الاتصال المباشر بمنفذ `5432` في بيئة الإنتاج.
  - إلزام كافة الدوال بالاتصال عبر **Supavisor / PgBouncer Pooler** على منفذ `6543` بنمط `Transaction Pooling`.
  - الفهارس الذكية (Indexes):
    ```sql
    CREATE INDEX CONCURRENTLY idx_tables_qr_token ON tables(qr_token);
    CREATE INDEX CONCURRENTLY idx_orders_branch_status ON orders(branch_id, status);
    CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
    ```
  - منع استعلامات الـ N+1: جلب الطلب مع عناصره وإضافاته ككائن JSON موحد في استعلام واحد:
    ```sql
    SELECT o.*, json_agg(oi.*) AS items 
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    WHERE o.branch_id = $1 AND o.status != 'completed'
    GROUP BY o.id;
    ```

### 3.4 حماية وتوزيع الأصول عبر الـ CDN (Assets & CDN Offloading)
- يتم تقديم جميع الصور عبر شبكة CDN محسنة بنظام التحويل التلقائي لصيغة WebP و AVIF خفيفة الحجم.
- ترويسات الكاش للصور: `Cache-Control: public, max-age=31536000, immutable`.
- استخدام Lazy Loading في كروت الوجبات بحيث لا يتم تحميل صور الأقسام السفلية إلا عند تمرير الشاشة إليها.

### 3.5 حماية الواجهات وحدود الطلبات (API Rate Limiting & Protection)
- **حماية مسارات الطلبات العامة**:
  - مسار إرسال الطلب `/api/v1/orders/submit`: حد أقصى 10 طلبات لكل 5 دقائق لكل طاولة (يمنع محاولات الإغراق والتلاعب).
  - مسار استدعاء الويتر `/api/v1/tables/call-waiter`: حد أقصى طلب واحد كل 60 ثانية لكل طاولة.
  - مسار تسجيل الدخول `/login`: حد أقصى 5 محاولات خاطئة لكل IP كل 15 دقيقة لمنع هجمات التخمين (Brute Force).
- **التحقق من حجم البيانات المرفوعة (Payload Limits)**:
  - أقصى حجم لصور الوجبات: 3MB مع التحقق من الامتداد الحقيقي في الـ Server.
  - أقصى حجم لملاحظات الزبون: 250 حرف مع تطهيرها ضد وسوم HTML/XSS.

### 3.6 عزل وترشيد استهلاك الذكاء الاصطناعي (AI Throttling & Cost Protection)
لمنع تضخم فواتير الـ AI عند زيادة عدد المطاعم:
1. **الكاش الدلالي (Semantic Cache)**: الأسئلة المتكررة في لوحة المدير (مثل "ما هي أوقات الذروة؟"، "ما أكثر الأطباق مبيعاً؟") يتم كاش إجاباتها لكل مطعم لمدة ساعة كاملة.
2. **حدود الاستخدام (Usage Quotas)**: سقف 30 استفسار ذكاء اصطناعي يومياً لكل مطعم ضمن الباقة القياسية.
3. **المهلة القصوى (Timeout & Fallback)**: تحديد Timeout بـ 8 ثوانٍ لأي استدعاء AI مع إرجاع إجابة إحصائية جاهزة في حال تأخر النموذج السحابي.

---

## 4. خطة التوسع المرحلي حسب عدد المستخدمين (The 4 Scaling Tiers)

| المرحلة | حجم المستخدمين والنشاط | البنية التحتية المطلوبة | التكلفة التقديرية | المهام المطلوبة |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: الوضع الحالي** | حتى 100 مستخدم (1-5 مطاعم) | Modular Monolith على Vercel/Node.js + Supabase Free/Pro Tier | **صفر إلى 25$ / شهرياً** | ربط قاعدة البيانات، تفعيل قنوات Realtime، والتحقق في السيرفر. |
| **Tier 2: النمو الأولي** | 100 إلى 1,000 مستخدم نشط (5-30 مطعم) | Next.js Serverless + Supabase Pro (PgBouncer) + Cloudflare CDN + Edge SWR Caching | **25$ إلى 50$ / شهرياً** | كاش منيو الـ QR عند الـ Edge، تفعيل الـ Rate Limiting، وعزل رفع الصور لـ Object Storage. |
| **Tier 3: التوسع الوطني** | 1,000 إلى 10,000 مستخدم (30-150 مطعم) | Multi-Instance Auto-scaling + Upstash Redis Cache + Read Replica للتقارير والتحليلات | **80$ إلى 200$ / شهرياً** | فصل استعلامات التقارير الثقيلة على Read Replica، واعتماد طوابير خلفية للـ PDF والإشعارات. |
| **Tier 4: التوسع الإقليمي** | 10,000+ مستخدم نشط | Multi-Region Edge Workers + Global Redis Clusters + Dedicated Database Cluster | **تتحدد حسب الاستهلاك** | تجزئة قواعد البيانات حسب المنطقة (Database Sharding / Multi-tenant isolation). |

---

## 5. مصفوفة تحديد ومعالجة نقاط الاختناق (Bottleneck Mitigation Matrix)

| نقطة الاختناق المحتملة | سبب الاختناق | التأثير | الحل الهندسي المعتمد في Menus.ps |
| :--- | :--- | :--- | :--- |
| **فتح المنيو في وقت الذروة** | استعلامات متكررة لجلب قائمة الطعام والصور | بطء فتح المنيو على هاتف الزبون وضغط الـ DB | كاش الـ Edge SWR بنسبة Hit تتجاوز 95%؛ الـ Database لا تستقبل أي استعلام لقراءة المنيو عند مسح الكود. |
| **اتصالات قاعدة البيانات (DB Connections)** | هجمات زوار أو فتح متزامن لعشرات الشاشات | خطأ 500 وانهيار التطبيق | تفعيل Supavisor Connection Pooling بحد أقصى للاتصالات واستخدام Transaction Pooling. |
| **إرسال التذاكر لشاشات المطبخ** | تراكم تذاكر الطاولات وتأخر وصولها | تأخر تجهيز الوجبة وغضب الزبائن | قنوات WebSockets خفيفة (Event payloads < 2KB) مع صوت تنبيه محلي فوري وتأكيد استلام (ACK). |
| **رفع وتعديل صور الطعام** | رفع صور عالية الدقة من هواتف أصحاب المطاعم | استهلاك باندويث وسيرفر وبطء تحميل الزبائن | ضغط الصور وتحويلها لصيغة WebP بأبعاد مربعة وحفظها على CDN مستقل. |
| **استعلامات التقارير والرسوم البيانية** | تجميع آلاف سجلات المبيعات للرسم البياني | بطء شاشة لوحة تحكم المدير `/demo` | جداول تجميعية دورية (Materialized Aggregations / Daily Rollups) بدلاً من حساب آلاف الصفوف لحظياً. |
