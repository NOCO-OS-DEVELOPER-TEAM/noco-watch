# NOCO WATCH – Mobile Web

GitHub-Pages-Frontend. **Keine Filme, keine MP4s, keine HTML-Filme, keine Datenbank.**

Alles kommt live vom NOCO-WATCH-Server auf dem Windows-PC.

## Entwickeln

```bash
npm install
npm run dev
```

Standard-Serveradresse (änderbar in Einstellungen):

```text
http://192.168.178.197:3000
```

## Build

```bash
npm run build
```

Ausgabe: `dist/` (wird von GitHub Actions veröffentlicht).

## iPhone ohne Mixed Content

Am PC:

```bash
npm run web:build
npm start
```

Dann: `http://DEINE-PC-IP:3000/web/`
