$VPS = "root@74.208.252.40"
$RemotePath = "/opt/corgi-studio"

Write-Host "=== CORGI STUDIO BOT - VPS UPDATE ==="

Write-Host "1. Uploading source..."
scp -r src uploads package.json package-lock.json deploy-commands.js "${VPS}:${RemotePath}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed."
    exit 1
}

Write-Host "2. Installing dependencies and restarting bot..."
ssh $VPS "cd $RemotePath && npm ci && pm2 restart corgi-studio-bot && pm2 save"

if ($LASTEXITCODE -ne 0) {
    Write-Host "VPS update failed."
    exit 1
}

Write-Host "=== UPDATE COMPLETED ==="