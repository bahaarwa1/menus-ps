export type SubscriptionPlan = 'trial' | 'basic' | 'pro';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  planNameAr: string;
  expiresAt: string; // ISO date string
  daysRemaining: number;
  isExpired: boolean;
  status: 'active' | 'trial' | 'expired';
}

const META_PREFIX = 'SUB_META:';

export interface RestaurantExtraMeta {
  whatsappNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
}

/**
 * Safely parses subscription plan and expiration from branch address metadata.
 * Non-destructive and resilient with zero database migrations.
 */
export function parseSubscriptionFromAddress(
  address: string | undefined | null,
  createdAt?: string
): {
  cleanAddress: string;
  subscription: SubscriptionInfo;
  extraMeta?: RestaurantExtraMeta;
} {
  let plan: SubscriptionPlan = 'trial';
  
  // Default fallback: 14 days trial from creation date
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  let expiresAt = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  let cleanAddress = (address || '').trim();
  let extraMeta: RestaurantExtraMeta | undefined;

  if (cleanAddress.includes(META_PREFIX)) {
    const parts = cleanAddress.split(META_PREFIX);
    cleanAddress = parts[0].replace(/\|\|\s*$/, '').trim();
    try {
      const meta = JSON.parse(parts[1].trim());
      if (meta.plan && ['trial', 'basic', 'pro'].includes(meta.plan)) {
        plan = meta.plan;
      }
      if (meta.expiresAt) {
        expiresAt = meta.expiresAt;
      }
      extraMeta = {
        whatsappNumber: meta.whatsappNumber || undefined,
        instagramUrl: meta.instagramUrl || undefined,
        facebookUrl: meta.facebookUrl || undefined,
        tiktokUrl: meta.tiktokUrl || undefined,
      };
    } catch {}
  }

  const expDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  const planNameAr =
    plan === 'pro'
      ? 'الخطة الاحترافية (VIP)'
      : plan === 'basic'
      ? 'الخطة الأساسية'
      : 'النسخة التجريبية (14 يوم)';

  const status = isExpired ? 'expired' : plan === 'trial' ? 'trial' : 'active';

  return {
    cleanAddress,
    subscription: {
      plan,
      planNameAr,
      expiresAt,
      daysRemaining,
      isExpired,
      status,
    },
    extraMeta,
  };
}

/**
 * Serializes subscription plan and expiration into branch address field safely.
 */
export function serializeSubscriptionAddress(
  address: string | undefined | null,
  plan: SubscriptionPlan,
  expiresAt: string,
  extraMeta?: RestaurantExtraMeta
): string {
  const clean = (address || '').split(META_PREFIX)[0].replace(/\|\|\s*$/, '').trim();
  const metaObj: any = { plan, expiresAt };
  if (extraMeta) {
    if (extraMeta.whatsappNumber) metaObj.whatsappNumber = extraMeta.whatsappNumber;
    if (extraMeta.instagramUrl) metaObj.instagramUrl = extraMeta.instagramUrl;
    if (extraMeta.facebookUrl) metaObj.facebookUrl = extraMeta.facebookUrl;
    if (extraMeta.tiktokUrl) metaObj.tiktokUrl = extraMeta.tiktokUrl;
  }
  const metaJson = JSON.stringify(metaObj);
  return clean ? `${clean} || ${META_PREFIX}${metaJson}` : `${META_PREFIX}${metaJson}`;
}
