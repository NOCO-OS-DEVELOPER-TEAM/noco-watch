# NOCO WATCH – Windows Firewall (privates Netzwerk)

Damit andere Geräte im selben WLAN auf NOCO WATCH zugreifen können:

```text
http://DEINE-IP:3000
```

z. B. `http://192.168.178.197:3000`

## Regel (nur Privat)

Als Administrator PowerShell:

```powershell
cd "C:\Users\noah_\NOCO WATCH"
.\scripts\open-firewall-private.ps1
```

Oder manuell:

1. Windows-Sicherheit → Firewall → Erweiterte Einstellungen
2. Eingehende Regeln → Neue Regel
3. Port → TCP → 3000
4. Verbindung zulassen
5. Profil: **Nur Privat** (nicht Öffentlich)
6. Name: `NOCO WATCH Local LAN`

## Prüfen

- PC und Handy/Mac im **selben WLAN**
- Adresse mit **http://** (nicht https://)
- Server läuft (`npm start` oder Windows-App)
- Server lauscht auf `0.0.0.0:3000` (Standard in `config/default.json`)
