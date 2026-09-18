// ============================================================
// Menus.ps — Fictional Demo Data for Burger House Nablus
// ============================================================

// ---------- Types ----------
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  imageUrl?: string;
  category: string;
  popular?: boolean;
  spicy?: boolean;
  extras?: Extra[];
  customizations?: Customization[];
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface Customization {
  id: string;
  name: string;
  options: string[];
  default?: string;
}

export interface Order {
  id: string;
  table: number;
  items: OrderItem[];
  total: number;
  status: 'جديد' | 'قيد التحضير' | 'جاهز' | 'تم التسليم';
  time: string;
  customerName?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  extras?: string[];
  customization?: string;
}

export interface TableInfo {
  id: number;
  seats: number;
  status: 'فارغة' | 'مشغولة' | 'محجوزة';
  currentOrder?: string;
  guests?: number;
  qrToken?: string;
}

export interface DailySales {
  date: string;
  sales: number;
  orders: number;
}

export interface BranchData {
  id: string;
  name: string;
  city: string;
  tables: number;
  todaySales: number;
  todayOrders: number;
}

// ---------- Menu Categories ----------
export const categories = [
  { id: 'burgers', name: 'برغر', icon: '🍔' },
  { id: 'wraps', name: 'رابز وتورتيلا', icon: '🌯' },
  { id: 'sides', name: 'أطباق جانبية', icon: '🍟' },
  { id: 'drinks', name: 'مشروبات', icon: '🥤' },
  { id: 'desserts', name: 'حلويات', icon: '🍰' },
];

