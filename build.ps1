# Bundle the site into ONE self-contained file: dist\index.html
# Run:  powershell -ExecutionPolicy Bypass -File build.ps1
#
# - style.css, config.js, app.js, participate.js, admin.js are inlined.
# - images\instructor.jpg (or .png/.webp) is embedded if it exists.
# - The page also carries its own "shell" so the admin screen can save
#   a new index.html with updated settings.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false
function Read-Text($name) { [IO.File]::ReadAllText((Join-Path $root $name), [Text.Encoding]::UTF8) }

$html = Read-Text "index.html"
$css = Read-Text "style.css"
$config = Read-Text "config.js"
$jsFiles = @("app.js", "participate.js", "admin.js")

# Embed the instructor photo as a data URI so the single file needs no images folder.
$photoMime = @{ ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".png" = "image/png"; ".webp" = "image/webp" }
$photoPath = [regex]::Match($config, 'photo:\s*"([^"]+)"').Groups[1].Value
if ($photoPath -and -not $photoPath.StartsWith("data:")) {
  $full = Join-Path $root $photoPath
  if (Test-Path $full) {
    $mime = $photoMime[[IO.Path]::GetExtension($full).ToLower()]
    if ($mime) {
      $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($full))
      $config = $config.Replace('"' + $photoPath + '"', '"data:' + $mime + ';base64,' + $b64 + '"')
      Write-Host "Embedded photo: $photoPath"
    }
  } else {
    Write-Host "Photo not found ($photoPath) - the initial letter will be shown instead."
  }
}

# 1) Build the shell: index.html with placeholders where each file goes.
$shell = $html.Replace('<link rel="stylesheet" href="style.css">', '<style>%%CSS%%</style>')
$shell = $shell.Replace('<script src="config.js"></script>',
  '<script type="application/json" id="bundle-shell">%%SHELL%%</script>' + "`n  " + '<script id="site-config">%%CONFIG%%</script>')
foreach ($f in $jsFiles) {
  $shell = $shell.Replace('<script src="' + $f + '"></script>', '<script data-file="' + $f + '">%%JS:' + $f + '%%</script>')
}
foreach ($marker in @("%%CSS%%", "%%SHELL%%", "%%CONFIG%%")) {
  if (-not $shell.Contains($marker)) { throw "index.html structure changed: could not place $marker" }
}

# 2) Fill all placeholders in ONE pass, so text that gets inserted (e.g. admin.js, which
#    mentions the placeholder names itself) is never scanned again.
#    The shell is stored as JSON (with < > escaped) so it is safe inside <script>.
$parts = @{
  "CSS"    = $css
  "CONFIG" = $config
  "SHELL"  = (ConvertTo-Json -InputObject $shell -Compress)
}
foreach ($f in $jsFiles) { $parts["JS:" + $f] = Read-Text $f }
$out = [regex]::Replace($shell, '%%(CSS|CONFIG|SHELL|JS:[\w.-]+)%%', [System.Text.RegularExpressions.MatchEvaluator] {
  param($m)
  $key = $m.Groups[1].Value
  if (-not $parts.ContainsKey($key)) { throw "Unknown placeholder: $key" }
  return $parts[$key]
})

$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force $dist | Out-Null
$target = Join-Path $dist "index.html"
[IO.File]::WriteAllText($target, $out, $utf8)
$kb = [math]::Round((Get-Item $target).Length / 1KB)
Write-Host "Built $target ($kb KB)"
