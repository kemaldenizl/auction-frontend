# Frontend için Backend Rehberi

Bu dosya **backend'in tam sözleşmesi**. Amacı şu: bir frontend geliştiricisi
yalnızca bunu okuyarak uygulamayı yazabilsin — backend koduna bakmak zorunda
kalmasın, kimseye soru sormak zorunda kalmasın.

Burada frontend kodu yoktur. Hangi adrese ne gönderilir, ne döner, hangi
durumda ne olur — hepsi yazılı. Örnekler `curl` ile, çünkü istek/cevabın
ham hali hangi teknolojiyle çalıştığından bağımsız.

---

## İçindekiler

- [1. Sistem nasıl kurulu](#1-sistem-nasıl-kurulu)
- [2. Her istekte geçerli temel kurallar](#2-her-istekte-geçerli-temel-kurallar)
- [3. Kimlik doğrulama akışı](#3-kimlik-doğrulama-akışı)
- [4. Yetki modeli: hangi uç ne ister](#4-yetki-modeli-hangi-uç-ne-ister)
- [5. Security API — kimlik ve yetki](#5-security-api--kimlik-ve-yetki)
- [6. Catalog API — ürünler](#6-catalog-api--ürünler)
- [7. Auction API — açık artırmalar ve teklifler](#7-auction-api--açık-artırmalar-ve-teklifler)
- [8. SignalR — canlı teklif akışı](#8-signalr--canlı-teklif-akışı)
- [9. Hata sözleşmesi](#9-hata-sözleşmesi)
- [10. Backend davranışları: bilmen gerekenler](#10-backend-davranışları-bilmen-gerekenler)
- [11. Uçtan uca senaryo](#11-uçtan-uca-senaryo)

---

## 1. Sistem nasıl kurulu

Arkada üç mikroservis var ama **senin tek bir adrese** konuşman yeterli:
önde bir API gateway duruyor ve yolu doğru servise dağıtıyor.

```
Senin uygulaman
      │
      ▼
http://localhost:5080          ← TEK base URL
      │
      ├── /api/auth/**          → Security   (kimlik, token, oturum)
      ├── /api/users/**         → Security
      ├── /api/roles/**         → Security
      ├── /api/permissions/**   → Security
      ├── /api/sessions/**      → Security
      ├── /api/mfa/**           → Security
      ├── /api/products/**      → Catalog    (ürün kataloğu)
      ├── /api/auctions/**      → Auction    (açık artırma + teklif)
      └── /hubs/auction         → Auction    (SignalR / WebSocket)
```

**Servislerin kendi portlarını (5020 / 5005 / 5112) kullanma.** Onlar
Swagger ve hata ayıklama için açık; uygulama her zaman gateway'den geçer.

Gateway'in kök adresi (`GET /`) hangi yolun nereye gittiğini JSON olarak
döndürür — adres doğrulaması için kullanabilirsin.

### Kim ne yapar

| Servis | Sorumluluğu |
|---|---|
| **Security** | Kullanıcı kaydı/girişi, access + refresh token üretimi, oturumlar, MFA, rol ve izin yönetimi. **Token'ı üreten tek yer.** |
| **Catalog** | Ürün kataloğu (CRUD). Token'ı yalnızca doğrular. |
| **Auction** | Açık artırmalar, teklifler, canlı yayın (SignalR). Token'ı yalnızca doğrular. |

Önemli sonuç: **token'ı nereden aldıysan her yerde geçerli.** Catalog'a ayrı,
Auction'a ayrı giriş yapmazsın. Security'den aldığın tek access token üç
servisin tamamında çalışır.

## 2. Her istekte geçerli temel kurallar

**Base URL.** `http://localhost:5080`. Tek değişken olarak tut.

**Kimlik.** Korumalı uçlara standart başlıkla gidilir:

```
Authorization: Bearer <accessToken>
```

Tek istisna SignalR: WebSocket el sıkışmasında tarayıcı başlık
gönderemediği için token query string'de gider
(bkz. [bölüm 8](#8-signalr--canlı-teklif-akışı)).

**JSON alan adları camelCase.** C# tarafı PascalCase yazsa da ağda
`startingPrice`, `bidderName`, `minimumNextBid` şeklinde gelir.

**Enum'lar string.** `status` alanı `0` değil `"Live"` döner. Geçerli
değerler: `"Scheduled"`, `"Live"`, `"Ended"`, `"Cancelled"`. Sorgu
parametresi olarak da string verilir: `?status=Live`.

**Tarihler ISO-8601 ve UTC.** `"2026-10-29T06:53:23.6404867+00:00"`.
Geri sayım yaparken kullanıcının saatine güvenme — [bölüm 10'da](#10-backend-davranışları-bilmen-gerekenler)
sapma düzeltmesi anlatılıyor.

**Para alanları ondalık sayı.** `42000.00` gibi. Sunucu her zaman geçerli
bir sonraki teklifin alt sınırını (`minimumNextBid`) hesaplayıp verir —
**kendin hesaplama**, kuralı tekrar etmek iki yerde bozulur.

**Sayfalama zarfı her listede aynı.**

```json
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 137,
  "totalPages": 7,
  "hasPrevious": false,
  "hasNext": true
}
```

`pageSize` üst sınırı **100**'dür; daha büyük istersen sunucu sessizce 100'e
indirir (cevaptaki `pageSize` gerçek değeri söyler).

**Hatalar her serviste aynı şekilde döner** — bkz. [bölüm 9](#9-hata-sözleşmesi).

## 3. Kimlik doğrulama akışı

### 3.1 Kayıt

```
POST /api/auth/register
```

```json
{ "email": "kemal@example.com", "password": "CokGuvenliParola1!" }
```

**201** döner:

```json
{ "user": { "id": "…", "email": "kemal@example.com", "emailVerified": false, "isActive": true } }
```

Dikkat edilecek iki şey:

- **Parola en az 12 karakter.** Kısa parola `400` ile reddedilir ve
  `errors.password` alanında sebebi yazar. Formu buna göre doğrula,
  kullanıcıyı sunucuya göndermeden uyar.
- **Kayıt token DÖNDÜRMEZ.** Kayıttan sonra giriş çağrısı yapman gerekir.
- Yeni kullanıcıya **hiçbir rol atanmaz**, yani izni yoktur. Bu bilinçli:
  teklif vermek izin istemiyor, yönetim işleri istiyor
  (bkz. [bölüm 4](#4-yetki-modeli-hangi-uç-ne-ister)).

### 3.2 Giriş

```
POST /api/auth/login
```

```json
{ "email": "kemal@example.com", "password": "CokGuvenliParola1!" }
```

**200** döner:

```json
{
  "user": { "id": "…", "email": "kemal@example.com", "emailVerified": false, "isActive": true },
  "tokens": {
    "accessToken": "eyJhbGciOi…",
    "accessTokenExpiresAtUtc": "2026-10-29T07:05:00Z",
    "refreshToken": "9f2c…",
    "refreshTokenExpiresAtUtc": "2026-11-28T06:50:00Z"
  },
  "mfaChallenge": null,
  "requiresMfa": false
}
```

**`requiresMfa` alanını mutlaka kontrol et.** Kullanıcıda MFA açıksa
cevap şöyle gelir: `tokens` **null**, `requiresMfa` **true** ve
`mfaChallenge` doldurulmuş olur:

```json
{
  "user": { … },
  "tokens": null,
  "requiresMfa": true,
  "mfaChallenge": { "challengeToken": "…", "expiresAtUtc": "2026-10-29T06:55:00Z" }
}
```

Bu durumda kullanıcıdan 6 haneli kodu alıp ikinci adımı çağırırsın:

```
POST /api/mfa/login/complete
```

```json
{ "challengeToken": "…", "totpCode": "123456", "recoveryCode": null }
```

Kurtarma koduyla girişte `totpCode` yerine `recoveryCode` gönderilir.
Bu çağrı başarılıysa `tokens` döner.

### 3.3 Token'ların ömrü ve yenileme

| Token | Ömür | Nerede durur |
|---|---|---|
| `accessToken` | **15 dakika** | Her istekte `Authorization` başlığında |
| `refreshToken` | **30 gün** | Yalnızca yenileme çağrısında gövdede |

Access token süresi doldu mu:

```
POST /api/auth/refresh
```

```json
{ "refreshToken": "9f2c…" }
```

**200** → `{ "tokens": { … } }` (yeni access **ve** yeni refresh token).

**Üç kritik davranış:**

1. **Refresh token döner (rotation).** Her yenilemede eskisi tüketilir,
   yenisi verilir. Cevaptaki yeni refresh token'ı saklamazsan bir sonraki
   yenileme başarısız olur.

2. **Tüketilmiş refresh token'ı tekrar kullanmak TÜM OTURUMU iptal eder.**
   Backend bunu çalınmış token belirtisi sayar ve oturumu kapatır. Pratik
   sonucu: **eşzamanlı iki yenileme çağrısı yapma.** 401 alan üç istek aynı
   anda yenileme tetiklerse biri geçer, diğerleri tüketilmiş token
   gönderir ve kullanıcı tamamen dışarı atılır. Yenileme çağrısını tek
   sıraya al (aynı anda yalnızca bir tane olsun, diğerleri onu beklesin).

3. **Yenileme sırasında 401 alırsan oturum gerçekten bitmiştir** —
   tekrar denemeyip kullanıcıyı giriş ekranına al.

### 3.4 Çıkış

```
POST /api/auth/logout          (Authorization gerekli)
```

```json
{ "refreshToken": "9f2c…" }
```

**204** döner.

```
POST /api/auth/logout-all      (Authorization gerekli)
```

Tüm cihazlardaki oturumları kapatır.

**Çıkış ANINDA etki eder.** Security iptal kaydını paylaşılan Redis'e yazar;
Catalog ve Auction her istekte oraya bakar. Yani çıkıştan sonra elde kalan
access token'la istek atılırsa 15 dakika beklemeden `401` alınır. Bu
doğrulandı: çıkış sonrası teklif denemesi anında reddediliyor.

### 3.5 Oturum bilgisi ve izinler

```
GET /api/users/me              (Authorization gerekli)
```

```json
{
  "userId": "…",
  "email": "kemal@example.com",
  "sessionId": "…",
  "accessTokenJti": "…",
  "permissions": ["products.manage", "auctions.manage"]
}
```

**Arayüzü buna göre kur.** "Ürün ekle" düğmesini göstermeden önce
`permissions` içinde `products.manage` var mı diye bak. Token'ın içini
kendin açıp okumak da teknik olarak mümkün, ama bu uç daha nettir ve
sözleşmesi sabittir.

> Bu bir **görsel** kontroldür, güvenlik kontrolü değil. Yetkiyi sunucu
> zorluyor; frontend sadece kullanıcıya olmayacak düğmeyi göstermemek için
> bakıyor.

### 3.6 Diğer hesap akışları

Hepsi aynı kalıpta: "talep et" → e-posta/token → "onayla".

| Akış | Çağrılar |
|---|---|
| E-posta doğrulama | `POST /api/auth/verify-email` `{token}` · tekrar gönder: `POST /api/auth/resend-verification` `{email}` |
| Parola sıfırlama (giriş yapmadan) | `POST /api/auth/forgot-password` `{email}` → `POST /api/auth/reset-password` `{token, newPassword}` |
| Parola değiştirme (girişliyken) | `POST /api/auth/change-password/request` `{currentPassword}` → `POST /api/auth/change-password/confirm` `{token, newPassword}` |
| E-posta değiştirme | `POST /api/auth/change-email/request` `{currentPassword}` → `GET /api/auth/change-email/validate?token=…` → `POST /api/auth/change-email/confirm` `{token, newEmail}` |

`forgot-password` ve `resend-verification` **her zaman 202 + mesaj** döner —
e-posta kayıtlı olmasa bile. Bu bilinçli: aksi halde hangi e-postaların
sistemde olduğu öğrenilebilirdi. Arayüzde "kayıtlı değil" demeye çalışma,
"gönderildiyse e-postanı kontrol et" de.

### 3.7 MFA yönetimi

| Çağrı | Ne yapar | Döner |
|---|---|---|
| `POST /api/mfa/setup/begin` | TOTP kurulumunu başlatır | `{manualEntryKey, otpAuthUri}` — `otpAuthUri`'yi QR'a çevirip göster |
| `POST /api/mfa/setup/complete` `{code}` | Kurulumu bitirir | `{recoveryCodes:[…]}` — **bir kez** gösterilir, kullanıcıya kaydettir |
| `POST /api/mfa/disable` `{totpCode?, recoveryCode?}` | MFA'yı kapatır | 204 |
| `POST /api/mfa/recovery-codes/regenerate` `{totpCode}` | Kurtarma kodlarını yeniler | yeni kodlar |

### 3.8 Oturumlar

| Çağrı | Ne yapar |
|---|---|
| `GET /api/sessions` | Kullanıcının oturumları: `sessionId`, `deviceName`, `ipAddress`, `createdAtUtc`, `revoked`, `revokedAtUtc`, `isCurrent` |
| `DELETE /api/sessions/{id}` | Belirli bir oturumu kapatır |

`isCurrent` ile "bu cihaz" etiketini gösterebilirsin.

## 4. Yetki modeli: hangi uç ne ister

Üç seviye var ve sınırlar bilinçli çizildi:

| Seviye | Ne gerekir | Hangi uçlar |
|---|---|---|
| **Herkese açık** | Hiçbir şey | Ürün ve açık artırma **okuma** uçları, giriş/kayıt |
| **Sadece giriş** | Geçerli access token | **Teklif vermek**, SignalR hub'ına bağlanmak, kendi hesap işlemleri |
| **İzin gerekli** | Token + ilgili `permission` claim'i | Ürün/açık artırma **yazma**, rol ve izin yönetimi |

**Teklif vermek bilinçli olarak izin istemez.** Kayıt olan herkes teklif
verebilmeli; aksi halde her yeni üyeye elle rol atamak gerekirdi. Yönetim
işleri ise izin ister.

İzin kodları:

| İzin | Neyi açar |
|---|---|
| `products.manage` | Ürün oluştur / güncelle / sil |
| `auctions.manage` | Açık artırma aç / başlat / iptal et |
| `users.read`, `users.manage` | Kullanıcı görüntüleme / rol atama |
| `roles.read`, `roles.manage` | Rol yönetimi |
| `permissions.read`, `permissions.manage` | İzin yönetimi |
| `sessions.read`, `sessions.manage` | Oturum yönetimi |

Demo kurulumunda `admin@auction.local` kullanıcısı **Admin** rolüyle gelir ve
bu izinlerin tamamına sahiptir.

## 5. Security API — kimlik ve yetki

Yukarıdaki akışların dışında kalan yönetim uçları:

### Kullanıcı–rol

| Metot | Yol | İzin | Gövde |
|---|---|---|---|
| GET | `/api/users/me` | giriş | — |
| POST | `/api/users/{userId}/roles` | `users.manage` | `{ "roleId": "…" }` |
| DELETE | `/api/users/{userId}/roles/{roleId}` | `users.manage` | — |

### Roller

| Metot | Yol | İzin | Gövde |
|---|---|---|---|
| GET | `/api/roles` | `roles.read` | — |
| GET | `/api/roles/{id}` | `roles.read` | — |
| POST | `/api/roles` | `roles.manage` | `{ "name": "Moderator" }` |
| PUT | `/api/roles/{id}` | `roles.manage` | `{ "name": "Yeni Ad" }` |
| DELETE | `/api/roles/{id}` | `roles.manage` | — |
| POST | `/api/roles/{id}/permissions` | `roles.manage` | `{ "permissionId": "…" }` |
| DELETE | `/api/roles/{id}/permissions/{permissionId}` | `roles.manage` | — |

Rol cevabı izinleri gömülü getirir:

```json
{ "id": "…", "name": "Admin", "permissions": [ { "id": "…", "code": "products.manage" } ] }
```

### İzinler

| Metot | Yol | İzin | Gövde |
|---|---|---|---|
| GET | `/api/permissions` | `permissions.read` | — |
| POST | `/api/permissions` | `permissions.manage` | `{ "code": "reports.read" }` |
| DELETE | `/api/permissions/{id}` | `permissions.manage` | — |

> Yeni izin kodu oluşturmak onu **çalışır** hale getirmez: kodun backend
> tarafında bir uca bağlanmış olması gerekir. Bu uçlar var olan izinleri
> rollere dağıtmak için.

## 6. Catalog API — ürünler

| Metot | Yol | Yetki |
|---|---|---|
| GET | `/api/products` | herkese açık |
| GET | `/api/products/categories` | herkese açık |
| GET | `/api/products/{id}` | herkese açık |
| POST | `/api/products` | `products.manage` |
| PUT | `/api/products/{id}` | `products.manage` |
| DELETE | `/api/products/{id}` | `products.manage` |

### Liste sorgusu

```
GET /api/products?page=1&pageSize=20&search=omega&category=Saat&sortBy=price&descending=false&isActive=true
```

| Parametre | Açıklama |
|---|---|
| `page`, `pageSize` | Sayfalama (`pageSize` en fazla 100) |
| `search` | Ad **ve** açıklama içinde arar, büyük/küçük harf duyarsız, Türkçe karakter sorunsuz |
| `category` | Tam eşleşme |
| `sortBy` | `name` · `price` · `createdAt` (varsayılan `createdAt`) |
| `descending` | Varsayılan `true` |
| `isActive` | `true`/`false`; verilmezse hepsi |

> `search` parametresini **URL-encode et**. Kodlanmamış Türkçe karakter
> içeren query string sunucu tarafından `400` ile reddedilir. Tarayıcı ve
> standart HTTP istemcileri bunu kendiliğinden yapar.

`GET /api/products/categories` sadece string dizisi döner:
`["Kitap","Koleksiyon","Mücevher","Müzik Enstrümanı","Saat"]` — filtre
açılır listesi için.

### Ürün nesnesi

```json
{
  "id": "…",
  "name": "Omega Seamaster 300 (1964)",
  "description": "Orijinal kadran, servis geçmişi tam.",
  "category": "Saat",
  "startingPrice": 42000.00,
  "imageUrl": "https://…",
  "isActive": true,
  "createdAt": "2026-10-29T06:50:00+00:00",
  "updatedAt": null
}
```

### Oluşturma / güncelleme gövdesi

```json
{
  "name": "Omega Seamaster 300",
  "description": "açıklama",
  "category": "Saat",
  "startingPrice": 42000,
  "imageUrl": "https://example.com/a.png"
}
```

Kurallar: `name` 3–200 karakter ve **benzersiz** (çakışırsa `409
duplicate_product_name`), `category` zorunlu, `startingPrice` 0'dan büyük,
`imageUrl` geçerli URL olmalı. `PUT` gövdesi ek olarak `isActive` alır ve
**tam değiştirme** yapar — göndermediğin alan boşalır.

### Ürün silmenin yan etkisi

Ürün silinince Auction servisi haberdar olur ve o ürüne ait **henüz
başlamamış** açık artırmaları iptal eder. Canlı ve bitmiş olanlara
dokunulmaz. Bu iptal, o odaya bağlı istemcilere `AuctionCancelled` olayı
olarak **anında** düşer.

Benzer şekilde ürün **güncellenince** başlamamış açık artırmaların başlık/
açıklama/görseli tazelenir. Canlı ilanın bilgisi değişmez — insanlar neye
teklif verdiğini bilmek zorunda.

## 7. Auction API — açık artırmalar ve teklifler

| Metot | Yol | Yetki |
|---|---|---|
| GET | `/api/auctions` | herkese açık |
| GET | `/api/auctions/{id}` | herkese açık |
| GET | `/api/auctions/{id}/bids` | herkese açık |
| POST | `/api/auctions` | `auctions.manage` |
| POST | `/api/auctions/{id}/bids` | **giriş** (izin gerekmez) |
| POST | `/api/auctions/{id}/start` | `auctions.manage` |
| POST | `/api/auctions/{id}/cancel` | `auctions.manage` |

### Liste sorgusu

```
GET /api/auctions?status=Live&search=omega&productId=…&page=1&pageSize=20
```

**Canlı olanlar her zaman üstte**, sonra bitişi en yakın olan. Ayrı bir
sıralama parametresi yok.

### Açık artırma nesneleri

Liste öğesi (`AuctionSummary`):

```json
{
  "id": "…",
  "productId": "…",
  "title": "Omega Seamaster 300 (1964)",
  "imageUrl": "https://…",
  "startingPrice": 42000.00,
  "currentPrice": 44000.00,
  "minimumIncrement": 500.00,
  "minimumNextBid": 44500.00,
  "bidCount": 3,
  "highestBidderName": "ayse@example.com",
  "status": "Live",
  "startsAt": "2026-10-29T06:45:00+00:00",
  "endsAt": "2026-10-29T10:45:00+00:00"
}
```

Detay (`GET /api/auctions/{id}`) bunlara ek olarak `description`,
`highestBidderId` ve **son 20 teklifi** (`recentBids`) içerir.

Teklif nesnesi:

```json
{
  "id": "…",
  "auctionId": "…",
  "amount": 44000.00,
  "bidderId": "…",
  "bidderName": "ayse@example.com",
  "createdAt": "2026-10-29T06:52:10+00:00"
}
```

> `bidderName` şu an kullanıcının **e-postası**. Security token'a görünen ad
> koymuyor. Arayüzde e-postayı maskelemek istersen (`a***@example.com`) bu
> frontend'in kararı.

### Teklif geçmişi

```
GET /api/auctions/{id}/bids?take=50
```

Yeniden eskiye sıralı dizi döner. `take` en fazla 200.

### Açık artırma açmak

```
POST /api/auctions          (auctions.manage)
```

```json
{
  "productId": "…",
  "startingPrice": 42000,
  "minimumIncrement": 500,
  "startsAt": "2026-10-29T12:00:00Z",
  "durationMinutes": 120
}
```

| Alan | Zorunlu | Davranış |
|---|---|---|
| `productId` | ✔ | Catalog'dan **senkron doğrulanır**; yoksa `404`, pasifse `409 product_inactive`, Catalog erişilemezse `502` |
| `startingPrice` | ✖ | Boşsa ürünün katalogdaki fiyatı kullanılır |
| `minimumIncrement` | ✖ | Varsayılan 100 |
| `startsAt` | ✖ | Boşsa **hemen** başlar (`status: "Live"`); ileri tarih verilirse `"Scheduled"`. Geçmiş tarih `409 invalid_start_time` |
| `durationMinutes` | ✖ | Varsayılan 60, en fazla 10080 (7 gün) |

Ürün bilgisi açık artırmaya **kopyalanır**; sonradan ürün değişse bile
canlı ilan sabit kalır.

### Teklif vermek (REST yolu)

```
POST /api/auctions/{id}/bids          (giriş gerekli)
```

```json
{ "amount": 44500 }
```

**Gövdede yalnızca tutar var.** Teklif sahibi access token'dan okunur.
Gövdeye `bidderId`/`bidderName` koysan bile yok sayılır — kimse başkası
adına teklif veremez.

**201** döner:

```json
{
  "bid": { "id": "…", "amount": 44500.00, "bidderId": "…", "bidderName": "…", "createdAt": "…" },
  "auction": { … güncel AuctionSummary … }
}
```

Reddedilme halleri [bölüm 9'daki](#9-hata-sözleşmesi) tabloda.

### Durum geçişleri

```
Scheduled ──(saat geldi / POST start)──► Live ──(süre doldu)──► Ended
    │                                      │
    └──────────(POST cancel)───────────────┴──► Cancelled
```

Geçişleri sunucudaki bir arka plan servisi **kendi başına** yapar: kullanıcı
hiçbir şey yapmasa bile açık artırma saati gelince `Live`, süresi dolunca
`Ended` olur ve odaya olay düşer. Yani ekranı canlı tutmak için zamanlayıcı
kurup sunucuyu yoklamana gerek yok.

`POST /api/auctions/{id}/start` demo kolaylığıdır: planlanmış bir açık
artırmayı saatini beklemeden canlıya alır. İdempotenttir (zaten canlıysa
hata vermez).

## 8. SignalR — canlı teklif akışı

```
Yol:    /hubs/auction        (gateway üzerinden: http://localhost:5080/hubs/auction)
Kimlik: ZORUNLU
```

### Bağlanma

Hub `[Authorize]` ile korunuyor. Token'ı **query string'de** gönder:

```
http://localhost:5080/hubs/auction?access_token=<accessToken>
```

Bunun sebebi protokol kısıtı: tarayıcı WebSocket el sıkışmasında
`Authorization` başlığı gönderemez. SignalR istemcilerinin bu iş için
hazır bir token sağlayıcı ayarı vardır — onu kullan, query string'i elle
kurmaktan daha güvenli ve token yenilenince otomatik günceller.

Token'sız ya da geçersiz token'lı bağlantı **kurulmaz** (bağlantı
başlatma hatası alırsın).

### Sunucuya çağrılabilen metotlar

| Metot | Parametreler | Döner | Açıklama |
|---|---|---|---|
| `JoinAuction` | `auctionId` | **AuctionDetail** | Odaya katar **ve** o anki durumu döner |
| `LeaveAuction` | `auctionId` | — | Odadan çıkar |
| `PlaceBid` | `auctionId`, `amount` | — | Sonuç olay olarak gelir |
| `WhoAmI` | — | `{id, name}` | Bağlantının token'dan okunan kimliği |

**`JoinAuction` değer döndürüyor — bunu kullan.** Önce REST'ten detay
çekip sonra socket'e bağlanırsan aradaki boşlukta düşen teklifi kaçırırsın.
`JoinAuction` hem odaya katar hem anlık durumu verir; yarış yok.

**`PlaceBid` cevap döndürmez.** Başarı/başarısızlık olay olarak gelir.
Senkron bir cevap istiyorsan REST yolunu kullan — ikisi aynı kuralları
uygular ve ikisi de aynı olayları yayınlar.

### Sunucudan gelen olaylar

| Olay | Kime gider | Alanlar |
|---|---|---|
| `BidPlaced` | Odadaki **herkese** | `auctionId`, `bidId`, `amount`, `minimumNextBid`, `bidderId`, `bidderName`, `bidCount`, `createdAt`, `endsAt` |
| `Outbid` | **Sadece teklifi geçilen kullanıcıya** | `auctionId`, `auctionTitle`, `yourBid`, `newPrice`, `newLeaderName`, `minimumNextBid` |
| `BidRejected` | **Sadece teklifi gönderen bağlantıya** | `auctionId`, `reason`, `errorCode`, `minimumRequired` |
| `AuctionStarted` | Odadaki herkese | `auctionId`, `title`, `currentPrice`, `minimumNextBid`, `startsAt`, `endsAt` |
| `AuctionEnded` | Odadaki herkese | `auctionId`, `title`, `finalPrice`, `winnerId`, `winnerName`, `bidCount`, `endedAt` |
| `AuctionCancelled` | Odadaki herkese | `auctionId`, `title` |
| `ViewerCountChanged` | Odadaki herkese | `auctionId`, `viewerCount` |

`Outbid` gerçekten hedeflidir: teklifi geçilen kullanıcının **tüm
sekmelerine** gider, başkasına gitmez. Aynı şekilde `BidRejected` yalnızca
o teklifi gönderen bağlantıya gider — başkasının reddini görmezsin.

### Ekranı güncelleme mantığı

`BidPlaced` olayı ekranı güncellemek için gereken her şeyi taşır:
`amount` → güncel fiyat, `minimumNextBid` → input'un alt sınırı,
`bidCount` → teklif sayısı, `bidderName` → lider. Yeni bir REST isteği
atmana gerek yok.

## 9. Hata sözleşmesi

Tüm servisler RFC 7807 `ProblemDetails` döner:

```json
{
  "type": "https://httpstatuses.com/409",
  "title": "İş kuralı ihlali",
  "status": 409,
  "detail": "Teklif çok düşük. En az 44,500.00 vermelisiniz.",
  "instance": "/api/auctions/…/bids",
  "errorCode": "bid_too_low",
  "minimumRequired": 44500.00,
  "traceId": "0HNPLG2R75NMS:0000000F",
  "correlationId": "0HNPLG2R75NMS:0000000F"
}
```

**`errorCode` alanına göre dallan**, `detail` metnine göre değil — metin
değişebilir, kod sözleşmedir. `traceId` ve `correlationId` aynı değeri
taşır (servisler tarihsel olarak farklı ad kullanıyordu, ikisi de veriliyor);
hata bildiriminde bunu göster, log'da aramak kolaylaşır.

Doğrulama hatalarında ek olarak alan bazlı liste gelir:

```json
{
  "status": 400,
  "title": "Validation failed",
  "errorCode": "validation.invalid",
  "errors": { "password": ["The length of 'Password' must be at least 12 characters."] }
}
```

### Hata kodları

| `errorCode` | HTTP | Anlamı / ne yapmalı |
|---|---|---|
| `unauthorized` | 401 | Token yok/geçersiz/süresi dolmuş/iptal edilmiş → yenilemeyi dene, olmazsa giriş ekranı |
| `forbidden` | 403 | Giriş var ama izin yok → düğmeyi hiç göstermemeliydin |
| `validation.invalid` | 400 | `errors` alanını forma işle |
| `not_found` | 404 | Kayıt yok |
| `bid_too_low` | 409 | `minimumRequired` ile input'u düzeltmeyi öner |
| `already_highest_bidder` | 409 | En yüksek teklif zaten kullanıcıda |
| `auction_not_started` | 409 | Henüz başlamadı |
| `auction_ended` | 409 | Süre doldu → ekranı kapat/yenile |
| `auction_cancelled` | 409 | İptal edilmiş |
| `invalid_start_time` | 409 | Geçmiş başlama zamanı |
| `product_inactive` | 409 | Pasif ürüne açık artırma açılamaz |
| `duplicate_product_name` | 409 | Aynı isimde ürün var |
| `invalid_amount` | 409 | Tutar 0 veya negatif |
| `external_service_error` | 502 | Bağımlı servis erişilemedi → tekrar denenebilir |
| `auth.invalid_credentials` | 401 | E-posta/parola yanlış |
| `auth.invalid_refresh_token` | 401 | Refresh token geçersiz |
| `auth.expired_refresh_token` | 401 | Refresh süresi dolmuş → giriş ekranı |
| `auth.revoked_refresh_token` · `auth.consumed_refresh_token` | 401 | Oturum iptal edildi (muhtemelen token yeniden kullanıldı) → giriş ekranı |
| `internal_error` | 500 | Beklenmeyen hata |

### Hız sınırı (429)

Security'nin hassas uçları (giriş, kayıt, parola sıfırlama, yenileme, çıkış…)
hız sınırlıdır: **varsayılan 60 saniyede 5 istek**. Aşılırsa `429` döner.

Arayüzde buna hazırlıklı ol: giriş düğmesini isteğe girince kilitle, hatalı
parolada otomatik tekrar deneme yapma, `429`'da kullanıcıya "biraz sonra
tekrar dene" de.

## 10. Backend davranışları: bilmen gerekenler

Bunlar backend'in gerçek davranışları; bilmeden yazarsan teşhisi zor
hatalar çıkar.

**1. 401 her zaman "giriş yap" demek değildir.**
Access token 15 dakikada dolar. Beklenen akış: `401` → bir kez yenile →
isteği tekrarla. Yenileme de `401` verirse o zaman gerçekten oturum bitti.

**2. Yenileme çağrısını sıraya al.**
Refresh token tek kullanımlıktır ve tüketilmiş token'ı tekrar göndermek
**tüm oturumu iptal eder**. Paralel üç istek aynı anda yenileme tetiklerse
kullanıcı dışarı atılır. Aynı anda yalnızca bir yenileme olmalı.

**3. Yeniden bağlanınca odaya TEKRAR katıl.**
SignalR bağlantısı koptuktan sonra geri geldiğinde sunucu tarafında yeni bir
bağlantı kimliği oluşur ve **grup üyelikleri sıfırlanır**. `JoinAuction`'ı
tekrar çağırmazsan bağlantı "bağlı" görünür ama hiçbir olay gelmez. Bu
hatanın teşhisi çok zordur. Üstelik tekrar çağırmak kopukken kaçırdığın
durumu da getirir.

**4. Token yenilendiğinde SignalR bağlantısı eski token'la çalışmaya devam eder.**
Bağlantı kurulurken doğrulanır; sonrasında açık kalır. Uzun oturumlarda
bağlantı koptuğunda yeniden bağlanma **yeni** token'la yapılmalı — token'ı
sabit bir string olarak verme, her bağlantı denemesinde güncel değeri
okuyacak şekilde ver (SignalR istemcilerindeki token sağlayıcı ayarı tam
bunun için var).

**5. Teklif reddi hata değil, normal akış.**
"Teklif çok düşük" ya da "en yüksek teklif sizde" kullanıcı hatasıdır.
`409`'u kırmızı bir sistem hatası gibi gösterme; `minimumRequired` ile
yapıcı bir öneri sun.

**6. Fiyat hesabı sunucuda.**
`minimumNextBid`'i `currentPrice + minimumIncrement` diye kendin hesaplama.
İlk teklifte kural farklıdır (artış eklenmez, başlangıç fiyatı geçerlidir)
ve bu kuralı iki yerde tutmak ayrışmaya açıktır.

**7. Geri sayımda sunucu saatini referans al.**
`endsAt` sunucu saatiyle UTC gelir; kullanıcının saati kayık olabilir. İlk
cevaptaki bir sunucu zamanıyla yerel saat arasındaki farkı ölç ve geri
sayımı o sapmayla düzelt. Aksi halde "bitti" yazarken teklif kabul edilmeye
devam eder (ya da tersi).

**8. Para alanları JSON sayısı olarak gelir.**
Bu büyüklüklerde sorun çıkmaz, ama kuruş hassasiyetiyle **hesap yapma**.
Ekranda sunucunun verdiği değerleri biçimlendirip göster.

**9. Çıkış anında etkilidir.**
Kullanıcı başka bir cihazdan `logout-all` yaptıysa eldeki access token
hemen geçersizleşir. Yani 401 "süre doldu" demek olmayabilir; yenileme de
başarısız olursa oturumu kapat.

**10. CORS gateway'de tanımlı.**
Varsayılan izinli adresler `http://localhost:5173` ve `http://localhost:3000`.
Başka portta çalışıyorsan backend'deki gateway ayarına eklenmesi gerekir —
bu bir backend değişikliğidir, frontend'den çözülemez.

**11. Türkçe karakterli query string'i kodla.**
Kodlanmamış karakter `400` ile döner. Tarayıcı ve standart istemciler bunu
zaten yapar; elle URL birleştiriyorsan dikkat et.

**12. Gateway token'ı doğrulamaz, aktarır.**
Doğrulamayı her servis kendi yapıyor. Senin açısından fark yok, ama bir uç
`401` dönüyorsa sorun gateway'de değil ilgili servistedir.

## 11. Uçtan uca senaryo

Tipik bir "açık artırmaya katıl ve teklif ver" akışı, sırayla:

| # | Çağrı | Not |
|---|---|---|
| 1 | `POST /api/auth/login` | `accessToken` + `refreshToken` al, `requiresMfa`'yı kontrol et |
| 2 | `GET /api/users/me` | `permissions` ile arayüzdeki yönetim düğmelerine karar ver |
| 3 | `GET /api/auctions?status=Live` | Liste ekranı (token gerekmez ama göndermen zararsız) |
| 4 | SignalR bağlan | `/hubs/auction?access_token=…` |
| 5 | `JoinAuction(auctionId)` | Detay ekranının ilk durumunu bu cevaptan doldur |
| 6 | Olayları dinle | `BidPlaced`, `Outbid`, `AuctionEnded`, `ViewerCountChanged`, `BidRejected` |
| 7 | `PlaceBid(auctionId, amount)` | Ya da `POST /api/auctions/{id}/bids` |
| 8 | `LeaveAuction(auctionId)` | Detay ekranından çıkarken |
| 9 | 401 görürsen `POST /api/auth/refresh` | Tek sıra halinde, sonra isteği tekrarla |
| 10 | `POST /api/auth/logout` | Çıkışta; refresh token'ı gövdede gönder |

### Denemek için hazır veri

Demo kurulumu şunlarla gelir:

- Yönetici: `admin@auction.local` / `Admin123!` (tüm izinler)
- 5 ürün, biri **canlı** 2 açık artırma
- Canlı açık artırma: `aaaaaaaa-0000-0000-0000-000000000001`
- Planlanmış açık artırma: `aaaaaaaa-0000-0000-0000-000000000002`

Hızlı doğrulama:

```bash
TOKEN=$(curl -s -X POST localhost:5080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@auction.local","password":"Admin123!"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['tokens']['accessToken'])")

curl -s localhost:5080/api/auctions | head -c 400

curl -s -X POST localhost:5080/api/auctions/aaaaaaaa-0000-0000-0000-000000000001/bids \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":42000}'
```

Yetki modelini görmek için token'sız aynı teklifi dene — `401` almalısın.

Uçların tamamını tarayıcıdan denemek istersen Swagger arayüzleri açık:
Security `:5020/swagger`, Catalog `:5005/swagger`, Auction `:5112/swagger`.
Her birinde **Authorize** düğmesine access token'ı yapıştırıp korumalı
uçları deneyebilirsin.