// ---------- Menu Items ----------
export const menuItems: MenuItem[] = [
  // Burgers
  {
    id: 'b1', name: 'كلاسيك برغر',
    description: 'لحم بقر طازج ١٥٠غ مع خس وطماطم وبصل ومخلل وصوص خاص',
    price: 32, image: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    category: 'burgers', popular: true,
    extras: [
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
      { id: 'e2', name: 'بيض مقلي', price: 5 },
      { id: 'e3', name: 'بيكون لحم', price: 7 },
      { id: 'e4', name: 'جبنة إضافية', price: 5 },
      { id: 'e5', name: 'مشروم', price: 4 },
    ],
    customizations: [
      { id: 'c1', name: 'درجة الاستواء', options: ['ويل دان', 'ميديوم', 'ميديوم رير'], default: 'ويل دان' },
      { id: 'c2', name: 'نوع الخبز', options: ['بريوش', 'سمسم', 'خالي من الغلوتين'], default: 'بريوش' },
    ],
  },
  {
    id: 'b2', name: 'دبل سماش برغر',
    description: 'قطعتين لحم سماش مع جبنة ذائبة وصوص سماش الخاص',
    price: 42, image: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    category: 'burgers', popular: true,
    extras: [
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
      { id: 'e3', name: 'بيكون لحم', price: 7 },
      { id: 'e6', name: 'هالابينو', price: 3 },
    ],
    customizations: [
      { id: 'c2', name: 'نوع الخبز', options: ['بريوش', 'سمسم'], default: 'بريوش' },
    ],
  },
  {
    id: 'b3', name: 'تشيكن برغر مقرمش',
    description: 'صدر دجاج مقرمش ذهبي مع خس وصوص رانش مدخن',
    price: 30, image: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    category: 'burgers',
    extras: [
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
      { id: 'e7', name: 'أفوكادو', price: 8 },
    ],
  },
  {
    id: 'b4', name: 'ماشروم برغر سويسري',
    description: 'لحم بقر طازج مع مشروم سوتيه بالزبدة وجبنة إيمنتال سويسرية',
    price: 38, image: '🍄',
    imageUrl: 'https://images.unsplash.com/photo-1583032015879-661702f2316e?auto=format&fit=crop&w=600&q=80',
    category: 'burgers',
    extras: [
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
      { id: 'e5', name: 'مشروم إضافي', price: 4 },
    ],
  },
  {
    id: 'b5', name: 'سبايسي أنفرنو برغر',
    description: 'لحم بقر مع صوص شيبوتلي حار وهالابينو مكسيكي وجبنة فلفل جاك',
    price: 35, image: '🌶️',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    category: 'burgers', popular: true,
    extras: [
      { id: 'e6', name: 'هالابينو إضافي', price: 3 },
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
    ],
  },
  {
    id: 'b6', name: 'سموكي باربكيو برغر',
    description: 'لحم بقر مشوي على الفحم مع صوص باربكيو وبصل مكرمل مدخن',
    price: 40, image: '🍖',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
    category: 'burgers',
    extras: [
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
      { id: 'e3', name: 'بيكون لحم', price: 7 },
    ],
  },
  // Wraps
  {
    id: 'w1', name: 'راب دجاج مشوي تورتيلا',
    description: 'دجاج مشوي مع خضار طازجة وصوص ثوم بلدي بخبز التورتيلا المحمص',
    price: 28, image: '🌯',
    imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
    category: 'wraps',
    extras: [
      { id: 'e1', name: 'جبنة شيدر', price: 5 },
      { id: 'e8', name: 'صوص حار', price: 2 },
    ],
  },
  {
    id: 'w2', name: 'راب فلافل فلسطيني',
    description: 'فلافل ذهبية مقرمشة مع حمص وسلطة بلدية وطحينة سمسم فاخرة',
    price: 22, image: '🧆',
    imageUrl: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&w=600&q=80',
    category: 'wraps',
    extras: [
      { id: 'e9', name: 'فلافل إضافية', price: 5 },
      { id: 'e8', name: 'صوص حار', price: 2 },
    ],
  },
  {
    id: 'w3', name: 'راب ستيك لحم مشوي',
    description: 'شرائح ستيك عجل متبلة مع بصل وفلفل ملون وجبنة موزاريلا',
    price: 35, image: '🥩',
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
    category: 'wraps',
  },
  {
    id: 'w4', name: 'راب كريسبي تشيكن رانش',
    description: 'أصابع دجاج مقرمشة مع كول سلو وصوص رانش كريمي',
    price: 30, image: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    category: 'wraps', popular: true,
  },
  // Sides
  {
    id: 's1', name: 'بطاطا ودجز مقلية',
    description: 'بطاطا ذهبية مقرمشة مع تتبيلة الأعشاب والملح البحري',
    price: 12, image: '🍟',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    category: 'sides', popular: true,
    extras: [
      { id: 'e10', name: 'صوص جبنة', price: 5 },
      { id: 'e11', name: 'ترافل', price: 7 },
    ],
  },
  {
    id: 's2', name: 'حلقات بصل كرسبي',
    description: 'حلقات بصل مقرمشة بالبقسماط الذهبي مع صوص تكساس رانش',
    price: 15, image: '🧅',
    imageUrl: 'https://images.unsplash.com/photo-1639024471287-032f66ab7577?auto=format&fit=crop&w=600&q=80',
    category: 'sides',
  },
  {
    id: 's3', name: 'ناجتس دجاج مقرمش',
    description: '٨ قطع تندر دجاج كرسبي مع صوص عسل وخردل وباربكيو',
    price: 18, image: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    category: 'sides',
  },
  {
    id: 's4', name: 'سلطة سيزر الدجاج',
    description: 'خس روماني طازج مع كروتون محمص وجبنة بارميزان وصوص سيزر إيطالي',
    price: 20, image: '🥗',
    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80',
    category: 'sides',
  },
  {
    id: 's5', name: 'تشيز بيكون فرايز',
    description: 'بطاطا مقلية مغطاة بصوص جبنة شيدر الساخن وقطع بيكون مقرمشة',
    price: 22, image: '🧀',
    imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80',
    category: 'sides', popular: true,
  },
  // Drinks
  {
    id: 'd1', name: 'كوكا كولا مثلجة', description: 'علبة كان باردة مع ثليمون وثلج',
    price: 7, image: '🥤',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    category: 'drinks',
  },
  {
    id: 'd2', name: 'عصير برتقال طبيعي طازج', description: 'عصير برتقال يافاوي طازج معصور فور الطلب',
    price: 14, image: '🍊',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    category: 'drinks',
  },
  {
    id: 'd3', name: 'ميلك شيك شوكولاتة وفانيلا',
    description: 'ميلك شيك غني بالكريمة والحليب مع صوص شوكولاتة بلجيكية',
    price: 18, image: '🥛',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    category: 'drinks', popular: true,
    customizations: [
      { id: 'c3', name: 'النكهة', options: ['فانيلا', 'شوكولاتة', 'فراولة'], default: 'شوكولاتة' },
    ],
  },
  {
    id: 'd4', name: 'موهيتو ليمون ونعناع منعش', description: 'موهيتو مثلج بالنعناع الطازج وعصير الليمون وصودا',
    price: 16, image: '🍹',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    category: 'drinks',
  },
  {
    id: 'd5', name: 'مياه معدنية نقية', description: 'مياه معدنية طبيعية باردة ٥٠٠مل',
    price: 5, image: '💧',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    category: 'drinks',
  },
  // Desserts
  {
    id: 'de1', name: 'فادج براونيز بالشوكولاتة',
    description: 'براونيز ساخنة بقلب شوكولاتة غني تقدم مع آيس كريم فانيلا',
    price: 22, image: '🍫',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    category: 'desserts', popular: true,
  },
  {
    id: 'de2', name: 'نيويورك تشيز كيك بالتوت',
    description: 'تشيز كيك كريمية مخبوزة على طبقة بسكويت زبدة وصوص توت بري',
    price: 25, image: '🍰',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    category: 'desserts',
  },
  {
    id: 'de3', name: 'كنافة نابلسية خشنة',
    description: 'كنافة نابلسية أصيلة بجبنة بلدية طازجة مع فستق حلبي وقطر خفيف',
    price: 20, image: '🧁',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    category: 'desserts', popular: true,
  },
  {
    id: 'de4', name: 'آيس كريم إيطالي فاخر',
    description: 'كرات آيس كريم جيلاتو ناعمة بنكهات متعددة حسب اختيارك',
    price: 15, image: '🍨',
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
    category: 'desserts',
    customizations: [
      { id: 'c4', name: 'النكهة الأولى', options: ['فانيلا', 'شوكولاتة', 'فراولة', 'مانجا', 'فستق'], default: 'فانيلا' },
      { id: 'c5', name: 'النكهة الثانية', options: ['فانيلا', 'شوكولاتة', 'فراولة', 'مانجا', 'فستق'], default: 'شوكولاتة' },
    ],
  },
];

