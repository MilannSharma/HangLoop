Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\cc\Music\Hangloop\mobile\assets\logo.png"
$resDir = "C:\Users\cc\Music\Hangloop\mobile\android\app\src\main\res"

function Resize-Image {
    param(
        [string]$sourceFile,
        [string]$targetFile,
        [int]$width,
        [int]$height,
        [bool]$addBackground = $false
    )
    $srcImg = [System.Drawing.Image]::FromFile($sourceFile)
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    if ($addBackground) {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0A0A0A"))
        $graphics.FillRectangle($brush, 0, 0, $width, $height)
    } else {
        $graphics.Clear([System.Drawing.Color]::Transparent)
    }
    
    $graphics.DrawImage($srcImg, 0, 0, $width, $height)
    
    $destBitmap.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $destBitmap.Dispose()
    $srcImg.Dispose()
    Write-Host "Generated: $targetFile ($width x $height)"
}

# Remove all old webp files in mipmaps
Get-ChildItem -Path "$resDir\mipmap-*" -Filter "*.webp" | Remove-Item -Force

# Density configurations
$configs = @(
    @{ Folder = "mipmap-mdpi"; Size = 48; ForeSize = 108 },
    @{ Folder = "mipmap-hdpi"; Size = 72; ForeSize = 162 },
    @{ Folder = "mipmap-xhdpi"; Size = 96; ForeSize = 216 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144; ForeSize = 324 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192; ForeSize = 432 }
)

foreach ($cfg in $configs) {
    $dir = "$resDir\$($cfg.Folder)"
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    
    Resize-Image -sourceFile $sourcePath -targetFile "$dir\ic_launcher.png" -width $cfg.Size -height $cfg.Size -addBackground $true
    Resize-Image -sourceFile $sourcePath -targetFile "$dir\ic_launcher_round.png" -width $cfg.Size -height $cfg.Size -addBackground $true
    Resize-Image -sourceFile $sourcePath -targetFile "$dir\ic_launcher_foreground.png" -width $cfg.ForeSize -height $cfg.ForeSize -addBackground $false
}

# Generate lightweight splash logo (256x256)
Resize-Image -sourceFile $sourcePath -targetFile "$resDir\drawable\splashscreen_logo.png" -width 256 -height 256 -addBackground $false

Write-Host "All Android icons and splash drawables generated successfully!"
