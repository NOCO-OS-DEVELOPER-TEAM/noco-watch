@echo off
setlocal
cd /d "%~dp0.."

echo.
echo  NOCO WATCH Windows-App wird gestartet...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden. Bitte Node.js installieren.
  pause
  exit /b 1
)

if not exist "node_modules\electron\package.json" (
  echo Abhaengigkeiten werden installiert...
  call npm install
  if errorlevel 1 (
    echo npm install fehlgeschlagen.
    pause
    exit /b 1
  )
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo Electron-Binary fehlt – wird repariert...
  call npm install electron@34.2.0 --save-dev
  if not exist "node_modules\electron\dist\electron.exe" (
    echo Electron konnte nicht installiert werden.
    pause
    exit /b 1
  )
)

if not exist "client\dist\index.html" (
  echo UI wird gebaut...
  call npm run build
  if errorlevel 1 (
    echo Build fehlgeschlagen.
    pause
    exit /b 1
  )
)

REM Startet die echte Windows-App (Electron) inkl. Server + Player
call npm run app
if errorlevel 1 (
  echo.
  echo App-Start fehlgeschlagen.
  pause
  exit /b 1
)
