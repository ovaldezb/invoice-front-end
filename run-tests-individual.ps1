# Script optimizado para ejecutar pruebas individualmente
# Ejecuta cada archivo de pruebas por separado para evitar problemas de memoria

param(
    [string]$TestType = "all" # all, performance, stress, report
)

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 EJECUCIÓN CONTROLADA DE PRUEBAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Configuración
$testsToRun = @()

switch ($TestType.ToLower()) {
    "performance" {
        $testsToRun = @("cypress/e2e/performance.cy.js")
    }
    "stress" {
        $testsToRun = @("cypress/e2e/stress-test.cy.js")
    }
    "report" {
        $testsToRun = @("cypress/e2e/performance-report.cy.js")
    }
    default {
        $testsToRun = @(
            "cypress/e2e/performance.cy.js",
            "cypress/e2e/stress-test.cy.js",
            "cypress/e2e/performance-report.cy.js"
        )
    }
}

Write-Host "📋 Pruebas programadas: $($testsToRun.Count)`n" -ForegroundColor Yellow

foreach ($test in $testsToRun) {
    $testName = [System.IO.Path]::GetFileNameWithoutExtension($test)
    
    Write-Host "`n🔹 Ejecutando: $testName" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Ejecutar con configuración optimizada para memoria
    $command = "npx cypress run --spec `"$test`" --browser chrome --config video=false,screenshotOnRunFailure=false"
    Invoke-Expression $command
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✅ $testName completado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $testName finalizado con código: $exitCode" -ForegroundColor Yellow
    }
    
    # Pausa entre pruebas para liberar memoria
    Write-Host "`n⏳ Pausa de 5 segundos para liberar recursos...`n" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ TODAS LAS PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Mostrar reportes generados
Write-Host "📊 Reportes disponibles en: cypress/reports/`n" -ForegroundColor Cyan

$reportsDir = "cypress\reports"
if (Test-Path $reportsDir) {
    $reports = Get-ChildItem -Path $reportsDir -Filter "*.json" | Select-Object -ExpandProperty Name
    foreach ($report in $reports) {
        Write-Host "   📄 $report" -ForegroundColor White
    }
}

Write-Host "`n💡 Tip: Abre los archivos JSON para ver métricas detalladas" -ForegroundColor Yellow
Write-Host "✨ Proceso completado!`n" -ForegroundColor Green