// ---------- Upsell Recommendations ----------
export const upsellRules: Record<string, string[]> = {
  burgers: ['s1', 's5', 'd1', 'd3'],
  wraps: ['s1', 's2', 'd1'],
  sides: ['d1', 'd4'],
  drinks: ['s1', 's3'],
  desserts: ['d3', 'd4'],
};

// ---------- Tables ----------
export const tables: TableInfo[] = [
  { id: 1, seats: 2, status: 'مشغولة', currentOrder: 'ORD-001', guests: 2 },
  { id: 2, seats: 4, status: 'مشغولة', currentOrder: 'ORD-002', guests: 3 },
  { id: 3, seats: 2, status: 'فارغة' },
  { id: 4, seats: 6, status: 'مشغولة', currentOrder: 'ORD-003', guests: 5 },
  { id: 5, seats: 4, status: 'فارغة' },
  { id: 6, seats: 2, status: 'محجوزة' },
  { id: 7, seats: 4, status: 'مشغولة', currentOrder: 'ORD-004', guests: 4 },
  { id: 8, seats: 8, status: 'فارغة' },
  { id: 9, seats: 2, status: 'مشغولة', currentOrder: 'ORD-005', guests: 2 },
  { id: 10, seats: 4, status: 'فارغة' },
  { id: 11, seats: 6, status: 'محجوزة' },
  { id: 12, seats: 4, status: 'مشغولة', currentOrder: 'ORD-006', guests: 3 },
  { id: 13, seats: 2, status: 'فارغة' },
  { id: 14, seats: 4, status: 'مشغولة', currentOrder: 'ORD-007', guests: 2 },
  { id: 15, seats: 6, status: 'فارغة' },
];

