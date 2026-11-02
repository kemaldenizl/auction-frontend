# Mezat — canlı açık artırma frontend'i

Üç mikroservisin (Security + Catalog + Auction) önündeki gateway'e bağlanan
Next.js uygulaması. Kimlik ve yetki Security'den, ürünler Catalog'dan, teklifler
ve canlı akış Auction'dan gelir. Backend sözleşmesi [frontend.md](frontend.md).

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Gateway adresi (varsayılan `http://localhost:5080`). Tüm yolları ilgili servise bu dağıtır. Servislerin kendi portlarını (5020 / 5005 / 5112) kullanmayın. |
| `NEXT_PUBLIC_SIGNALR_SKIP_NEGOTIATION` | Auction servisi birden çok replica ile çalışıyorsa `true`. `negotiate` adımını atlar; karşılığında SSE / long polling yedekleri kalkar. |

Gateway CORS'unda `http://localhost:3000` ekli olmalı. Demo hesabı:
`admin@auction.local` / `Admin123!` (tüm izinler).

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run build      # üretim derlemesi
npm run test       # vitest
npm run typecheck  # rota tiplerini üretir + tsc
npm run lint       # eslint
```

## Dosya yapısı

Feature-first: her alan kendi tiplerini, API'sini, durumunu ve bileşenlerini
taşır. `app/` yalnızca rota kompozisyonu yapar.

```
src/
  app/
    (auth)/                giriş, kayıt, parola sıfırlama, e-posta doğrulama
    (app)/                 site kabuğu: ana sayfa, açık artırmalar, ürünler,
                           hesap, yönetim
  features/
    auth/                  token deposu, tek sıralı yenileme, oturum durumu,
                           giriş/kayıt/MFA formları, RequireAuth
    account/               profil, parola/e-posta değişimi, MFA, oturumlar
    access-control/        roller, izinler, kullanıcı-rol atama
    catalog/               ürün listesi, detay, CRUD formu
    auction/               liste, oda, SignalR hub, teklif formu, hub günlüğü
  shared/
    api/                   http istemcisi, ApiError, Result
    ui/                    tasarım sistemi
    lib/                   cn, format, search-params, browser-storage
    hooks/                 useNow, useAsyncData, useFormSubmit
