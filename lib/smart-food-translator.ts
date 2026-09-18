/**
 * Smart Bilingual Food & Menu Translation Engine
 * Translates Arabic menu items, categories, descriptions, extras, and badges
 * into high-end restaurant English (and vice versa) with fuzzy matching,
 * tokenization, and compound food phrase recognition.
 */

// 1. Direct item & dish dictionary
const FOOD_DICTIONARY: Record<string, string> = {
  // Basics & Poultry
  'دجاج': 'Crispy Chicken',
  'فراخ': 'Fresh Chicken',
  'دجاج مقلي': 'Fried Chicken',
  'دجاج مشوي': 'Grilled Chicken',
  'بروستد': 'Crispy Broasted Chicken',
  'مسحب': 'Crispy Chicken Musahab',
  'بسشب': 'Crispy Strips / Musahab', // Handling user typo
  'زنجر': 'Zinger Spicy Chicken',
  'كرسبي': 'Crispy Chicken Tenders',
  'ستربس': 'Chicken Strips',
  'شيش طاووق': 'Shish Tawook Skewers',
  'شاورما': 'Shawarma',
  'شاورما دجاج': 'Chicken Shawarma',
  'شاورما لحم': 'Beef Shawarma',
  'فاهيتا': 'Chicken Fajita',
  'كوردون بلو': 'Chicken Cordon Bleu',
  'جوانح': 'Buffalo Chicken Wings',
  'اجنحة': 'Chicken Wings',
  'أجنحة دجاج': 'Chicken Wings',
  'ناغتس': 'Chicken Nuggets',
  'ناجتس': 'Chicken Nuggets',

  // Meat & Grills
  'لحم': 'Tender Meat / Beef',
  'لحمة': 'Beef',
  'كباب': 'Grilled Kabab',
  'كفتة': 'Kofta Plate',
  'مشاوي': 'Mixed BBQ Grills',
  'مشاوي مشكلة': 'Mixed Grill Platter',
  'ستيك': 'Beef Steak',
  'ريش': 'Lamb Chops',
  'شقف': 'Shish Kebab Cubes',

  // Burgers
  'برجر': 'Gourmet Burger',
  'برغر': 'Gourmet Burger',
  'همبرجر': 'Beef Burger',
  'همبرغر': 'Beef Burger',
  'برجر لحم': 'Classic Beef Burger',
  'برجر دجاج': 'Crispy Chicken Burger',
  'سماش برجر': 'Smash Burger',
  'دبل برجر': 'Double Patty Burger',
  'تشيز برجر': 'Cheeseburger',
  'بيكون برجر': 'Smoked Bacon Burger',
  'مشروم برجر': 'Mushroom Swiss Burger',

  // Pizza & Italian
  'بيتزا': 'Artisan Pizza',
  'بيتزا مارغريتا': 'Margherita Pizza',
  'بيتزا مارجريتا': 'Margherita Pizza',
  'بيتزا بيبروني': 'Pepperoni Pizza',
  'بيتزا خضار': 'Vegetarian Pizza',
  'بيتزا دجاج': 'BBQ Chicken Pizza',
  'بيتزا فور تشيز': 'Four Cheese Pizza',
  'بيتزا أربعة أجبان': 'Four Cheese Pizza',
  'باستا': 'Italian Pasta',
  'معكرونة': 'Pasta',
  'فتوتشيني': 'Fettuccine Alfredo',
  'لازانيا': 'Lasagna Bolognese',
  'بينيه': 'Penne Arrabbiata',

  // Sandwiches & Wraps
  'ساندويش': 'Sandwich',
  'ساندوتش': 'Sandwich',
  'سندويشة': 'Sandwich',
  'راب': 'Tortilla Wrap',
  'تورتيلا': 'Tortilla Wrap',
  'كلوب ساندويش': 'Club Sandwich',
  'هوت دوغ': 'Hot Dog',
  'فلافل': 'Falafel Sandwich',
  'حمص': 'Hummus Plate',
  'حمص باللحمة': 'Hummus with Beef',
  'متبل': 'Mutabbal / Baba Ghanoush',
  'قلاية بندورة': 'Tomato Skillet (Galayet Bandora)',

  // Salads
  'سلطه': 'Fresh Salad',
  'سلطة': 'Fresh Salad',
  'سلطة سيزر': 'Caesar Salad',
  'سيزر': 'Caesar Salad',
  'سلطة يونانية': 'Greek Salad',
  'يونانية': 'Greek Salad',
  'فتوش': 'Fattoush Salad',
  'تبولة': 'Tabbouleh Salad',
  'جرجير': 'Rocca Arugula Salad',
  'سلطة جرجير': 'Rocca Salad with Parmesan',
  'سلطة خضراء': 'Garden Fresh Salad',
  'كول سلو': 'Coleslaw Salad',

  // Sides & Appetizers
  'مقبلات': 'Appetizers & Starters',
  'بطاطا': 'French Fries',
  'بطاطس': 'French Fries',
  'بطاطا مقلية': 'Golden French Fries',
  'بطاطا ودجز': 'Potato Wedges',
  'حلقات بصل': 'Crispy Onion Rings',
  'اصابع موزاريلا': 'Mozzarella Sticks',
  'أصابع موزاريلا': 'Mozzarella Sticks',
  'سمبوسك': 'Cheese & Meat Sambousek',
  'كبة': 'Fried Kibbeh',
  'يلنجي': 'Stuffed Grape Leaves',
  'ورق عنب': 'Grape Leaves (Warak Enab)',

  // Drinks & Beverages
  'مشروب': 'Beverage / Soft Drink',
  'مشروبات': 'Beverages & Soft Drinks',
  'مشروبات غازية': 'Soft Drinks',
  'كولا': 'Coca-Cola',
  'بيبسي': 'Pepsi',
  'سفن اب': '7Up',
  'سبرايت': 'Sprite',
  'فانتا': 'Fanta Orange',
  'ميرندا': 'Mirinda',
  'ماء': 'Mineral Water',
  'مياه معدنية': 'Bottled Water',
  'عصير': 'Fresh Juice',
  'عصير برتقال': 'Fresh Orange Juice',
  'عصير ليمون': 'Lemonade Juice',
  'ليموناضة': 'Fresh Lemonade',
  'ليمون ونعناع': 'Lemon Mint Juice',
  'موهيتو': 'Iced Mojito',
  'ميلك شيك': 'Creamy Milkshake',
  'سموذي': 'Fruit Smoothie',
  'ايس كوفي': 'Iced Coffee',
  'قهوة': 'Arabic / Brewed Coffee',
  'اسبريسو': 'Espresso',
  'كابتشينو': 'Cappuccino',
  'لاتيه': 'Cafe Latte',
  'شاي': 'Hot Tea',
  'شاي بالنعناع': 'Mint Tea',

  // Desserts
  'حلويات': 'Desserts',
  'حلو': 'Dessert',
  'كنافة': 'Traditional Knafeh',
  'وافل': 'Belgian Waffle',
  'كريب': 'Sweet Crepe',
  'بان كيك': 'Fluffy Pancakes',
  'تشيز كيك': 'Cheesecake',
  'كيك': 'Cake',
  'كعكة': 'Cake',
  'مولتن كيك': 'Molten Lava Cake',
  'براونيز': 'Chocolate Brownie',
  'بوظة': 'Ice Cream',
  'ايس كريم': 'Ice Cream',
  'سوفليه': 'Chocolate Soufflé',

  // Sauces & Extras
  'صوص': 'Special Sauce',
  'صلصة': 'Sauce',
  'مايونيز': 'Mayonnaise',
  'كاتشب': 'Ketchup',
  'رانش': 'Ranch Dressing',
  'باربيكيو': 'BBQ Sauce',
  'خردل': 'Mustard',
  'ثومية': 'Garlic Dip',
  'طحينية': 'Tahini Dip',
  'جبنة': 'Melted Cheese',
  'شيدر': 'Cheddar Cheese',
  'موزاريلا': 'Mozzarella Cheese',
  'هالبينو': 'Jalapeño Peppers',
  'فطر': 'Fresh Mushrooms',
  'مشروم': 'Mushrooms',
  'بصل مكرمل': 'Caramelized Onions',
  'مخلل': 'Pickles',
  'خبز': 'Fresh Bread',
};

