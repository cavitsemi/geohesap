# GeoHesap — Yönetmelik uyumu ve hesap doğruluğu denetimi

GeoHesap kaynaklarını deneyimli bir geoteknik mühendisi ve yazılım denetçisi gözüyle incele. TBDY 2018 Bölüm 2, 3, 16 ve Ek 16A/16B ile Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatına Dair Tebliğ (2019) hükümlerini esas al.

## İncelenecek dosyalar

- `src/engine.js`: hesap motoru
- `src/report.js`: Word raporu metin ve tabloları
- `src/ui.js`: ekran adımları ve açıklamalar
- `src/draw.js`: geometri ve çizimler
- `src/docx.js`: Word üretimi
- `src/example.js`: gerçek projeye dayanmayan sentetik örnek

## İnceleme başlıkları

1. Tasarım spektrumu, DTS ve BYS hesapları
2. Yerel zemin sınıfı, Vs30 ve SPT düzeltmeleri
3. Taşıma gücü, etkin alan ve taban basıncı
4. Kayma güvenliği ve pasif direnç
5. Elastik, konsolidasyon ve Schmertmann oturması
6. Yatak katsayısı yöntemleri ve birimler
7. Sondaj sayısı, derinliği ve jeofizik gereklilikleri
8. Sıvılaşma kapsamı ve uyarı koşulları
9. Şişme değerlendirmesi
10. Rapor metnindeki yönetmelik atıfları ve kesin hüküm ifadeleri
11. Sınır durumları: YASS konumu, drenajsız analiz, kısmi temas, iki yönlü moment, boş veri ve B > L

## Otomatik test

```powershell
node -e "require('./src/engine.js'); console.log(GEO.selfTest())"
```

Dokuz testin tamamı `ok: true` vermelidir. Testler İMO/AFAD Örnek 3, CE336 PS1 soruları ve gerçek bir projeye dayanmayan sentetik regresyon kontrollerinden oluşur.

## Çıktı

Önem sırasına göre bulgular tablosu, doğrulanan maddeler listesi, bağımsız hesap özeti ve belirsizlikler bölümü hazırla. Her bulguda dosya/satır, yönetmelik dayanağı, hesap etkisi ve önerilen düzeltmeyi belirt. Tahminleri yönetmelik hükmü gibi sunma.

Kod değiştirme. Önce yalnızca raporla; değişiklikler ayrıca onaylandıktan sonra uygulanmalıdır.
