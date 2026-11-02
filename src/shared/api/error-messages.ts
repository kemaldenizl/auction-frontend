import { formatMoney } from "@/shared/lib/format";

/**
 * What the user reads when something goes wrong.
 *
 * The server's `detail` is written for developers — often English, sometimes
 * mentioning tokens or endpoints — so it is never shown as-is. The `errorCode`
 * is the contract; this maps it to plain Turkish.
 */
const BY_CODE: Record<string, string> = {
  unauthorized: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
  forbidden: "Bu işlem için yetkiniz yok.",
  "validation.invalid": "Lütfen işaretli alanları kontrol edin.",
  not_found: "Aradığınız kayıt bulunamadı.",
  bid_too_low: "Teklifiniz çok düşük.",
  already_highest_bidder: "En yüksek teklif zaten sizde.",
  auction_not_started: "Bu açık artırma henüz başlamadı.",
  auction_ended: "Bu açık artırma sona erdi.",
  auction_cancelled: "Bu açık artırma iptal edildi.",
  invalid_start_time: "Başlangıç zamanı geçmişte olamaz.",
  product_inactive: "Pasif bir ürün için açık artırma açılamaz.",
  duplicate_product_name: "Bu isimde bir ürün zaten var.",
  invalid_amount: "Lütfen geçerli bir tutar girin.",
  missing_bidder: "Teklif vermek için giriş yapmalısınız.",
  external_service_error:
    "İşlemi şu an tamamlayamadık. Lütfen birazdan tekrar deneyin.",
  internal_error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
  network_error:
    "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
  rate_limited: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.",
  "auth.invalid_credentials": "E-posta adresi ya da parola hatalı.",
  "auth.invalid_refresh_token": "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
  "auth.expired_refresh_token": "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
  "auth.revoked_refresh_token": "Oturumunuz kapatıldı. Lütfen tekrar giriş yapın.",
  "auth.consumed_refresh_token": "Oturumunuz kapatıldı. Lütfen tekrar giriş yapın.",
};

function byStatus(status: number): string | null {
  if (status === 0) return BY_CODE.network_error;
  if (status === 400) return "Gönderilen bilgiler geçersiz. Lütfen kontrol edin.";
  if (status === 401) return BY_CODE.unauthorized;
  if (status === 403) return BY_CODE.forbidden;
  if (status === 404) return BY_CODE.not_found;
  if (status === 409) return "Bu işlem şu an yapılamıyor.";
  if (status === 429) return BY_CODE.rate_limited;
  if (status >= 500) return BY_CODE.internal_error;
  return null;
}

export interface ProblemLike {
  status: number;
  errorCode: string;
  minimumRequired?: number | null;
}

export function messageForProblem(
  problem: ProblemLike,
  fallback = "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
): string {
  if (problem.errorCode === "bid_too_low" && problem.minimumRequired) {
    return `Teklifiniz çok düşük. En az ${formatMoney(
      problem.minimumRequired,
    )} vermelisiniz.`;
  }

  return BY_CODE[problem.errorCode] ?? byStatus(problem.status) ?? fallback;
}

const FIELD_RULES: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/at least (\d+) characters/i, (m) => `En az ${m[1]} karakter olmalı.`],
  [/(not exceed|at most|maximum of) (\d+) characters/i, (m) => `En fazla ${m[2]} karakter olabilir.`],
  [/uppercase/i, () => "En az bir büyük harf içermeli."],
  [/lowercase/i, () => "En az bir küçük harf içermeli."],
  [/digit|number/i, () => "En az bir rakam içermeli."],
  [/non-alphanumeric|special/i, () => "En az bir özel karakter içermeli (!, ?, * gibi)."],
  [/e-?mail/i, () => "Geçerli bir e-posta adresi girin."],
  [/url|uri/i, () => "Geçerli bir bağlantı girin (https:// ile başlayan)."],
  [/greater than|positive/i, () => "Sıfırdan büyük bir değer girin."],
  [/empty|required/i, () => "Bu alan zorunlu."],
  [/already|exists|taken|unique/i, () => "Bu değer zaten kullanılıyor."],
];

/** Turns a framework validation message into a short Turkish hint. */
export function translateFieldMessage(message: string): string {
  for (const [pattern, render] of FIELD_RULES) {
    const match = message.match(pattern);
    if (match) return render(match);
  }
  return "Bu alanı kontrol edin.";
}