```

### Katman kuralı

`shared` hiçbir feature'ı bilmez. `auth` yalnızca `shared`'a bağlıdır; diğer
feature'lar `auth`'a bağlanabilir, çünkü korumalı her çağrı token ister.

## Tasarım sistemi

**Token'lar** `src/app/globals.css` içinde: her renk ham CSS değişkeni olarak
açık ve koyu tema için ayrı tanımlanır, `@theme inline` ile `bg-surface`,
`text-muted`, `border-line` gibi anlamsal yardımcılara açılır. Bileşenler ham
renk kullanmaz. Beyaz metin taşıyan dolgular (`bg-gradient-brand`) iki temada
da koyu tonda sabittir; metin için kullanılan `--brand` ise koyu temada açılır.

**Tema** `<html data-theme>` üzerinde durur. Açık / koyu / sistem tercihi
`localStorage`'da saklanır ve `<head>`'deki satır içi betik onu **ilk boyamadan
önce** uygular — bu yüzden yenilemede yanlış tema yanıp sönmez
(`shared/theme/theme-store.ts`). Sistem modunda işletim sistemi değişince sayfa
canlı olarak geçiş yapar.

**Hareket** token olarak tanımlı: `animate-fade-up`, `animate-scale-in`,
`animate-price-pop`, `animate-shimmer` vb. Listeler `stagger(index)` ile sırayla
girer. `prefers-reduced-motion` açıksa tüm animasyonlar kapanır.

Primitifler `src/shared/ui`: Button, Card, Badge, Alert, Field, Dialog, Toast,
NavTabs, ChipLink, SearchForm, Table, Skeleton, EmptyState, Thumbnail.

## Kullanıcıya dönük metin

Sunucunun `detail` metni geliştirici için yazılır — çoğu zaman İngilizcedir,
bazen "access token" ya da "uç" gibi terimler içerir. Bu yüzden **hiçbir zaman
olduğu gibi gösterilmez.** `shared/api/error-messages.ts` `errorCode`'u (yoksa
HTTP durumunu) sade Türkçeye çevirir; alan bazlı doğrulama mesajları da
(`"must contain at least one digit"` → "En az bir rakam içermeli.") çevrilir.
Yalnızca `UserFacingError` sınıfından gelen mesajlar olduğu gibi gösterilir.

Aynı ilkeyle kullanıcı arayüzünde hata kodu, iz kimliği (traceId), oturum /
token kimlikleri ve izin kodları gösterilmez; izinler Türkçe adlarıyla görünür
(`PERMISSION_LABELS`). Odadaki SignalR hub günlüğü yalnızca geliştirme
derlemesinde (`NODE_ENV=development`) render edilir.

## Kimlik ve yetki

**Token'lar.** Access token 15 dakika, refresh token 30 gün yaşar ve
`localStorage`'da durur. Bu bir SPA akışıdır: XSS riskini httpOnly çereze göre
kabul eder, buna karşılık dokümandaki sözleşmeyi birebir uygular.

**Yenileme tek sıradadır** (`features/auth/lib/refresh.ts`). Refresh token tek
kullanımlıktır ve tüketilmiş bir token'ı tekrar göndermek backend tarafından
hırsızlık sayılıp **tüm oturumu** iptal ettirir. Aynı anda 401 alan üç istek
ayrı ayrı yenileme tetiklerse kullanıcı dışarı atılır — bu yüzden hepsi aynı
promise'i bekler. `use-auction-room` için yazılan testin yanında
`refresh.test.ts` bu davranışı doğrudan doğrular.

**İki HTTP istemcisi var:**

| İstemci | Kullanım |
| --- | --- |
| `authHttp` | `/api/auth/*` ve `/api/mfa/login/complete`. Bearer başlığı yok, 401 tekrarı yok — başarısız giriş 401 olarak görünmeli ve yenileme çağrısı kendini tetiklememeli. |
| `apiHttp` | Diğer her şey. Token varsa ekler, 401'de bir kez yeniler ve isteği tekrarlar. Token yoksa başlık göndermez, böylece herkese açık okumalar da aynı istemciden geçer. |

**İzinler** `GET /api/users/me`'den gelir ve yalnızca arayüzü biçimlendirmek
için kullanılır (`RequireAuth`, `PermissionGate`). Asıl kontrol sunucudadır;
izin olmadan açılan bir ekran yine `403` alır.

## Yetkilendirilmiş sayfalar ve `instant`

Korumalı sayfalar oturum okunana kadar içeriğini render edemez. Next 16'nın
instant-navigation doğrulaması bunu "düşmüş segment" olarak bildirir, bu yüzden
o sayfalar `export const instant = false` taşır — doküman bu durumda önerilen
yol budur. Kabuk (başlık, sekmeler) anında boyanır; yalnızca panel bekler.

## SignalR mimarisi

Hub artık `[Authorize]` ile korunuyor ve kimlik token'dan okunuyor.

| Dosya | Sorumluluk |
| --- | --- |
| `model/hub-events.ts` | Sunucu → istemci olay sözleşmesi |
| `model/auction-room.ts` | Saf reducer: tüm durum geçişleri ve seçiciler |
| `realtime/auction-hub.ts` | `AuctionHub` arayüzü — taşıma dikişi |
| `realtime/signalr-auction-hub.ts` | Gerçek `HubConnection` uygulaması |
| `hooks/use-auction-room.ts` | Bağlantı yaşam döngüsünü reducer'a bağlar |

Durum mantığı reducer'da saf tutulduğu için soket olmadan test edilebilir;
bağlantı davranışı `test-support/fake-auction-hub.ts` ile sürülür.

### Tuzaklar ve nerede ele alındıkları

| Tuzak | Çözüm |
| --- | --- |
| Hub token'ı başlıkla taşınamaz | `accessTokenFactory` ile verilir; **fonksiyon** olarak, çünkü yeniden bağlanma güncel token'ı okumalı |
| Yeniden bağlanınca grup üyeliği sıfırlanır | `onReconnected` içinde `JoinAuction` tekrar çağrılır |
| StrictMode effect'i iki kez çalıştırır | `start()` beklenir, sonra `LeaveAuction` + `stop()` |
| Kapatılan bağlantı hâlâ olay yayar | `disposed` bayrağı ile `emit` susturulur |
| Dinleyicide bayat state | Tüm dinleyiciler `dispatch` eder, state okumaz |
| Aynı teklif iki kez | Akış `bidId` ile tekilleştirilir |
| Handler'dan değer dönmesi | `AuctionHub.on` sarmalayıcısı gövdeyi süslü parantezle çağırır |
| Bağlanmadan `invoke` | `placeBid` önce `isConnected()` kontrol eder |
| Kayık istemci saati | `serverOffsetMs` olay zaman damgasından ölçülür |
| Oturum değişince eski bağlantı | `sessionKey` effect bağımlılığıdır; bağlantı yeniden kurulur |

### Kim olduğunu hub söyler

`WhoAmI` bağlantının token'dan okunan kimliğini döndürür. "En yüksek teklif
sizde" ve "(siz)" işaretleri buradan gelir; frontend kimliği dışarıdan
almaz. Teklif gövdesi de yalnızca `{ amount }` taşır.

### Hub mu REST mi

Oda socket açıkken hub'ı kullanır. Bağlantı kopuksa aynı teklif REST ile
gider: aynı kurallar, aynı olaylar, tek fark sonucu nasıl öğrendiğiniz. Teklif
formu iki yolun reddini de aynı şekilde gösterir, çünkü REST cevabı da
`errorCode` ve `minimumRequired` taşır. Form hangi yolun kullanılacağını yazar.

## Veri çekme

`cacheComponents` açık. Herkese açık listeler (ana sayfa, açık artırmalar,
ürünler) sunucuda render edilir ve Partial Prerender olarak çıkar: kabuk anında
boyanır, veri akar. Oturum gerektiren ekranlar istemcide `useAsyncData` ile
okur.

Açık artırma odası bilinçli olarak sunucuda veri çekmez: `JoinAuction` hem
gruba katar hem anlık durumu döner, böylece "önce REST çek, sonra bağlan"
arasındaki boşlukta teklif kaçmaz. Oturumu olmayan ziyaretçi ise odanın REST
karşılığını görür — açık artırma okumaları herkese açıktır.

Beklenen API hataları `attempt()` ile değere çevrilip `ApiErrorPanel` olarak
yerinde gösterilir (`errorCode` ve `traceId` görünür kalır).

## Bilinen boşluk

Backend'de **kullanıcı listeleme ucu yok** (`GET /api/users` → 404). Bu yüzden
rol atama ekranı kullanıcıyı üye numarasıyla alır; kullanıcı numarasını
Profilim sayfasındaki "Kopyala" düğmesiyle iletebilir. Benzer şekilde MFA'nın
açık olup olmadığını söyleyen bir uç yok, bu yüzden güvenlik ekranı durumu
yansıtmak yerine eylemleri sunar.

## Testler

```bash
npm run test
```

Ağırlık saf birimlerde: oda reducer'ı, HTTP istemcisi (bearer + 401 tekrarı),
`ProblemDetails` ayrıştırma, yenileme kuyruğu, token deposu, filtre URL'leri ve
biçimlendirme. Bağlantı davranışı (yeniden katılma, kopma, oturum değişimi,
hazır olmayan soket) sahte hub ile sürülür; teklif formu, akış ve geri sayım
bileşen testleriyle kapsanır.
