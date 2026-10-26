# GeoHesap exe derleme

Bu belge yalnızca geliştiriciler içindir. Releases sayfasından indirilen `GeoHesap_Kurulum_x.y.z.exe` ve `GeoHesap_tasinabilir.exe` dosyalarını çalıştırmak için Python, Node.js veya Go kurulması gerekmez.

1. Depo kökünde `python build.py` ile `dist\GeoHesap.html` üret.
2. `dist\GeoHesap.html` dosyasını `exe\app.html` adıyla kopyala; sonraki komutları `exe` klasöründe çalıştır.
3. Windows için derle (Go 1.22+):
   `set GOOS=windows& set GOARCH=amd64& go build -trimpath -ldflags "-H=windowsgui -s -w" -o GeoHesap_ham.exe .`
4. Simge ve sürüm bilgisi (Node + `npm i --no-save --package-lock=false resedit@1 pe-library@1`):
   `node seticon.cjs GeoHesap_ham.exe GeoHesap.ico GeoHesap.exe 1.1.0`
5. Kurulum dosyası (NSIS 3): `makensis installer.nsi`. Kurulum paketi `examples\Sentetik_Ornek_Proje.geo.json` dosyasını içerir.

Çalışma: exe gömülü HTML'i `%LOCALAPPDATA%\GeoHesap\app` klasörüne yazar ve Microsoft Edge'i
uygulama penceresi kipinde (`--app`) ayrı bir profille (`%LOCALAPPDATA%\GeoHesap\profil`) açar.
Edge yoksa Chrome, o da yoksa varsayılan tarayıcı kullanılır.
