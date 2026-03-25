// dz-law-portal/src/data/algorithms.ts

// تصنيف عام اختياري للقوانين (يمكنك تبسيطه أو توسيعه لاحقًا)
export type LegalCategory =
  | "constitution"
  | "code_civil"
  | "code_penal"
  | "code_commerce"
  | "procedures_civiles"
  | "procedures_penales"
  | "administratif"
  | "other";

// تمثيل قانون/نص قانوني في قاعدة البيانات
export interface LegalReference {
  id: string;                            // معرف فريد داخل النظام
  title: string;                         // عنوان القانون أو النص
  number?: string;                       // رقم القانون (مثال: 05-10)
  year?: number;                         // سنة الصدور
  type: "law" | "decree" | "ordinance" | "decision" | "judgment";
  category: LegalCategory;
  keywords: string[];                    // كلمات مفتاحية بالعربية/الفرنسية
}

// خيارات بسيطة للبحث
export interface SearchOptions {
  query?: string;                        // نص البحث الحر
  limit?: number;                        // عدد النتائج الأقصى
}

// تهيئة النص للبحث
const normalize = (value: string | undefined | null): string => {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")     // إزالة التشكيل/اللكنة
    .trim();
};

// حساب مدى تطابق عنصر واحد مع نص البحث
const matchReference = (ref: LegalReference, query: string): number => {
  if (!query) return 0;
  const q = normalize(query);
  if (!q) return 0;

  const haystack = [ref.title, ref.number, ...(ref.keywords || [])]
    .map(normalize)
    .join(" ");

  return haystack.includes(q) ? 1 : 0;
};

// الدالة الرئيسية للبحث
export const searchLegalReferences = (
  data: LegalReference[],
  options: SearchOptions = {}
) => {
  const query = options.query ?? "";

  const scored = data.map((ref) => ({
    item: ref,
    score: matchReference(ref, query),
  }));

  // ترتيب حسب درجة التطابق (يمكن تطويره لاحقًا)
  scored.sort((a, b) => b.score - a.score);

  const limit = options.limit && options.limit > 0 ? options.limit : 50;
  return scored.slice(0, limit);
};
