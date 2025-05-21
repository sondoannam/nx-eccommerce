# health-monitor.ps1
# PowerShell script to check the health of all services

function Check-ServiceHealth {
    param (
        [string]$ServiceName,
        [string]$Url
    )
    
    Write-Host "Checking health of $ServiceName at $Url..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 5 -ErrorAction Stop
        $status = if ($response.status -eq "ok") { "UP" } else { "DEGRADED" }
        
        # Display health status
        if ($status -eq "UP") {
            Write-Host "✅ $ServiceName is $status" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $ServiceName is $status" -ForegroundColor Yellow
        }
        
        # Display details if available
        if ($response.details) {
            Write-Host "  Details:" -ForegroundColor Gray
            foreach ($key in $response.details.Keys) {
                $detail = $response.details[$key]
                $detailStatus = $detail.status
                $color = if ($detailStatus -eq "up") { "Green" } else { "Red" }
                Write-Host "    - $key: $detailStatus" -ForegroundColor $color
            }
        }
        
        return $response
    } 
    catch {
        Write-Host "❌ $ServiceName is DOWN - $_" -ForegroundColor Red
        return $null
    }
}

function Check-AllServices {
    $gatewayHealth = Check-ServiceHealth -ServiceName "API Gateway" -Url "http://localhost:8080/health"
    Write-Host ""
    
    # If gateway is up, check services via gateway API
    if ($gatewayHealth -ne $null) {
        $servicesInfo = Invoke-RestMethod -Uri "http://localhost:8080/api/health/services" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        if ($servicesInfo -ne $null -and $servicesInfo.services) {
            Write-Host "Registered Services:" -ForegroundColor Cyan
            foreach ($service in $servicesInfo.services) {
                $serviceUrl = "$($service.url)/health"
                Check-ServiceHealth -ServiceName $service.name -Url $serviceUrl
                Write-Host ""
            }
        }
    }
}

# Main execution
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "MULTI-VENDOR SAAS PLATFORM HEALTH MONITOR" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "Started at: $(Get-Date)" -ForegroundColor Blue
Write-Host ""

Check-AllServices

Write-Host "Health check completed at: $(Get-Date)" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue
