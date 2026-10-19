// GeoHesap başlatıcı: gömülü HTML'i yerel klasöre yazar ve Microsoft Edge (veya Chrome)
// uygulama penceresinde açar. Sadece Go standart kütüphanesi kullanılır.
package main

import (
	"bytes"
	_ "embed"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

//go:embed app.html
var appHTML []byte

const appName = "GeoHesap"

func msgBox(title, text string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	proc := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(title)
	proc.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), 0x40) // MB_ICONINFORMATION
}

func baseDir() string {
	if d := os.Getenv("LOCALAPPDATA"); d != "" {
		return filepath.Join(d, appName)
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, "AppData", "Local", appName)
}

func findBrowser() string {
	var c []string
	for _, env := range []string{"ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"} {
		if p := os.Getenv(env); p != "" {
			c = append(c, filepath.Join(p, "Microsoft", "Edge", "Application", "msedge.exe"))
		}
	}
	for _, env := range []string{"ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"} {
		if p := os.Getenv(env); p != "" {
			c = append(c, filepath.Join(p, "Google", "Chrome", "Application", "chrome.exe"))
		}
	}
	for _, p := range c {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}

func fileURL(p string) string {
	u := url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(p)}
	return u.String()
}

func main() {
	base := baseDir()
	appDir := filepath.Join(base, "app")
	if err := os.MkdirAll(appDir, 0o755); err != nil {
		msgBox(appName, "Program klasörü oluşturulamadı:\n"+err.Error())
		return
	}
	htmlPath := filepath.Join(appDir, "GeoHesap.html")
	if old, err := os.ReadFile(htmlPath); err != nil || !bytes.Equal(old, appHTML) {
		if err := os.WriteFile(htmlPath, appHTML, 0o644); err != nil {
			msgBox(appName, "Program dosyası yazılamadı:\n"+err.Error())
			return
		}
	}
	target := fileURL(htmlPath)
	if br := findBrowser(); br != "" {
		profile := filepath.Join(base, "profil")
		args := []string{
			"--app=" + target,
			"--user-data-dir=" + profile,
			"--window-size=1500,950",
			"--no-first-run", "--no-default-browser-check",
			"--disable-sync", "--disable-features=Translate,msEdgeSidebarV2,msHubApps",
		}
		cmd := exec.Command(br, args...)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: false}
		if err := cmd.Start(); err == nil {
			return
		}
	}
	// Son çare: varsayılan tarayıcı
	cmd := exec.Command("rundll32", "url.dll,FileProtocolHandler", strings.ReplaceAll(htmlPath, "/", `\`))
	if err := cmd.Start(); err != nil {
		msgBox(appName, "Microsoft Edge veya Chrome bulunamadı ve varsayılan tarayıcı açılamadı.\n\nProgram dosyası:\n"+htmlPath)
	}
}