// ---------- Orders ----------
export const orders: Order[] = [
  {
    id: 'ORD-001', table: 1,
    items: [
      { name: 'كلاسيك برغر', quantity: 2, price: 32, extras: ['جبنة شيدر'], customization: 'ويل دان' },
      { name: 'بطاطا مقلية', quantity: 2, price: 12 },
      { name: 'كولا', quantity: 2, price: 7 },
    ],
    total: 102, status: 'قيد التحضير', time: '12:30',
  },
  {
    id: 'ORD-002', table: 2,
    items: [
      { name: 'دبل سماش برغر', quantity: 1, price: 42, extras: ['بيكون لحم'] },
      { name: 'سبايسي برغر', quantity: 1, price: 35 },
      { name: 'تشيز فرايز', quantity: 1, price: 22 },
      { name: 'موهيتو', quantity: 2, price: 16 },
    ],
    total: 131, status: 'جديد', time: '12:45',
  },
  {
    id: 'ORD-003', table: 4,
    items: [
      { name: 'بي بي كيو برغر', quantity: 2, price: 40 },
      { name: 'راب دجاج مشوي', quantity: 2, price: 28 },
      { name: 'كنافة نابلسية', quantity: 3, price: 20 },
      { name: 'عصير برتقال طازج', quantity: 3, price: 14 },
      { name: 'حلقات بصل', quantity: 2, price: 15 },
    ],
    total: 268, status: 'قيد التحضير', time: '13:00',
  },
  {
    id: 'ORD-004', table: 7,
    items: [
      { name: 'تشيكن برغر', quantity: 2, price: 30 },
      { name: 'ناجتس دجاج', quantity: 2, price: 18 },
      { name: 'ميلك شيك', quantity: 2, price: 18, customization: 'شوكولاتة' },
    ],
    total: 132, status: 'جاهز', time: '12:15',
  },
  {
    id: 'ORD-005', table: 9,
    items: [
      { name: 'ماشروم برغر', quantity: 1, price: 38, extras: ['مشروم إضافي'] },
      { name: 'سلطة سيزر', quantity: 1, price: 20 },
      { name: 'مياه معدنية', quantity: 2, price: 5 },
    ],
    total: 68, status: 'تم التسليم', time: '11:45',
  },
  {
    id: 'ORD-006', table: 12,
    items: [
      { name: 'دبل سماش برغر', quantity: 2, price: 42 },
      { name: 'بطاطا مقلية', quantity: 2, price: 12 },
      { name: 'براونيز بالشوكولاتة', quantity: 2, price: 22 },
      { name: 'كولا', quantity: 3, price: 7 },
    ],
    total: 173, status: 'جديد', time: '13:10',
  },
  {
    id: 'ORD-007', table: 14,
    items: [
      { name: 'راب كريسبي تشيكن', quantity: 2, price: 30 },
      { name: 'بطاطا مقلية', quantity: 1, price: 12 },
      { name: 'تشيز كيك', quantity: 1, price: 25 },
    ],
    total: 97, status: 'قيد التحضير', time: '12:50',
  },
  {
    id: 'ORD-008', table: 3,
    items: [
      { name: 'راب فلافل', quantity: 2, price: 22 },
      { name: 'حلقات بصل', quantity: 1, price: 15 },
    ],
    total: 59, status: 'تم التسليم', time: '11:30',
  },
  {
    id: 'ORD-009', table: 5,
    items: [
      { name: 'سبايسي برغر', quantity: 1, price: 35, extras: ['هالابينو إضافي'] },
      { name: 'تشيز فرايز', quantity: 1, price: 22 },
      { name: 'ميلك شيك', quantity: 1, price: 18, customization: 'فراولة' },
    ],
    total: 78, status: 'تم التسليم', time: '11:15',
  },
  {
    id: 'ORD-010', table: 8,
    items: [
      { name: 'كلاسيك برغر', quantity: 3, price: 32 },
      { name: 'راب لحم مشوي', quantity: 2, price: 35 },
      { name: 'بطاطا مقلية', quantity: 3, price: 12 },
      { name: 'ناجتس دجاج', quantity: 2, price: 18 },
      { name: 'كولا', quantity: 5, price: 7 },
      { name: 'كنافة نابلسية', quantity: 3, price: 20 },
    ],
    total: 327, status: 'تم التسليم', time: '10:45',
  },
];

