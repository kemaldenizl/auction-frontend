# Mezat — canlı açık arttırma frontend'i

İki mikroservisin (katalog + açık arttırma) önündeki gateway'e bağlanan Next.js
uygulaması. Canlı teklif akışı SignalR ile taşınır; sözleşme
[frontend.md](frontend.md) içinde.

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`:

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Gateway adresi (varsayılan `http://localhost:5080`). `/api/products`, `/api/auctions` ve `/hubs/auction` yollarını ilgili servise bu dağıtır. Servislerin kendi portlarını (5005 / 5112) kullanmayın. |
| `NEXT_PUBLIC_SIGNALR_SKIP_NEGOTIATION` | Açık arttırma servisi birden çok replica ile çalışıyorsa `true`. `negotiate` adımını atlar; karşılığında SSE / long polling yedekleri kalkar. |

Gateway CORS'unda `http://localhost:3000` origin'inin ekli olması gerekir.

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
taşır. `app/` yalnızca rota kompozisyonu yapar, iş mantığı içermez.

```
src/
  app/                     rotalar (ince) + site kabuğu
  features/
    auction/
      api/                 REST istemcisi
      model/               alan tipleri, hub sözleşmesi, oda reducer'ı
      realtime/            AuctionHub arayüzü + SignalR uygulaması
      hooks/               useAuctionRoom
      components/          oda, teklif formu, akış, hub günlüğü, kartlar
      test-support/        fixture'lar ve sahte hub
    catalog/               ürünler (api / model / components)
    bidder/                yerel kimlik (JWT gelene kadar)
  shared/
    api/                   http istemcisi, ApiError, Result
    ui/                    tasarım sistemi
    lib/                   cn, format, search-params
    hooks/                 useNow
```

### Katman kuralı

`shared` hiçbir feature'ı bilmez. Feature'lar `shared`'ı kullanır; aralarında
yalnızca `auction → bidder` bağımlılığı vardır (hub URL'i kimlik taşır).

## Tasarım sistemi

Renkler `src/app/globals.css` içinde tek yerde tanımlı: ham CSS değişkenleri,
karanlık tema için yeniden tanım, sonra `@theme inline` ile Tailwind'e
`bg-surface` / `text-muted` / `border-line` gibi anlamsal yardımcılar olarak
açılır. Bileşenler ham renk kullanmaz, bu yüzden palet değişimi hiçbir bileşen
dosyasına dokunmaz. Primitifler `src/shared/ui`.

## SignalR mimarisi

Üç karar, [frontend.md](frontend.md)'deki üç kuraldan türüyor:

**Durumun kaynağı sunucudur.** `BidPlaced` olayı `amount`, `minimumNextBid` ve
`bidCount` değerlerini getirir; reducer bunları olduğu gibi yazar. Hiçbir yerde
fiyat ya da minimum artış hesaplanmaz.

**İlk durum `JoinAuction`'dan gelir.** Oda sayfası sunucu tarafında veri
çekmez (`src/app/auctions/[id]/page.tsx`). `JoinAuction` hem gruba katar hem
anlık durumu döner — "önce REST çek, sonra bağlan" arasındaki boşlukta teklif
kaçma ihtimali yoktur.

**Teklifin sonucu cevap değil olaydır.** `placeBid` yalnızca çağrının
gittiğini bildirir; kabul `BidPlaced`, ret `BidRejected` olarak döner.

### Parçalar

| Dosya | Sorumluluk |
| --- | --- |
| `model/hub-events.ts` | Sunucu → istemci olay sözleşmesi |
| `model/auction-room.ts` | Saf reducer: tüm durum geçişleri ve seçiciler |
| `realtime/auction-hub.ts` | `AuctionHub` arayüzü — taşıma dikişi |
| `realtime/signalr-auction-hub.ts` | Gerçek `HubConnection` uygulaması |
| `hooks/use-auction-room.ts` | Bağlantı yaşam döngüsünü reducer'a bağlar |

Durum mantığı reducer'da saf tutulduğu için soket olmadan test edilebilir;
bağlantı davranışı ise `test-support/fake-auction-hub.ts` ile sürülür.

### Tuzaklar ve nerede ele alındıkları

| Tuzak | Çözüm |
| --- | --- |
| Yeniden bağlanınca grup üyeliği sıfırlanır | `onReconnected` içinde `JoinAuction` tekrar çağrılır (`use-auction-room.ts`) |
| StrictMode effect'i iki kez çalıştırır | `start()` promise'i beklenip sonra `stop()` çağrılır |
| Kapatılan bağlantı hâlâ olay yayar | `disposed` bayrağı ile `emit` susturulur — eski soketin `onclose`'u yeni odaya düşmez |
| Dinleyicide bayat state | Tüm dinleyiciler `dispatch` eder, state okumaz |
| `bidder` nesnesi bağımlılıkta | Effect `bidder.id` / `bidder.name` alanlarına bağlıdır |
| Aynı teklif iki kez | Akış `bidId` ile tekilleştirilir |
| Handler'dan değer dönmesi | `AuctionHub.on` sarmalayıcısı gövdeyi süslü parantezle çağırır |
| Bağlanmadan `invoke` | `placeBid` önce `isConnected()` kontrol eder, aksi halde `HubNotReadyError` |
| Kayık istemci saati | `serverOffsetMs` olay zaman damgasından ölçülür, geri sayım buna göre düzeltilir |

## Veri çekme

`cacheComponents` açık. Önbelleklenmemiş okumalar `<Suspense>` içinde akar, bu
yüzden kabuk hemen boyanır ve veri sonradan gelir — derleme çıktısında katalog
ve liste rotaları Partial Prerender olarak işaretlenir.

Beklenen API hataları `attempt()` ile değere çevrilip `ApiErrorPanel` olarak
yerinde gösterilir (`errorCode` ve `traceId` görünür kalır); `error.tsx`
yalnızca beklenmeyen hatalar için.

## Kimlik

JWT yok; kimlik `localStorage`'da tutulur ve hub URL'ine query parametresi
olarak eklenir. Başlıktaki **Yeni kimlik** düğmesi yeni bir `bidderId` üretir:
ikinci bir sekmede buna basıp teklif verirseniz ilk sekmede `Outbid` uyarısını
görürsünüz.

JWT eklendiğinde değişecek tek yer `signalr-auction-hub.ts`: query
parametreleri kalkar, yerine `accessTokenFactory` gelir. Olay sözleşmesi,
reducer ve bileşenler aynı kalır.

## Testler

```bash
npm run test
```

Ağırlık saf birimlerde: oda reducer'ı, HTTP istemcisi, biçimlendirme ve kimlik
deposu. Bağlantı davranışı (yeniden katılma, kopma, hazır olmayan soket) sahte
hub ile `use-auction-room.test.tsx` içinde sürülür. Bileşen tarafında teklif
formu, akış ve geri sayım kapsanır.