// 2. Category translations
const CATEGORY_DICTIONARY: Record<string, string> = {
  'الكل': 'All',
  'كل': 'All',
  'الأطباق الرئيسية': 'Main Dishes',
  'الاطباق الرئيسية': 'Main Dishes',
  'أطباق رئيسية': 'Main Dishes',
  'وجبات رئيسية': 'Main Courses',
  'السلطات': 'Salads',
  'سلطات': 'Salads',
  'المقبلات': 'Appetizers & Starters',
  'مقبلات': 'Appetizers',
  'المشروبات': 'Beverages',
  'مشروبات': 'Beverages & Drinks',
  'عصائر': 'Fresh Juices',
  'الحلويات': 'Desserts',
  'حلويات': 'Desserts',
  'برجر': 'Burgers',
  'برغر': 'Burgers',
  'سندويشات': 'Sandwiches',
  'ساندوتشات': 'Sandwiches',
  'بيتزا': 'Pizza & Italian',
  'معجنات': 'Pastries & Pies',
  'شاورما': 'Shawarma',
  'مشاوي': 'BBQ & Grills',
  'وجبات سريعة': 'Fast Food',
  'إضافات': 'Side Orders & Extras',
  'صوصات': 'Sauces & Dips',
  'عروض': 'Special Offers',
  'عروض خاصة': 'Special Deals',
};

