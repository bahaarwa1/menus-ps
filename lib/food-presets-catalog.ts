// ============================================================
// Menus.ps — Rich Categorized Food Photos & Dish Templates Catalog
// ============================================================

export interface FoodPhotoItem {
  name: string;
  category: string;
  url: string;
}

export interface DishTemplateItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  popular?: boolean;
  spicy?: boolean;
  categoryGroup: string;
}

// ------------------------------------------------------------
// 1. Rich Categorized Food Photos (أكثر من 60 صورة طعام عالية الجودة)
// ------------------------------------------------------------
export const FOOD_PHOTO_CATEGORIES = [
  { id: 'all', name: 'الكل 🍽️' },
  { id: 'burgers', name: 'برجر وساندويش 🍔' },
  { id: 'crispy', name: 'دجاج كرسبي 🍗' },
  { id: 'shawarma', name: 'شاورما وتورتيلا 🌯' },
  { id: 'pizza', name: 'بيتزا ومعجنات 🍕' },
  { id: 'grills', name: 'مشاوي ولحوم 🥩' },
  { id: 'sides', name: 'مقبلات وبطاطا 🍟' },
  { id: 'salads', name: 'سلطات 🥗' },
  { id: 'desserts', name: 'حلويات 🍰' },
  { id: 'drinks', name: 'مشروبات وعصائر 🥤' },
  { id: 'coffee', name: 'قهوة وساخن ☕' },
];

