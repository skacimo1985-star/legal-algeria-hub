# دليل بناء ونشر Android — الميزان الرقمي الذكي

## المتطلبات المسبقة (على جهازك)

| الأداة | الإصدار | الرابط |
|--------|---------|--------|
| Android Studio | Ladybug 2024.2+ | https://developer.android.com/studio |
| Java JDK | 17+ | https://adoptium.net |
| Node.js | 20+ | https://nodejs.org |
| pnpm | 10+ | `npm i -g pnpm` |

---

## الخطوة 1 — استنساخ وإعداد المشروع

```bash
git clone <your-repo-url>
cd <project-folder>
pnpm install
```

---

## الخطوة 2 — توليد مشروع Android

```bash
cd artifacts/dz-law-portal

# بناء الويب أولاً
pnpm run build

# إضافة منصة Android (مرة واحدة فقط)
pnpm run android:init

# مزامنة ملفات الويب مع Android
pnpm run android:sync
```

---

## الخطوة 3 — إنشاء مفتاح التوقيع (مرة واحدة)

```bash
keytool -genkey -v \
  -keystore artifacts/dz-law-portal/android/release.keystore \
  -alias mizan-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=SIREP TECH, OU=MIZAN DZ, O=SIREP, L=Algiers, S=Algiers, C=DZ"
```

**احفظ كلمة المرور بأمان — لا يمكن استعادتها!**

---

## الخطوة 4 — بناء AAB للإنتاج

### عبر Android Studio:
1. افتح Android Studio
2. `File → Open` → اختر `artifacts/dz-law-portal/android`
3. `Build → Generate Signed Bundle/APK`
4. اختر **Android App Bundle**
5. حدد `release.keystore`، أدخل كلمة المرور والـ alias
6. اختر **release** وأنهِ المعالج

### عبر سطر الأوامر:
```bash
cd artifacts/dz-law-portal
pnpm run android:build
# الملف: android/app/build/outputs/bundle/release/app-release.aab
```

---

## الخطوة 5 — النشر في Google Play Console

1. اذهب إلى: https://play.google.com/console
2. أنشئ تطبيقاً جديداً:
   - **الاسم:** الميزان الرقمي الذكي
   - **Package:** `dz.sireptech.mizan`
   - **الفئة:** Business / Productivity
   - **اللغة الافتراضية:** Arabic (DZ)
3. في **Releases → Production** ارفع ملف `app-release.aab`
4. أكمل المعلومات الإلزامية:
   - وصف قصير (80 حرف)
   - وصف طويل
   - لقطات شاشة (2-8 لكل حجم)
   - أيقونة 512×512 PNG
   - سياسة الخصوصية (مطلوبة)
5. ابدأ بـ **Internal Testing** ثم انقل إلى **Production**

---

## الأتمتة عبر n8n

استورد ملف `n8n-workflows/mizan-dz-automation.json` في n8n:

```
Settings → Import → From file → اختر الملف
```

### Workflows المُعدَّة:
| الاسم | الجدول | الوظيفة |
|-------|--------|---------|
| Android Build Trigger | عند الطلب (Webhook) | تشغيل GitHub Actions لبناء AAB |
| Weekly Gazette Check | كل اثنين 6 صباحاً | مزامنة الجريدة الرسمية |
| Monthly Renewal | كل أول الشهر 9 صباحاً | تجديد الاشتراكات عبر Chargily |

### متغيرات البيئة المطلوبة في n8n:
```
GITHUB_REPO=username/repository-name
API_BASE_URL=https://your-deployed-api.replit.app
SIREP_INTERNAL_KEY=<مفتاح داخلي آمن>
CHARGILY_API_KEY=<من Chargily Dashboard>
CHARGILY_API_BASE=https://pay.chargily.net/api
```

---

## الأسرار المطلوبة في GitHub Actions

في `Settings → Secrets and variables → Actions`:

| اسم السر | القيمة |
|----------|--------|
| `ANDROID_KEYSTORE_BASE64` | `base64 release.keystore` |
| `KEYSTORE_PASSWORD` | كلمة مرور الـ keystore |
| `KEY_ALIAS` | `mizan-key` |
| `KEY_PASSWORD` | كلمة مرور المفتاح |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | JSON حساب الخدمة من Play Console |

---

## معلومات التطبيق

| الحقل | القيمة |
|-------|--------|
| Package ID | `dz.sireptech.mizan` |
| اسم التطبيق | الميزان الرقمي الذكي |
| Android Scheme | `https` |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 34 (Android 14) |
| المطور | بلقاسم محروق الراس — SIREP TECH |

---

## الدعم الفني
**WhatsApp:** +213 556 64 02 11  
**البريد:** kacimo2000@gmail.com
