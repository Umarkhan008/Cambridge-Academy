# Google Play Store (Android) Yuklash Qo'llanmasi

Ilovangizni Google Play Marketga joylash uchun quyidagi qadamlarni bosib o'tishingiz kerak. Bu jarayon Expo va EAS (Expo Application Services) yordamida amalga oshiriladi.

## 1. Google Play Console Hisobi
Agar sizda hali hisob yo'q bo'lsa:
1. [Google Play Console](https://play.google.com/console) ga kiring.
2. Ro'yxatdan o'ting va bir martalik to'lovni ($25) to'lang.
3. Shaxsingizni tasdiqlang.

## 2. Ilova Sozlamalari (`app.json`)
Ilovangizning `app.json` faylida quyidagi ma'lumotlar to'g'ri ekanligiga ishonch hosil qiling:

```json
{
  "expo": {
    "name": "App For Pro Teach",
    "slug": "app-for-pro-teach",
    "version": "1.0.0",
    "android": {
      "package": "com.sizningnomingiz.appforproteach", // O'ZINGIZNING NOYOB IDINGIZNI YOZING
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [] // Kerakli ruxsatlar
    }
  }
}
```
**Muhim:** `package` nomi (masalan `com.company.appname`) noyob bo'lishi kerak. Uni Play Marketda boshqa ilova ishlatmagan bo'lishi shart.

## 3. AAB (Android App Bundle) Faylini Yaratish
Play Market `.apk` emas, `.aab` formatini talab qiladi.
Terminalda quyidagi buyruqni bering:

```powershell
eas build --platform android
```

Buyruqdan so'ng:
1. Tizim sizdan Google Play Keystore (kalit) yaratishni so'raydi -> **Yes (Y)** ni bosing.
2. Build jarayoni boshlanadi va Expo serverlarida davom etadi.
3. Jarayon tugagach, sizga yuklab olish uchun havola beriladi (fayl kengatmasi `.aab` bo'ladi).

## 4. Google Play Console-da Ilova Yaratish
1. **Create App** tugmasini bosing.
2. Ilova nomi, tili va bepul/pullik ekanligini tanlang.
3. **Dashboard** bo'limidagi barcha qadamlarni bajaring:
   - Maxfiylik siyosati (Privacy Policy) linkini qo'ying.
   - Ilova haqida qisqacha va to'liq ma'lumot yozing.
   - Ilova ikonkasi (512x512) va skrinshotlarni yuklang.

## 5. Buildni Yuklash
1. Chap menyudan **Production** (yoki *Testing*) bo'limiga o'ting.
2. **Create new release** ni bosing.
3. EAS orqali olgan `.aab` faylingizni yuklang.
4. Versiya haqida ma'lumot yozing (masalan: "Dastlabki versiya").
5. **Next** -> **Save** -> **Go to publishing overview** -> **Send changes for review** ni bosing.

## 6. Tekshiruv (Review)
Google jamoasi ilovangizni tekshiradi. Bu jarayon odatda 1-3 kun, ba'zan 7 kungacha vaqt olishi mumkin. Tasdiqlangandan so'ng ilovangiz Play Marketda paydo bo'ladi.

---

### Yordamchi Maslahatlar
- **Skrinshotlar:** Play Market uchun chiroyli skrinshotlar tayyorlang (telefonda rasmga olib yoki maxsus dizayn qilib).
- **Privacy Policy:** Agar sizda veb-sayt bo'lmasa, tekinga Privacy Policy generatorlaridan foydalanib, Google Docs yoki Notion sahifasiga joylab, o'sha linkni ishlatsangiz bo'ladi.
