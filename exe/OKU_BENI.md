# GeoHesap exe derleme

1. `kaynak\build.py` ile `GeoHesap.html` üret.
2. `GeoHesap.html` dosyasını bu klasöre `app.html` adıyla kopyala.
3. Windows için derle (Go 1.22+):
   `set GOOS=windows& set GOARCH=amd64& go build -trimpath -ldflags "-H=windowsgui -s -w" -o GeoHesap_ham.exe .`
4. Simge ve sürüm bilgisi (Node + `npm i resedit pe-library`):
   `node seticon.cjs GeoHesap_ham.exe GeoHesap.ico GeoHesap.exe 1.0.0`
5. Kurulum dosyası (NSIS 3): `GeoHesap.exe`, `GeoHesap.ico` ve `Ornekler` dosyaları yanındayken `makensis installer.nsi`.

Çalışma: exe gömülü HTML'i `%LOCALAPPDATA%\GeoHesap\app` klasörüne yazar ve Microsoft Edge'i
uygulama penceresi kipinde (`--app`) ayrı bir profille (`%LOCALAPPDATA%\GeoHesap\profil`) açar.
Edge yoksa Chrome, o da yoksa varsayılan tarayıcı kullanılır.
