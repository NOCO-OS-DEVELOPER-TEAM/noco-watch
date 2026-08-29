# Creates public/branding/noco-watch.ico and a Desktop shortcut.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$brandDir = Join-Path $root 'public\branding'
New-Item -ItemType Directory -Force -Path $brandDir | Out-Null
$icoPath = Join-Path $brandDir 'noco-watch.ico'

function New-NocoBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 6, 16))

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 225, 29, 72)), ([Math]::Max(2, [int]($size * 0.04)))
  $margin = [int]($size * 0.08)
  $g.DrawEllipse($pen, $margin, $margin, $size - 2 * $margin, $size - 2 * $margin)

  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $pts = @(
    (New-Object System.Drawing.Point ([int]($size * 0.38), [int]($size * 0.30))),
    (New-Object System.Drawing.Point ([int]($size * 0.72), [int]($size * 0.50))),
    (New-Object System.Drawing.Point ([int]($size * 0.38), [int]($size * 0.70)))
  )
  $g.FillPolygon($brush, $pts)

  $accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 225, 29, 72))
  $dot = [Math]::Max(2, [int]($size * 0.05))
  $g.FillEllipse($accent, ($size / 2 - $dot / 2), ($size / 2 - $dot / 2), $dot, $dot)

  $g.Dispose()
  $pen.Dispose()
  $brush.Dispose()
  $accent.Dispose()
  return $bmp
}

# Build multi-size ICO manually via Icon.FromHandle is single-size; save largest as ICO via Image.Save with icon encoder if available.
$bmp256 = New-NocoBitmap 256
$icon = [System.Drawing.Icon]::FromHandle($bmp256.GetHicon())
$fs = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmp256.Dispose()

Write-Host "Icon written: $icoPath"

$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'NOCO WATCH.lnk'
$bat = Join-Path $root 'scripts\start-noco-app.bat'

$w = New-Object -ComObject WScript.Shell
$shortcut = $w.CreateShortcut($lnkPath)
$shortcut.TargetPath = $bat
$shortcut.WorkingDirectory = $root
$shortcut.WindowStyle = 1
$shortcut.Description = 'NOCO WATCH'
$shortcut.IconLocation = "$icoPath,0"
$shortcut.Save()

Write-Host "Desktop shortcut: $lnkPath"
