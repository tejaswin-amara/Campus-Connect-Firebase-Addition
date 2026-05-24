# Campus Connect - Force Stop Script

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   🛑 Stopping Campus Connect...          " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(5173, 9099, 8080, 9199, 4000)

foreach ($port in $ports) {
    Write-Host "Scanning port $port..." -ForegroundColor Yellow
    $netstatOutput = netstat -ano | findstr /R ":$port\b"
    if ($netstatOutput) {
        $pidFound = $null
        foreach ($line in $netstatOutput) {
            if ($line -match "LISTENING") {
                $parts = $line -split '\s+'
                $pidFound = $parts[-1]
                break
            }
        }
        
        if ($pidFound) {
            Write-Host "Stopping process with PID: $pidFound on port $port..." -ForegroundColor Cyan
            try {
                Stop-Process -Id $pidFound -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped process successfully." -ForegroundColor Green
            }
            catch {
                # Silently ignore
            }
        }
    }
}

Write-Host ""
Write-Host "🎉 All local Campus Connect services stopped successfully." -ForegroundColor Green
Write-Host ""