// ---------- 30-Day Sales ----------
export const dailySales: DailySales[] = [
  { date: '٨/٩', sales: 2450, orders: 32 },
  { date: '٨/١٠', sales: 2800, orders: 38 },
  { date: '٨/١١', sales: 3200, orders: 42 },
  { date: '٨/١٢', sales: 2900, orders: 35 },
  { date: '٨/١٣', sales: 3100, orders: 40 },
  { date: '٨/١٤', sales: 4200, orders: 55 },
  { date: '٨/١٥', sales: 4500, orders: 58 },
  { date: '٨/١٦', sales: 2600, orders: 33 },
  { date: '٨/١٧', sales: 2750, orders: 36 },
  { date: '٨/١٨', sales: 3000, orders: 39 },
  { date: '٨/١٩', sales: 2850, orders: 37 },
  { date: '٨/٢٠', sales: 3300, orders: 43 },
  { date: '٨/٢١', sales: 4100, orders: 53 },
  { date: '٨/٢٢', sales: 4800, orders: 62 },
  { date: '٨/٢٣', sales: 2700, orders: 35 },
  { date: '٨/٢٤', sales: 2950, orders: 38 },
  { date: '٨/٢٥', sales: 3150, orders: 41 },
  { date: '٨/٢٦', sales: 2800, orders: 36 },
  { date: '٨/٢٧', sales: 3400, orders: 44 },
  { date: '٨/٢٨', sales: 4300, orders: 56 },
  { date: '٨/٢٩', sales: 4600, orders: 60 },
  { date: '٨/٣٠', sales: 2550, orders: 34 },
  { date: '٨/٣١', sales: 2900, orders: 37 },
  { date: '٩/١', sales: 3100, orders: 40 },
  { date: '٩/٢', sales: 2750, orders: 36 },
  { date: '٩/٣', sales: 3250, orders: 42 },
  { date: '٩/٤', sales: 4400, orders: 57 },
  { date: '٩/٥', sales: 4900, orders: 64 },
  { date: '٩/٦', sales: 3050, orders: 39 },
  { date: '٩/٧', sales: 3350, orders: 43 },
];

// ---------- Best Sellers ----------
export const bestSellers = [
  { name: 'دبل سماش برغر', quantity: 340, revenue: 14280 },
  { name: 'كلاسيك برغر', quantity: 310, revenue: 9920 },
  { name: 'سبايسي برغر', quantity: 245, revenue: 8575 },
  { name: 'بطاطا مقلية', quantity: 420, revenue: 5040 },
  { name: 'تشيز فرايز', quantity: 195, revenue: 4290 },
  { name: 'راب كريسبي تشيكن', quantity: 180, revenue: 5400 },
  { name: 'كنافة نابلسية', quantity: 165, revenue: 3300 },
  { name: 'ميلك شيك', quantity: 210, revenue: 3780 },
  { name: 'كولا', quantity: 380, revenue: 2660 },
  { name: 'براونيز بالشوكولاتة', quantity: 140, revenue: 3080 },
];

// ---------- Busy Hours ----------
export const busyHours = [
  { hour: '10:00', orders: 5 },
  { hour: '11:00', orders: 12 },
  { hour: '12:00', orders: 28 },
  { hour: '13:00', orders: 35 },
  { hour: '14:00', orders: 22 },
  { hour: '15:00', orders: 10 },
  { hour: '16:00', orders: 8 },
  { hour: '17:00', orders: 15 },
  { hour: '18:00', orders: 25 },
  { hour: '19:00', orders: 38 },
  { hour: '20:00', orders: 42 },
  { hour: '21:00', orders: 30 },
  { hour: '22:00', orders: 18 },
  { hour: '23:00', orders: 8 },
];

// ---------- Add-on Conversion ----------
export const addonConversion = [
  { name: 'جبنة شيدر', offered: 450, accepted: 270, rate: 60 },
  { name: 'بطاطا مقلية', offered: 380, accepted: 247, rate: 65 },
  { name: 'مشروب', offered: 320, accepted: 224, rate: 70 },
  { name: 'بيكون لحم', offered: 280, accepted: 112, rate: 40 },
  { name: 'حلويات', offered: 250, accepted: 100, rate: 40 },
  { name: 'تشيز فرايز', offered: 200, accepted: 110, rate: 55 },
];

