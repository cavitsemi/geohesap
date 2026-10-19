# GeoHesap

GeoHesap, TBDY 2018 Bölüm 16 ve Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatına Dair Tebliğ (2019) kapsamında sığ temel hesaplarını yapmak ve Word raporu üretmek için geliştirilmiş çevrimdışı bir masaüstü uygulamasıdır.

## Modüller

- TBDY tasarım spektrumu, DTS ve BYS
- Yerel zemin sınıfı, SPT ve Vs değerlendirmeleri
- Taşıma gücü ve taban basıncı
- Kayma güvenliği
- Elastik, konsolidasyon ve Schmertmann oturması
- Yatak katsayısı
- Sondaj kapsamı ve yönetmelik uyarıları
- Word raporu ve temel çizimleri

Hesap motorunda dokuz otomatik doğrulama testi bulunur. Testler İMO/AFAD Örnek 3, CE336 PS1 soruları ve sentetik regresyon kontrollerini kapsar.

## Derleme ve doğrulama

```powershell
py -3 build.py
node -e "require('./src/engine.js'); console.log(GEO.selfTest())"
```

Derleme sonunda `dist/GeoHesap.html` üretilir. Windows uygulaması ve kurulum paketi adımları için `exe/OKU_BENI.md` dosyasına bakın.

## Kurulum

Hazır kurulum paketi GitHub deposunun **Releases** bölümündeki `GeoHesap_Kurulum_x.y.z.exe` dosyasından indirilebilir.

## Örnek veri

Depodaki örnek proje tamamen sentetiktir; gerçek kişi, kuruluş, adres, parsel veya mühendislik projesine dayanmaz.

## Uyarı

Bu yazılım hesap çıktısı üretir. Girdi verilerinin uygunluğu, sonuçların kontrolü ve tüm mühendislik sorumluluğu kullanıcıya aittir.
