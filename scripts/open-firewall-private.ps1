# NOCO WATCH – Firewall-Regel nur für private Netzwerke
# Als Administrator ausführen.

$ErrorActionPreference = 'Stop'
$ruleName = 'NOCO WATCH Local LAN (TCP 3000)'

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Regel existiert bereits: $ruleName"
  exit 0
}

New-NetFirewallRule `
  -DisplayName $ruleName `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 3000 `
  -Profile Private `
  -Description 'Erlaubt LAN-Zugriff auf NOCO WATCH nur im privaten Netzwerk.' | Out-Null

Write-Host "Firewall-Regel angelegt: $ruleName (Profil: Private, Port: 3000/TCP)"
Write-Host "Oeffne auf anderen Geraten: http://<PC-IP>:3000"
