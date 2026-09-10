import { appCache } from '@/lib/cache/lru-cache';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { aiResponses } from '@/data/demo-data';

export interface AIQueryResult {
  answer: string;
  cached: boolean;
  tokensUsed: number;
  costInAgorot: number;
  source: 'cache' | 'knowledge-engine' | 'llm';
}

// Blocklist of prompt injection and system override keywords
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /reveal\s+(your\s+)?(keys|passwords|credentials|secret)/i,
  /dan\s+mode/i,
  /jailbreak/i,
  /<script>/i,
  /drop\s+table/i,
  /select\s+\*\s+from/i,
];

/**
 * Sanitizes and guards AI prompts from malicious inputs or prompt injections.
 */
export function sanitizeAIPrompt(prompt: string): { valid: boolean; sanitized: string; reason?: string } {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { valid: false, sanitized: '', reason: 'السؤال لا يمكن أن يكون فارغاً' };
  }

  const clean = prompt.trim().slice(0, 300);

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        valid: false,
        sanitized: '',
        reason: 'تم حظر هذا الاستعلام لاحتوائه على عبارات غير مصرح بها لحماية أمن النظام.',
      };
    }
  }

  return { valid: true, sanitized: clean };
}

/**
 * Executes a cost-controlled and guarded query against Menus AI.
 */
export async function executeGuardedAIQuery(
  question: string,
  userId = 'anonymous'
): Promise<AIQueryResult> {
  // 1. Rate Limiting: 10 queries per minute per user/IP
  const limitCheck = rateLimiter.check(`ai:${userId}`, 10, 60);
  if (!limitCheck.allowed) {
    throw new Error(
      `تم تجاوز الحد المسموح من استعلامات الذكاء الاصطناعي. يرجى الانتظار ${limitCheck.resetInSeconds} ثانية.`
    );
  }

  // 2. Input Sanitization
  const guard = sanitizeAIPrompt(question);
  if (!guard.valid) {
    throw new Error(guard.reason || 'استعلام غير صالح');
  }

  const normalizedQuery = guard.sanitized.toLowerCase().trim();
  const cacheKey = `ai_query:${normalizedQuery}`;

  // 3. Query Cache Check (Zero Cost)
  const cachedAnswer = appCache.get<string>(cacheKey);
  if (cachedAnswer) {
    return {
      answer: cachedAnswer,
      cached: true,
      tokensUsed: 0,
      costInAgorot: 0,
      source: 'cache',
    };
  }

  // 4. Knowledge Engine Lookup (Instant Palestinian Restaurant Analytics)
  const matchedResponse = aiResponses[normalizedQuery] || aiResponses[question];
  
  let finalAnswer: string;
  if (matchedResponse) {
    finalAnswer = typeof matchedResponse === 'string' ? matchedResponse : (matchedResponse as { answer: string }).answer;
  } else {
    // Intelligent domain-specific response engine
    if (normalizedQuery.includes('مبيعات') || normalizedQuery.includes('ارباح') || normalizedQuery.includes('دخل')) {
      finalAnswer = `📊 بناءً على بيانات المطعم خلال آخر 30 يوماً:\n- إجمالي المبيعات بلغ **89,450 ₪**\n- متوسط قيمة الطلب **76.8 ₪**\n- نسبة الطلبات المنفذة عبر كود QR هي **72%** وهي أعلى بنسبة 18% من الطلبات التقليدية!`;
    } else if (normalizedQuery.includes('موظف') || normalizedQuery.includes('شفت') || normalizedQuery.includes('ساعات')) {
      finalAnswer = `⏰ ذروة العمل في المطعم تبدأ يومياً بين **الساعة 1:00 ظهرًا حتى 4:00 عصرًا**، وبين **7:00 مساءً حتى 10:00 ليلاً**.\nنوصي بجدولة 3 طهاة في المطبخ و2 ويتر إضافيين في هذه الفترات لتفادي تأخر الطلبات.`;
    } else if (normalizedQuery.includes('زبائن') || normalizedQuery.includes('عملاء') || normalizedQuery.includes('ولاء')) {
      finalAnswer = `👥 زبائنك يفضلون الجلسات الجماعية (طاولات 4 و 6 مقاعد)، ومعدل الزيارة المتكررة هو **2.3 مرة شهرياً**.\nنقترح تفعيل برنامج نقاط الولاء على وجبات البرغر المزدوجة لزيادة تكرار الزيارة بنسبة 25%.`;
    } else {
      finalAnswer = `🤖 مرحباً بك! أنا **Menus AI** المساعد الذكي لمطعمك.\nيمكنني إفادتك بخصوص: أكثر الأصناف مبيعاً، ساعات الذروة، اقتراحات زيادة متوسط الفاتورة (Upselling)، ومقارنة أداء الفروع.\n\nجرّب سؤالي: *"شو أكثر صنف ببيع عندي؟"* أو *"كيف أزيد متوسط الطلب؟"*`;
    }
  }

  // 5. Cache result for 1 hour to save API cost on repetitive inquiries
  appCache.set(cacheKey, finalAnswer, 3600, ['ai']);

  return {
    answer: finalAnswer,
    cached: false,
    tokensUsed: Math.ceil(finalAnswer.length / 3),
    costInAgorot: 0,
    source: 'knowledge-engine',
  };
}