// ---------- Branches ----------
export const branches: BranchData[] = [
  { id: 'nablus', name: 'Burger House نابلس', city: 'نابلس', tables: 15, todaySales: 3350, todayOrders: 43 },
  { id: 'ramallah', name: 'Burger House رام الله', city: 'رام الله', tables: 12, todaySales: 2800, todayOrders: 36 },
];

// ---------- Summary Stats ----------
export const summaryStats = {
  totalSales30Days: 98650,
  totalOrders30Days: 1284,
  averageOrderValue: 76.8,
  qrOrdersPercentage: 72,
  totalTables: 15,
  occupiedTables: 7,
  reservedTables: 2,
  customersToday: 43,
  revenueGrowth: 18.5,
  ordersGrowth: 12.3,
};

// ---------- AI Assistant Responses ----------
export const aiResponses: Record<string, { answer: string }> = {
  'شو أكثر صنف ببيع عندي؟': {
    answer: `أكثر صنف مبيعًا عندك هو **"دبل سماش برغر"** بـ 340 طلب خلال آخر 30 يوم، وإيراد إجمالي 14,280₪.

بعده مباشرة:
- **كلاسيك برغر**: 310 طلب (9,920₪)
- **بطاطا مقلية**: 420 طلب (5,040₪) — الأكثر طلبًا كمية لكن بإيراد أقل لأن سعرها منخفض
- **سبايسي برغر**: 245 طلب (8,575₪)

💡 **نصيحة**: حاول تحط "دبل سماش برغر" في أول المنيو وفي الأوفرات عشان تزيد المبيعات أكثر.`,
  },
  'كيف أزيد متوسط الطلب؟': {
    answer: `متوسط الطلب الحالي عندك **76.8₪**. هون شوية طرق تزيده:

1. **فعّل الـ Upselling الذكي** — نسبة قبول الإضافات عندك حاليًا:
   - مشروبات: 70% قبول ✅
   - بطاطا مقلية: 65% قبول ✅
   - جبنة شيدر: 60% قبول
   - حلويات: 40% قبول ⚠️

2. **أضف عروض كومبو** — مثلاً "برغر + بطاطا + مشروب" بخصم 10%

3. **حسّن عرض الحلويات** — نسبة القبول 40% بس. جرّب تضيف صور أحلى وعرض خاص "أضف حلى بـ 15₪ بس"

📊 لو زدت نسبة قبول الحلويات لـ 55%، المتوسط رح يصير تقريبًا **82₪** (+6.7%).`,
  },
  'أي ساعة لازم أزيد فيها الموظفين؟': {
    answer: `بناءً على بيانات آخر 30 يوم، عندك **ذروتين واضحتين**:

🔴 **ذروة الغداء: 12:00 - 14:00**
- الساعة 13:00 هي الأعلى: 35 طلب/ساعة
- بتحتاج 3-4 موظفين إضافيين بهالفترة

🔴 **ذروة العشاء: 19:00 - 21:00**
- الساعة 20:00 هي الأعلى: 42 طلب/ساعة ⚡
- بتحتاج 4-5 موظفين إضافيين

🟢 **ساعات هادئة: 15:00 - 17:00**
- 8-10 طلبات/ساعة بس
- ممكن تقلل لموظف واحد بالمطبخ

💡 **نصيحة**: يوم الجمعة والسبت الذروة بتكون أعلى بـ 30%. خطط لموظفين إضافيين نهاية الأسبوع.`,
  },
  'شو أحسن يوم بالأسبوع عندي؟': {
    answer: `بناءً على بيانات الشهر الماضي:

🥇 **السبت** — أفضل يوم: متوسط 4,650₪ مبيعات و 61 طلب
🥈 **الجمعة** — ثاني أفضل: متوسط 4,250₪ مبيعات و 55 طلب
🥉 **الأربعاء** — مفاجأة! متوسط 3,300₪ و 43 طلب

📉 **أضعف يوم**: الأحد — متوسط 2,600₪ و 34 طلب

💡 **اقتراح**: جرّب عروض خاصة يوم الأحد والاثنين عشان ترفع المبيعات.`,
  },
  'كيف أداء الفروع؟': {
    answer: `عندك فرعين حاليًا:

🏢 **Burger House نابلس** (الرئيسي)
- مبيعات اليوم: 3,350₪
- طلبات اليوم: 43
- متوسط الطلب: 77.9₪
- نسبة الإشغال: 47% (7/15 طاولة)

🏢 **Burger House رام الله**
- مبيعات اليوم: 2,800₪
- طلبات اليوم: 36
- متوسط الطلب: 77.8₪
- نسبة الإشغال: 42% (5/12 طاولة)

📊 **المقارنة**: فرع نابلس أعلى بـ 19.6% بالمبيعات. لكن لو قسمنا على عدد الطاولات، الأداء متقارب جدًا.

💡 **اقتراح**: فرع رام الله عنده إمكانية نمو. جرّب حملة تسويقية محلية.`,
  },
};

