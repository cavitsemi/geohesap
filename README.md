# GeoHesap

GeoHesap, TBDY 2018 Bölüm 16 ve Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatına Dair Tebliğ (2019) kapsamında sığ temel hesaplarını yapmak ve Word raporu üretmek için geliştirilmiş çevrimdışı bir masaüstü uygulamasıdır.

## Tek dosya — indir ve çalıştır

**[GeoHesap.exe dosyasını indir](https://github.com/cavitsemi/geohesap/releases/latest/download/GeoHesap.exe)**

İnen `GeoHesap.exe` dosyasına çift tıklayın. Kurulum, ZIP açma veya Python yükleme gerekmez. GitHub'ın gösterdiği **Source code (zip)** ve **Source code (tar.gz)** bağlantıları geliştiriciler içindir; programı kullanmak için onları indirmeyin.

## Son kullanıcı gereksinimleri

- Windows 10 veya Windows 11
- Microsoft Edge (Windows ile birlikte gelir) ya da Google Chrome

**Python, Node.js ve Go kurulumu gerekmez.** Releases sayfasındaki kurulum veya taşınabilir EXE, uygulamanın çalışması için gereken HTML/CSS/JavaScript dosyalarını içinde taşır. Program çevrimdışı çalışır ve hesap verilerini bir sunucuya göndermez.

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

## Geliştiriciler için derleme ve doğrulama

Aşağıdaki araçlar yalnızca kaynak koddan yeni bir sürüm üretmek isteyen geliştiriciler içindir; hazır EXE'yi kullananların bunları kurması gerekmez.

```powershell
py -3 build.py
node -e "require('./src/engine.js'); console.log(GEO.selfTest())"
```

Derleme sonunda `dist/GeoHesap.html` üretilir. Windows uygulaması ve kurulum paketi adımları için `exe/OKU_BENI.md` dosyasına bakın.

## Kurulum

Hazır uygulama GitHub deposunun **Releases** bölümündeki `GeoHesap.exe` dosyasından indirilebilir ve doğrudan çalıştırılabilir.

## Örnek veri

Depodaki örnek proje tamamen sentetiktir; gerçek kişi, kuruluş, adres, parsel veya mühendislik projesine dayanmaz.

## Uyarı

Bu yazılım hesap çıktısı üretir. Girdi verilerinin uygunluğu, sonuçların kontrolü ve tüm mühendislik sorumluluğu kullanıcıya aittir.