// 3. Common words and modifier tokens for compound dishes
const TOKEN_TRANSLATIONS: Record<string, string> = {
  'مع': 'with',
  'و': 'and',
  'أو': 'or',
  'كبير': 'Large',
  'وسط': 'Medium',
  'صغير': 'Small',
  'عائلي': 'Family Size',
  'حار': 'Spicy',
  'سبايسي': 'Spicy',
  'حار جدا': 'Extra Spicy',
  'مقلي': 'Crispy Fried',
  'مشوي': 'Charcoal Grilled',
  'طازج': 'Fresh',
  'مقرمش': 'Crunchy Crispy',
  'مزدوج': 'Double',
  'ثلاثي': 'Triple',
  'إكسترا': 'Extra',
  'اكسترا': 'Extra',
  'وجبة': 'Meal',
  'كومبو': 'Combo',
  'عرض': 'Special Deal',
  'خاص': 'Special',
  'مميز': 'Signature',
  'فاخر': 'Deluxe',
  'مدخن': 'Smoked',
  'بالجبنة': 'with Cheese',
  'بالجبن': 'with Melted Cheese',
  'بالثوم': 'with Garlic Sauce',
  'بالباربيكيو': 'with BBQ Glaze',
  'بالصلصة': 'in Savory Sauce',
  'بالفطر': 'with Sautéed Mushrooms',
  'بالليمون': 'with Lemon',
  'بدون': 'without',
  'بطاطا': 'Fries',
  'مشروب': 'Drink',
  'بيبسي': 'Pepsi',
  'كولا': 'Coke',
};

/**
 * Normalizes Arabic string for resilient dictionary lookup:
 * removes diacritics, unifies alef, taa marbuta, etc.
 */
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

/**
 * Translates a dish/item name smartly.
 * If targetLang is 'ar', returns original or best Arabic.
 * If targetLang is 'en', checks direct match, subphrase matching, or token compound builder.
 */
export function translateFoodName(name: string, targetLang: 'ar' | 'en' = 'ar'): string {
  if (!name || targetLang === 'ar') return name;

  const trimmed = name.trim();
  const normalized = normalizeArabic(trimmed);

  // 1. Direct match in dictionary
  if (FOOD_DICTIONARY[trimmed]) return FOOD_DICTIONARY[trimmed];
  if (FOOD_DICTIONARY[normalized]) return FOOD_DICTIONARY[normalized];

  // Also check if dictionary keys normalized match
  for (const [key, val] of Object.entries(FOOD_DICTIONARY)) {
    if (normalizeArabic(key) === normalized) {
      return val;
    }
  }

  // 2. Check for compound phrases like "وجبة دجاج" or "بيتزا بالجبنة" or "برجر لحم مع بطاطا"
  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 1) {
    const translatedTokens: string[] = [];
    let i = 0;
    while (i < tokens.length) {
      // Try two-word phrases first
      if (i + 1 < tokens.length) {
        const twoWord = `${tokens[i]} ${tokens[i + 1]}`;
        const normTwoWord = normalizeArabic(twoWord);
        if (FOOD_DICTIONARY[twoWord] || FOOD_DICTIONARY[normTwoWord]) {
          translatedTokens.push(FOOD_DICTIONARY[twoWord] || FOOD_DICTIONARY[normTwoWord]);
          i += 2;
          continue;
        }
      }

      // Single word
      const single = tokens[i];
      const normSingle = normalizeArabic(single);

      if (FOOD_DICTIONARY[single] || FOOD_DICTIONARY[normSingle]) {
        translatedTokens.push(FOOD_DICTIONARY[single] || FOOD_DICTIONARY[normSingle]);
      } else if (TOKEN_TRANSLATIONS[single] || TOKEN_TRANSLATIONS[normSingle]) {
        translatedTokens.push(TOKEN_TRANSLATIONS[single] || TOKEN_TRANSLATIONS[normSingle]);
      } else {
        // Fallback: keep word or capitalize if English
        translatedTokens.push(single);
      }
      i++;
    }

    if (translatedTokens.length > 0) {
      return translatedTokens.join(' ');
    }
  }

  // 3. Fallback: return original name
  return name;
}