// ---------- FAQ Data ----------
export const faqItems = [
  {
    question: 'كيف أبدأ باستخدام Menus.ps؟',
    answer: 'بتقدر تبدأ بخطوات بسيطة: سجّل حسابك، أضف أصناف المنيو، طبع كود QR لكل طاولة، وابدأ استقبل الطلبات! فريقنا بساعدك بكل خطوة.',
  },
  {
    question: 'هل بحتاج أجهزة خاصة؟',
    answer: 'لا! Menus.ps بشتغل على أي جهاز عنده متصفح إنترنت. الزبائن بستخدموا تلفوناتهم، وإنت بتقدر تدير كل شي من لابتوب أو تابلت أو حتى من تلفونك.',
  },
  {
    question: 'كيف الزبون بيطلب؟',
    answer: 'الزبون بيمسح كود QR الموجود على الطاولة، بيفتح المنيو الرقمي، بيختار الأصناف وبيخصصها، وبيبعت الطلب مباشرة للمطبخ. ما في حاجة لتطبيق!',
  },
  {
    question: 'شو يعني "جلسة طاولة مشتركة"؟',
    answer: 'لما مجموعة أشخاص على نفس الطاولة يمسحوا كود QR، كل واحد بيقدر يضيف أصنافه على نفس الطلب. هيك كل واحد بيطلب اللي بده إياه وبالآخر الحساب بيكون واحد.',
  },
  {
    question: 'كيف بشتغل الـ Upselling الذكي؟',
    answer: 'النظام بيقترح إضافات ذكية بناءً على اللي الزبون اختاره. مثلاً لو طلب برغر، بيقترح له بطاطا ومشروب. هاد بيزيد متوسط الطلب بنسبة 20-35%!',
  },
  {
    question: 'هل بقدر أشوف تقارير وتحليلات؟',
    answer: 'أكيد! عندك لوحة تحليلات كاملة بتوريك المبيعات، أكثر الأصناف مبيعًا، ساعات الذروة، نسبة قبول الإضافات، وكثير غيرها. كمان عندك مساعد ذكاء اصطناعي بيحلل البيانات ويعطيك نصائح.',
  },
  {
    question: 'كم سعر الاشتراك؟',
    answer: 'الاشتراك بـ Menus.ps Pro هو 250₪ شهريًا فقط، وبيشمل كل المميزات بدون حدود. كمان عندك تجربة مجانية عشان تجرب النظام قبل ما تلتزم.',
  },
  {
    question: 'هل في دعم فني؟',
    answer: 'نعم! فريق الدعم متوفر عبر واتساب وتلفون من الساعة 9 صباحًا لـ 10 مساءً. كمان عندنا قاعدة معرفة شاملة وفيديوهات تعليمية.',
  },
  {
    question: 'هل بقدر أدير أكثر من فرع؟',
    answer: 'نعم! مع Menus.ps بتقدر تدير كل فروعك من لوحة تحكم واحدة. بتقدر تقارن الأداء بين الفروع وتشوف تقارير منفصلة أو مجمّعة.',
  },
  {
    question: 'هل البيانات آمنة؟',
    answer: 'طبعًا! بنستخدم أعلى معايير الأمان والتشفير لحماية بياناتك وبيانات زبائنك. كل البيانات مخزنة على سيرفرات آمنة مع نسخ احتياطية يومية.',
  },
];
