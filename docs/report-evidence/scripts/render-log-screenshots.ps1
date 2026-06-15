$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourceDir = Join-Path $root "screenshot-sources"
$outputDir = Join-Path $root "screenshots"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function Remove-Ansi {
  param([string]$Value)
  return ($Value -replace "$([char]27)\[[0-9;]*[A-Za-z]", "")
}

function Wrap-Line {
  param(
    [string]$Line,
    [int]$MaxChars
  )

  if ($Line.Length -le $MaxChars) {
    return @($Line)
  }

  $parts = New-Object System.Collections.Generic.List[string]
  $remaining = $Line

  while ($remaining.Length -gt $MaxChars) {
    $cut = $remaining.LastIndexOf(" ", [Math]::Min($MaxChars, $remaining.Length - 1))
    if ($cut -lt 24) {
      $cut = $MaxChars
    }
    $parts.Add($remaining.Substring(0, $cut).TrimEnd())
    $remaining = $remaining.Substring($cut).TrimStart()
  }

  if ($remaining.Length -gt 0) {
    $parts.Add($remaining)
  }

  return $parts.ToArray()
}

function New-TerminalScreenshot {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [string]$Title
  )

  $rawLines = Get-Content -Path $InputPath
  $wrappedLines = New-Object System.Collections.Generic.List[string]

  foreach ($line in $rawLines) {
    $clean = Remove-Ansi -Value $line
    foreach ($wrapped in (Wrap-Line -Line $clean -MaxChars 104)) {
      $wrappedLines.Add($wrapped)
    }
  }

  $width = 1700
  $padding = 42
  $titleHeight = 84
  $lineHeight = 29
  $height = [Math]::Min(2200, [Math]::Max(760, $titleHeight + ($wrappedLines.Count * $lineHeight) + ($padding * 2)))

  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $background = [System.Drawing.Color]::FromArgb(15, 23, 42)
  $bar = [System.Drawing.Color]::FromArgb(30, 41, 59)
  $text = [System.Drawing.Color]::FromArgb(226, 232, 240)
  $muted = [System.Drawing.Color]::FromArgb(148, 163, 184)
  $green = [System.Drawing.Color]::FromArgb(34, 197, 94)
  $yellow = [System.Drawing.Color]::FromArgb(250, 204, 21)
  $red = [System.Drawing.Color]::FromArgb(248, 113, 113)
  $blue = [System.Drawing.Color]::FromArgb(96, 165, 250)

  $graphics.Clear($background)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush($bar)), 0, 0, $width, 74)

  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush($red)), 26, 26, 16, 16)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush($yellow)), 52, 26, 16, 16)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush($green)), 78, 26, 16, 16)

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
  $monoFont = New-Object System.Drawing.Font("Consolas", 18, [System.Drawing.FontStyle]::Regular)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)

  $graphics.DrawString($Title, $titleFont, (New-Object System.Drawing.SolidBrush($text)), 120, 20)
  $graphics.DrawString("Sahabat Qolbu report evidence", $smallFont, (New-Object System.Drawing.SolidBrush($muted)), ($width - 360), 27)

  $y = 104
  foreach ($line in $wrappedLines) {
    if ($y -gt ($height - 48)) {
      $graphics.DrawString("... output truncated for screenshot, full log is available in logs/", $monoFont, (New-Object System.Drawing.SolidBrush($muted)), $padding, $y)
      break
    }

    $brushColor = $text
    if ($line -match "PASS|OK|Compiled successfully|passed|pass\s+48|fail\s+0|Generated static pages") {
      $brushColor = $green
    } elseif ($line -match "warning|warnings|skipped|WARN") {
      $brushColor = $yellow
    } elseif ($line -match "disabled|Blocked|failed|error") {
      $brushColor = $red
    } elseif ($line -match "^PS |^> |Branch|Commit|Evidence") {
      $brushColor = $blue
    }

    $graphics.DrawString($line, $monoFont, (New-Object System.Drawing.SolidBrush($brushColor)), $padding, $y)
    $y += $lineHeight
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$files = Get-ChildItem -Path $sourceDir -Filter "*.txt" | Sort-Object Name
foreach ($file in $files) {
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  $title = $baseName -replace "^\d+-", "" -replace "-", " "
  $title = (Get-Culture).TextInfo.ToTitleCase($title)
  $outputPath = Join-Path $outputDir "$baseName.png"
  New-TerminalScreenshot -InputPath $file.FullName -OutputPath $outputPath -Title $title
  Write-Host "Rendered $outputPath"
}