export const RICH_FOOD_PHOTOS: FoodPhotoItem[] = [
  // --- Burgers ---
  { name: 'كلاسيك بيف برجر', category: 'burgers', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { name: 'دبل سماش برجر بالجبنة', category: 'burgers', url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80' },
  { name: 'تشيكن برجر مقرمش', category: 'burgers', url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80' },
  { name: 'ماشروم سويس برجر', category: 'burgers', url: 'https://images.unsplash.com/photo-1583032015879-661702f2316e?w=600&auto=format&fit=crop&q=80' },
  { name: 'سبايسي هالابينو برجر', category: 'burgers', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80' },
  { name: 'سموكي باربكيو بيكون برجر', category: 'burgers', url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80' },
  { name: 'ميني سلايدرز برجر', category: 'burgers', url: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&auto=format&fit=crop&q=80' },

  // --- Crispy Chicken ---
  { name: 'وجبة كرسبي دجاج ذهبي', category: 'crispy', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80' },
  { name: 'ستربس دجاج مقرمش', category: 'crispy', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { name: 'بروستد دجاج حار', category: 'crispy', url: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=600&auto=format&fit=crop&q=80' },
  { name: 'أجنحة دجاج بافلو حارة', category: 'crispy', url: 'https://images.unsplash.com/photo-1527477378377-f8e12140bb86?w=600&auto=format&fit=crop&q=80' },
  { name: 'تندر دجاج مع صوص رانش', category: 'crispy', url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80' },
  { name: 'ناجتس دجاج مقرمشة', category: 'crispy', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },

  // --- Shawarma & Wraps ---
  { name: 'شاورما عربي دجاج مع بطاطا', category: 'shawarma', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80' },
  { name: 'ساندويش شاورما لحم صاج', category: 'shawarma', url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80' },
  { name: 'راب تورتيلا دجاج فاهيتا', category: 'shawarma', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80' },
  { name: 'ساندويش فلافل فلسطيني', category: 'shawarma', url: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=600&auto=format&fit=crop&q=80' },
  { name: 'راب كاساديا مكسيكية', category: 'shawarma', url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80' },

  // --- Pizzas ---
  { name: 'بيتزا مارغريتا إيطالية', category: 'pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { name: 'بيتزا بيبروني فاخرة', category: 'pizza', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80' },
  { name: 'بيتزا خضار مشكلة', category: 'pizza', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80' },
  { name: 'بيتزا دجاج باربكيو', category: 'pizza', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80' },
  { name: 'بيتزا أربعة أجبان (فور تشيز)', category: 'pizza', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&auto=format&fit=crop&q=80' },

  // --- Grills & Steaks ---
  { name: 'ستيك ريب آي مشوي بالزبدة', category: 'grills', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { name: 'مشاوي مشكلة لحم وكباب', category: 'grills', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80' },
  { name: 'شيش طاووق دجاج متبل', category: 'grills', url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80' },
  { name: 'كباب لحم عرايس وفحم', category: 'grills', url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80' },

  // --- Sides & Appetizers ---
  { name: 'بطاطا مقلية ذهبية', category: 'sides', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80' },
  { name: 'بطاطا ودجز مقرمشة بالأعشاب', category: 'sides', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80' },
  { name: 'تشيز فرايز بصوص الشيدر', category: 'sides', url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80' },
  { name: 'حلقات بصل كرسبي', category: 'sides', url: 'https://images.unsplash.com/photo-1639024471287-032f66ab7577?w=600&auto=format&fit=crop&q=80' },
  { name: 'أصابع جبنة موزاريلا مقلية', category: 'sides', url: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&auto=format&fit=crop&q=80' },

  // --- Salads ---
  { name: 'سلطة سيزر دجاج بجبنة بارميزان', category: 'salads', url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80' },
  { name: 'سلطة يونانية بالجبنة الفيتا', category: 'salads', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' },
  { name: 'سلطة خضراء صحية منوعة', category: 'salads', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },

  // --- Desserts ---
  { name: 'فادج براونيز بالشوكولاتة الساخنة', category: 'desserts', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
  { name: 'نيويورك تشيز كيك بالتوت', category: 'desserts', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80' },
  { name: 'وافل بلجيكي بالنوتيلا والفواكه', category: 'desserts', url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80' },
  { name: 'كريب شوكولاتة وفراولة', category: 'desserts', url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=80' },
  { name: 'كنافة نابلسية بالجبنة والفستق', category: 'desserts', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80' },
  { name: 'آيس كريم جيلاتو إيطالي', category: 'desserts', url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80' },

  // --- Cold Drinks & Juices ---
  { name: 'موهيتو ليمون ونعناع منعش', category: 'drinks', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  { name: 'عصير برتقال طبيعي طازج', category: 'drinks', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80' },
  { name: 'ميلك شيك شوكولاتة غني', category: 'drinks', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80' },
  { name: 'كوكا كولا مثلجة مع ليمون', category: 'drinks', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80' },
  { name: 'سموذي مانجو وفراولة طبيعي', category: 'drinks', url: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80' },

  // --- Coffee & Hot Drinks ---
  { name: 'كابتشينو برغوة كريمية', category: 'coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
  { name: 'سبانش لاتيه مثلج', category: 'coffee', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80' },
  { name: 'إسبريسو دبل شوت إيطالي', category: 'coffee', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80' },
  { name: 'هوت شوكليت بالمارشميلو', category: 'coffee', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80' },
];

// ------------------------------------------------------------
// 2. Popular Dish Templates for Quick 1-Click Menu Building
// ------------------------------------------------------------
export const POPULAR_DISH_TEMPLATES: DishTemplateItem[] = [
  // --- Burgers ---
  {
    id: 'tpl_burger_classic',
    name: 'كلاسيك بيف برجر',
    category: 'برجر',
    categoryGroup: 'burgers',
    price: 32,
    description: 'لحم بقري طازج ١٥٠غ مع جبنة شيدر ذائبة، خس، طماطم، مخلل وصوص خاص بخبز البريوش',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_burger_smash',
    name: 'دبل سماش برجر',
    category: 'برجر',
    categoryGroup: 'burgers',
    price: 42,
    description: 'شريحتي لحم بلدي سماش مقرمشة الأطراف مع طبقتين جبنة شيدر وصوص سماش السري',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_burger_chicken',
    name: 'تشيكن برجر مقرمش',
    category: 'برجر',
    categoryGroup: 'burgers',
    price: 30,
    description: 'صدر دجاج مقلي ذهبي ومقرمش مع كول سلو وصوص رانش مدخن',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_burger_mushroom',
    name: 'ماشروم سويس برجر',
    category: 'برجر',
    categoryGroup: 'burgers',
    price: 38,
    description: 'لحم بقر طازج مغطى بفطر سوتيه بالزبدة وجبنة إيمنتال سويسرية فاخرة',
    image: 'https://images.unsplash.com/photo-1583032015879-661702f2316e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_burger_spicy',
    name: 'سبايسي زيلو برجر',
    category: 'برجر',
    categoryGroup: 'burgers',
    price: 36,
    description: 'لحم بقر مع صوص فلفل حار، قطع هالابينو مكسيكي وجبنة فلفل جاك حارة',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    spicy: true,
  },

  // --- Crispy Chicken ---
  {
    id: 'tpl_crispy_meal',
    name: 'وجبة كرسبي سوبريم',
    category: 'دجاج كرسبي',
    categoryGroup: 'crispy',
    price: 35,
    description: '٤ قطع صدر دجاج مقرمش ذهبي مع بطاطا ودجز متبلة وصوص باربكيو وثومية',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_crispy_strips',
    name: 'ستربس دجاج مقرمش ٥ قطع',
    category: 'دجاج كرسبي',
    categoryGroup: 'crispy',
    price: 28,
    description: 'أصابع فيليه دجاج مقرمشة بتتبيلة خاصة مع صوص الخردل بالعسل والكاتشب',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_crispy_wings',
    name: 'أجنحة دجاج حارة (بافلو)',
    category: 'دجاج كرسبي',
    categoryGroup: 'crispy',
    price: 26,
    description: '٨ قطع أجنحة دجاج مقرمشة مغطاة بصوص البافلو الحار وتقدم مع صوص رانش',
    image: 'https://images.unsplash.com/photo-1527477378377-f8e12140bb86?w=600&auto=format&fit=crop&q=80',
    spicy: true,
  },

  // --- Shawarma & Wraps ---
  {
    id: 'tpl_shawarma_arabi',
    name: 'شاورما عربي دجاج دبل',
    category: 'شاورما وساندويش',
    categoryGroup: 'shawarma',
    price: 32,
    description: 'وجبة شاورما دجاج مقطعة بخبز الصاج مع بطاطا، مخلل، وصوص ثومية فاخرة',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_shawarma_meat',
    name: 'ساندويش شاورما لحم عجل',
    category: 'شاورما وساندويش',
    categoryGroup: 'shawarma',
    price: 26,
    description: 'شرائح لحم عجل متبلة مع بقدونس وبصل وسماق وطحينة سمسم فاخرة',
    image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_wrap_fajita',
    name: 'راب فاهيتا دجاج مكسيكي',
    category: 'شاورما وساندويش',
    categoryGroup: 'shawarma',
    price: 30,
    description: 'دجاج متبل مع فلفل ملون، بصل مشوي، جبنة موزاريلا وصوص مكسيكي بالخبز المحمص',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
  },

  // --- Pizzas ---
  {
    id: 'tpl_pizza_margherita',
    name: 'بيتزا مارغريتا إيطالية',
    category: 'بيتزا ومعجنات',
    categoryGroup: 'pizza',
    price: 36,
    description: 'صلصة طماطم إيطالية مع جبنة موزاريلا طازجة، ريحان بري وزيت زيتون بكر',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_pizza_pepperoni',
    name: 'بيتزا بيبروني فاخرة',
    category: 'بيتزا ومعجنات',
    categoryGroup: 'pizza',
    price: 44,
    description: 'شرائح بيبروني بقري مدخن مع جبنة موزاريلا وصوص طماطم إيطالي غني',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_pizza_bbq_chicken',
    name: 'بيتزا دجاج باربكيو',
    category: 'بيتزا ومعجنات',
    categoryGroup: 'pizza',
    price: 42,
    description: 'قطع دجاج مشوية بصوص الباربكيو المدخن مع بصل أحمر وجبنة موزاريلا',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
  },

  // --- Grills ---
  {
    id: 'tpl_grill_ribeye',
    name: 'ستيك ريب آي عجل مشوي',
    category: 'مشاوي ولحوم',
    categoryGroup: 'grills',
    price: 65,
    description: 'شريحة ستيك عجل ٣٠٠غ مشوية على اللهب مع خضار سوتيه وصوص الفلفل الأسود والزبدة',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_grill_tawook',
    name: 'صحن شيش طاووق مشوي',
    category: 'مشاوي ولحوم',
    categoryGroup: 'grills',
    price: 40,
    description: 'أسياخ صدر دجاج طازج متبلة باللبن والبهارات الشرقية مع خبز بيواز وثومية',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_grill_kebab',
    name: 'كباب لحم بلدي مشوي',
    category: 'مشاوي ولحوم',
    categoryGroup: 'grills',
    price: 45,
    description: 'لحم خروف وعجل مفروم مع بصل وبقدونس مشوي على الفحم يقدم مع بطاطا وصوص طحينة',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80',
  },

  // --- Sides & Fries ---
  {
    id: 'tpl_side_fries',
    name: 'بطاطا مقلية مقرمشة',
    category: 'أطباق جانبية',
    categoryGroup: 'sides',
    price: 12,
    description: 'بطاطا ذهبية مقلية مقرمشة ومملحة تقدم ساخنة مع كاتشب ومايونيز',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_side_cheese_fries',
    name: 'تشيز فرايز بالجبنة السائلة',
    category: 'أطباق جانبية',
    categoryGroup: 'sides',
    price: 20,
    description: 'بطاطا مقلية ساخنة مغطاة بصوص جبنة شيدر الذائبة وهالابينو مخلل',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_side_onion_rings',
    name: 'حلقات بصل كرسبي',
    category: 'أطباق جانبية',
    categoryGroup: 'sides',
    price: 15,
    description: 'حلقات بصل طازجة مغلفة بالبقسماط الذهبي المقرمش مع صوص تكساس رانش',
    image: 'https://images.unsplash.com/photo-1639024471287-032f66ab7577?w=600&auto=format&fit=crop&q=80',
  },

  // --- Salads ---
  {
    id: 'tpl_salad_caesar',
    name: 'سلطة سيزر الدجاج',
    category: 'أطباق جانبية',
    categoryGroup: 'salads',
    price: 25,
    description: 'خس روماني طازج مع قطع دجاج مشوي، كروتون محمص، جبنة بارميزان وصوص سيزر إيطالي',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_salad_greek',
    name: 'سلطة يونانية بالفيتا',
    category: 'أطباق جانبية',
    categoryGroup: 'salads',
    price: 22,
    description: 'خيار، طماطم، بصل أحمر، زيتون كالاماتا وجبنة فيتا يونانية بزيت الزيتون والأوريغانو',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  },

  // --- Desserts ---
  {
    id: 'tpl_dessert_brownie',
    name: 'فادج براونيز بالشوكولاتة',
    category: 'حلويات',
    categoryGroup: 'desserts',
    price: 22,
    description: 'قطعة براونيز ساخنة بقلب شوكولاتة ذائبة تقدم مع كرة آيس كريم فانيلا',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_dessert_cheesecake',
    name: 'نيويورك تشيز كيك بالتوت',
    category: 'حلويات',
    categoryGroup: 'desserts',
    price: 25,
    description: 'تشيز كيك مخبوزة على طبقة بسكويت زبدة مقرمشة ومغطاة بصوص توت بري طازج',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_dessert_waffle',
    name: 'وافل بلجيكي بالنوتيلا',
    category: 'حلويات',
    categoryGroup: 'desserts',
    price: 24,
    description: 'وافل مقرمش ومحمص مغطى بشوكولاتة نوتيلا الأصلية وقطع موز وفراولة طازجة',
    image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_dessert_kunafa',
    name: 'كنافة نابلسية بالجبنة',
    category: 'حلويات',
    categoryGroup: 'desserts',
    price: 20,
    description: 'كنافة نابلسية أصلية بجبنة بلدية طازجة مع فستق حلبي محمص وقطر خفيف',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },

  // --- Drinks ---
  {
    id: 'tpl_drink_mojito',
    name: 'موهيتو ليمون ونعناع منعش',
    category: 'مشروبات',
    categoryGroup: 'drinks',
    price: 16,
    description: 'موهيتو مثلج مع أوراق النعناع الطازجة وعصير الليمون المنعش ومياه صودا فوارة',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    popular: true,
  },
  {
    id: 'tpl_drink_orange',
    name: 'عصير برتقال طبيعي طازج',
    category: 'مشروبات',
    categoryGroup: 'drinks',
    price: 14,
    description: 'عصير برتقال يافاوي طازج معصور فور الطلب ١٠٠٪ بدون سكر مضاف',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_drink_milkshake',
    name: 'ميلك شيك شوكولاتة بلجيكية',
    category: 'مشروبات',
    categoryGroup: 'drinks',
    price: 18,
    description: 'ميلك شيك بارد غني بآيس كريم الشوكولاتة وحليب طازج مع كريمة مخفوقة',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_drink_cola',
    name: 'كوكا كولا مثلجة',
    category: 'مشروبات',
    categoryGroup: 'drinks',
    price: 7,
    description: 'علبة كان باردة ٣٣٠مل تقدم مع كأس ثلج وشريحة ليمون',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
  },
];

// Helper to reliably find an appetizing HD photo for any dish name
export function matchFoodPhoto(name?: string): string {
  if (!name) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
  const clean = name.trim().toLowerCase();

  // 1. Direct match with popular dish templates
  const templateMatch = POPULAR_DISH_TEMPLATES.find((t) => 
    t.name.toLowerCase() === clean || clean.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(clean)
  );
  if (templateMatch?.image) return templateMatch.image;

  // 2. Keyword intelligent matching
  if (/جاج|دجاج|كرسبي|ستربس|بروستد|chicken|crispy|wings|أجنحة/.test(clean)) {
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80';
  }
  if (/بيتزا|pizza|مارغريتا|بيبروني/.test(clean)) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
  }
  if (/شاورما|shawarma|بسشب|تورتيلا|wrap|ساندويش|سندويش/.test(clean)) {
    return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80';
  }
  if (/برجر|burger|سماش|بيف/.test(clean)) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
  }
  if (/سلطه|سلطة|salad|فتوش|تبولة|يونانية/.test(clean)) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80';
  }
  if (/حلو|كيك|تشيز|وافل|كريب|شوكولاتة|dessert|cake/.test(clean)) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80';
  }
  if (/مشاوي|كباب|ستيك|لحم|شقف|كفتة|grill|steak|meat/.test(clean)) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80';
  }
  if (/بطاطا|fries|ودجز|أصابع/.test(clean)) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80';
  }
  if (/عصير|كولا|موهيتو|مشروب|ليمون|برتقال|drink|juice|soda/.test(clean)) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80';
  }
  if (/قهوة|كافيه|لاتيه|اسبريسو|شاي|coffee|tea|latte/.test(clean)) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80';
  }

  // Default appetizing food photo
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
}
