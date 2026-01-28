# Yangi tizim (Ikkinchi baza) yaratish bo'yicha qo'llanma

Ushbu loyihani butunlay boshqa Firebase bazasiga ulash va alohida tizim sifatida ishlatish uchun quyidagi qadamlarni bajaring:

### 1. Firebase loyihasini yarating
* [Firebase Console](https://console.firebase.google.com/)ga kiring.
* Yangi loyiha yarating (masalan: `pro-teach-client-2`).
* **Authentication** bo'limida "Email/Password"ni yoqing.
* **Firestore Database** yarating va "Test mode"da boshlang (keyin qoidalarni to'g'irlash kerak).

### 2. Web App qo'shing
* Firebase loyihangizda "Web" belgisini bosing.
* Appga nom bering va ro'yxatdan o'tkazing.
* Sizga berilgan `firebaseConfig` kalitlarini nusxalab oling.

### 3. Kalitlarni loyihaga qo'shish
Loyiha ildiz papkasida `.env` faylini yarating va yangi kalitlarni yozing:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY="SIZNING_YANGI_API_KEY"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="LOYIHA_ID.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="LOYIHA_ID"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="LOYIHA_ID.firebasestorage.app"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="SENDER_ID"
EXPO_PUBLIC_FIREBASE_APP_ID="APP_ID"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="G-ID"

# Tizim nomi (O'zingiz xohlagandek o'zgartiring)
EXPO_PUBLIC_APP_NAME="Mening Yangi LMS Tizimim"
```

### 4. Yangi Build olish
Kalitlarni o'zgartirgandan so'ng, terminalda quyidagi buyruqni bering:

```bash
npx expo export --platform web
```

Bu buyruq `dist` papkasida yangi bazaga va yangi nomga ega veb-saytni yaratadi. Uni istalgan serverga yuklashingiz mumkin.

### Muhim eslatma:
Har bir yangi baza uchun alohida `.env` fayli servesiz, Build vaqtida kodning ichiga "ฝัง" (ฝัง - embed) qilinadi. Shuning uchun har bir mijoz uchun alohida build olishingiz kerak.