/**
 * Translates item descriptions smartly into appetizing English phrasing.
 */
export function translateFoodDescription(desc: string, targetLang: 'ar' | 'en' = 'ar'): string {
  if (!desc || targetLang === 'ar') return desc;

  const trimmed = desc.trim();
  const normalized = normalizeArabic(trimmed);

  const COMMON_DESCRIPTIONS: Record<string, string> = {
    'مع بطاطا ومشروب': 'Served with crispy golden fries and a refreshing soft drink.',
    'يقدم مع بطاطا ومشروب': 'Served with golden fries and your choice of cold soft drink.',
    'مع بطاطس ومشروب غازي': 'Served with hot french fries and a chilled beverage.',
    'مع صوص خاص': 'Served with our secret signature chef sauce.',
    'محضر من اجود المكونات': 'Crafted with premium high-quality fresh ingredients.',
    'طازج وشهي': 'Freshly prepared and deliciously seasoned to order.',
    'حار ولذيذ': 'Hot, spicy, and packed with irresistible flavor.',
    'وجبة كاملة مشبعة': 'A satisfying, hearty complete meal.',
    'مطهوة على الفحم': 'Charcoal grilled to perfection with smoky aroma.',
  };

  for (const [key, val] of Object.entries(COMMON_DESCRIPTIONS)) {
    if (normalizeArabic(key) === normalized || normalized.includes(normalizeArabic(key))) {
      return val;
    }
  }

  // Tokenize & translate common ingredients in description
  const words = trimmed.split(/\s+/);
  const translatedWords = words.map(w => {
    const norm = normalizeArabic(w);
    if (TOKEN_TRANSLATIONS[w] || TOKEN_TRANSLATIONS[norm]) {
      return TOKEN_TRANSLATIONS[w] || TOKEN_TRANSLATIONS[norm];
    }
    if (FOOD_DICTIONARY[w] || FOOD_DICTIONARY[norm]) {
      return FOOD_DICTIONARY[w] || FOOD_DICTIONARY[norm];
    }
    return w;
  });

  return translatedWords.join(' ');
}

/**
 * Translates category names (e.g. الأطباق الرئيسية -> Main Dishes).
 */
export function translateCategoryName(catName: string, targetLang: 'ar' | 'en' = 'ar'): string {
  if (!catName || targetLang === 'ar') return catName;

  const trimmed = catName.trim();
  const normalized = normalizeArabic(trimmed);

  if (CATEGORY_DICTIONARY[trimmed]) return CATEGORY_DICTIONARY[trimmed];
  if (CATEGORY_DICTIONARY[normalized]) return CATEGORY_DICTIONARY[normalized];

  for (const [key, val] of Object.entries(CATEGORY_DICTIONARY)) {
    if (normalizeArabic(key) === normalized) {
      return val;
    }
  }

  return translateFoodName(trimmed, targetLang);
}

/**
 * Translates extras/add-ons (e.g. جبنة إضافية -> Extra Cheese).
 */
export function translateExtraName(extraName: string, targetLang: 'ar' | 'en' = 'ar'): string {
  if (!extraName || targetLang === 'ar') return extraName;

  const trimmed = extraName.trim();
  const normalized = normalizeArabic(trimmed);

  const EXTRAS_MAP: Record<string, string> = {
    'جبنة اضافية': 'Extra Melted Cheese',
    'جبنة إضافية': 'Extra Melted Cheese',
    'شيدر': 'Extra Cheddar Slice',
    'صوص ثوم': 'Garlic Sauce Cup',
    'صوص حار': 'Spicy Chili Sauce Cup',
    'صوص باربيكيو': 'BBQ Sauce Cup',
    'مخلل اضافي': 'Extra Pickles',
    'بطاطا اضافية': 'Extra Fries Basket',
    'مشروب اضافي': 'Extra Soft Drink',
    'بصل مقرمش': 'Crispy Fried Onions',
    'هالبينو': 'Pickled Jalapeños',
  };

  if (EXTRAS_MAP[trimmed]) return EXTRAS_MAP[trimmed];
  if (EXTRAS_MAP[normalized]) return EXTRAS_MAP[normalized];

  return translateFoodName(trimmed, targetLang);
}
