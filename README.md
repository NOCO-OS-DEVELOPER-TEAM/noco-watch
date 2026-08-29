# NOCO WATCH

Lokale Streaming-Plattform: Windows-App + API-Server + Browser/Mobile-UI im WLAN.

> **Wichtig:** Filme bleiben auf dem Windows-PC. GitHub hostet nur Code bzw. die Mobile-Web-Oberfläche – keine MP4s.

## Architektur

```text
GitHub Pages (optional)
NOCO WATCH Mobile Web
        │  HTTP API (gleiches WLAN)
        ↓
Windows-PC – NOCO WATCH Server
        ├── metadata/videos.json
        └── media/ (MP4 + HTML lokal)
```

## Schnellstart (PC)

```bash
npm install
npm run build
npm start
```

- Lokal: http://127.0.0.1:3000  
- WLAN: http://DEINE-IP:3000  
- Mobile UI (HTTP, empfohlen für iPhone): http://DEINE-IP:3000/web/

Windows-App:

```bash
npm run desktop
```

## Mobile Web / GitHub Pages

Frontend-only unter `noco-watch-web/` (keine Filme im Build).

Lokal:

```bash
npm run web:build
```

GitHub Actions baut und veröffentlicht die Mobile-UI automatisch (Workflow: **Deploy Mobile Web**).

Nach dem ersten Deploy:

1. Repo → **Settings → Pages → Source: GitHub Actions**
2. URL z. B. `https://NOCO-OS-DEVELOPER-TEAM.github.io/noco-watch/`
3. Am Server in `config/default.json` unter `cors.githubPagesOrigins` eintragen:

```json
"githubPagesOrigins": [
  "https://NOCO-OS-DEVELOPER-TEAM.github.io"
]
```

**Hinweis Mixed Content:** GitHub Pages = HTTPS, lokaler Server = HTTP. Browser können die Verbindung blockieren. Zum Testen die Mobile-UI über `http://DEINE-IP:3000/web/` öffnen.

## Tech-Stack

| Teil | Technologie |
|------|-------------|
| API / Streaming | Node.js + Express + HTTP Range |
| UI | React + Vite |
| Windows-App | Electron |
| Bibliothek | `metadata/videos.json` |
| Mobile Web | `noco-watch-web/` (GitHub Pages ready) |

## Videos hinzufügen

1. Datei lokal nach `media/` (MP4s werden **nicht** nach GitHub gepusht)  
2. Eintrag in `metadata/videos.json`

## Lizenz / Privat

Privates Streaming für dein WLAN. Keine öffentlichen Film-Uploads.
