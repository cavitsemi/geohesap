Unicode true
!include "MUI2.nsh"
!define APP "GeoHesap"
!define VER "1.1.0"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"
Name "${APP} ${VER}"
OutFile "GeoHesap_Kurulum_${VER}.exe"
InstallDir "$LOCALAPPDATA\Programs\${APP}"
InstallDirRegKey HKCU "Software\${APP}" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "GeoHesap — TBDY 2018 · Tebliğ 2019"
VIProductVersion "${VER}.0"
VIAddVersionKey /LANG=1055 "ProductName" "${APP}"
VIAddVersionKey /LANG=1055 "FileDescription" "GeoHesap Kurulum"
VIAddVersionKey /LANG=1055 "FileVersion" "${VER}"
VIAddVersionKey /LANG=1055 "LegalCopyright" "© 2026"
!define MUI_ICON "GeoHesap.ico"
!define MUI_UNICON "GeoHesap.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "GeoHesap kurulumuna hoş geldiniz"
!define MUI_WELCOMEPAGE_TEXT "GeoHesap, TBDY 2018 Bölüm 16 ve 2019 Tebliği'ne göre sığ temel geoteknik hesaplarını yapar ve Word raporu üretir.$\r$\n$\r$\nKurulum yönetici izni gerektirmez. Program, bilgisayardaki Microsoft Edge (Windows 10/11'de yüklü gelir) ile kendi penceresinde açılır; internet bağlantısı gerekmez.$\r$\n$\r$\nDevam etmek için İleri'ye tıklayın."
!define MUI_FINISHPAGE_RUN "$INSTDIR\GeoHesap.exe"
!define MUI_FINISHPAGE_RUN_TEXT "GeoHesap'ı şimdi başlat"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\Ornekler"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Örnek proje ve rapor klasörünü aç"
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Turkish"

Section "GeoHesap" SEC1
  SetOutPath "$INSTDIR"
  File "GeoHesap.exe"
  File "GeoHesap.ico"
  SetOutPath "$INSTDIR\Ornekler"
  File "..\examples\Sentetik_Ornek_Proje.geo.json"
  SetOutPath "$INSTDIR"
  CreateDirectory "$SMPROGRAMS\${APP}"
  CreateShortcut "$SMPROGRAMS\${APP}\GeoHesap.lnk" "$INSTDIR\GeoHesap.exe" "" "$INSTDIR\GeoHesap.ico" 0
  CreateShortcut "$SMPROGRAMS\${APP}\Örnek proje ve rapor.lnk" "$INSTDIR\Ornekler"
  CreateShortcut "$SMPROGRAMS\${APP}\GeoHesap'ı kaldır.lnk" "$INSTDIR\Kaldir.exe"
  CreateShortcut "$DESKTOP\GeoHesap.lnk" "$INSTDIR\GeoHesap.exe" "" "$INSTDIR\GeoHesap.ico" 0
  WriteUninstaller "$INSTDIR\Kaldir.exe"
  WriteRegStr HKCU "Software\${APP}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "${APP}"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VER}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "GeoHesap"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\GeoHesap.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Kaldir.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\GeoHesap.lnk"
  RMDir /r "$SMPROGRAMS\${APP}"
  Delete "$INSTDIR\GeoHesap.exe"
  Delete "$INSTDIR\GeoHesap.ico"
  Delete "$INSTDIR\Kaldir.exe"
  RMDir /r "$INSTDIR\Ornekler"
  RMDir "$INSTDIR"
  RMDir /r "$LOCALAPPDATA\${APP}\app"
  DeleteRegKey HKCU "${UNINST}"
  DeleteRegKey HKCU "Software\${APP}"
SectionEnd
