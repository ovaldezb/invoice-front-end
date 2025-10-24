# Script PowerShell para ejecutar pruebas de rendimiento y estrés
# Uso: .\run-performance-tests.ps1

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 SUITE DE PRUEBAS DE RENDIMIENTO Y ESTRÉS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Verificar si el servidor está corriendo
Write-Host "🔍 Verificando servidor en localhost:4200..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Servidor detectado y funcionando`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  El servidor no está respondiendo en localhost:4200" -ForegroundColor Red
    Write-Host "📝 Por favor, inicia el servidor en otra terminal con: npm start`n" -ForegroundColor Yellow
    Read-Host "Presiona Enter cuando el servidor esté listo"
}

# Array de pruebas a ejecutar
$tests = @(
    @{
        Name = "Pruebas de Rendimiento"
        Spec = "cypress/e2e/performance.cy.js"
        Emoji = "⚡"
    },
    @{
        Name = "Pruebas de Estrés"
        Spec = "cypress/e2e/stress-test.cy.js"
        Emoji = "💪"
    },
    @{
        Name = "Reportes de Performance"
        Spec = "cypress/e2e/performance-report.cy.js"
        Emoji = "📊"
    }
)

$results = @()
$startTime = Get-Date

foreach ($test in $tests) {
    Write-Host "`n$($test.Emoji) Ejecutando: $($test.Name)..." -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    $testStart = Get-Date
    
    # Ejecutar Cypress
    $output = npx cypress run --spec $test.Spec --browser chrome --headless 2>&1
    $exitCode = $LASTEXITCODE
    
    $testEnd = Get-Date
    $duration = ($testEnd - $testStart).TotalSeconds
    
    $result = @{
        Name = $test.Name
        Success = ($exitCode -eq 0)
        Duration = [math]::Round($duration, 2)
        ExitCode = $exitCode
    }
    
    $results += $result
    
    if ($exitCode -eq 0) {
        Write-Host "`n✅ $($test.Name) completadas en $($result.Duration)s" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  $($test.Name) finalizadas con código $exitCode en $($result.Duration)s" -ForegroundColor Yellow
    }
    
    # Pausa entre pruebas
    Start-Sleep -Seconds 2
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

# Generar resumen
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMEN FINAL DE PRUEBAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$index = 1
foreach ($result in $results) {
    $status = if ($result.Success) { "✅ ÉXITO" } else { "❌ FALLÓ" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "$index. $status - $($result.Name) ($($result.Duration)s)" -ForegroundColor $color
    $index++
}

$passed = ($results | Where-Object { $_.Success }).Count
$failed = ($results | Where-Object { -not $_.Success }).Count

Write-Host "`n⏱️  Tiempo total: $([math]::Round($totalDuration, 2))s" -ForegroundColor Cyan
Write-Host "✅ Exitosas: $passed/$($results.Count)" -ForegroundColor Green
Write-Host "❌ Fallidas: $failed/$($results.Count)" -ForegroundColor Red

# Guardar resumen JSON
$summary = @{
    timestamp = Get-Date -Format "o"
    totalDuration = "$([math]::Round($totalDuration, 2))s"
    results = $results
    success = ($failed -eq 0)
    stats = @{
        total = $results.Count
        passed = $passed
        failed = $failed
    }
} | ConvertTo-Json -Depth 10

$reportsDir = "cypress\reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
}

$summary | Out-File -FilePath "$reportsDir\test-summary.json" -Encoding UTF8

Write-Host "`n📄 Reporte guardado en: $reportsDir\test-summary.json" -ForegroundColor Cyan

# Generar reporte Markdown
$markdown = @"
# 📊 Reporte de Pruebas de Rendimiento y Estrés

**Fecha:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

**Duración Total:** $([math]::Round($totalDuration, 2))s

## 📈 Resumen Ejecutivo

- ✅ **Pruebas Exitosas:** $passed/$($results.Count)
- ❌ **Pruebas Fallidas:** $failed/$($results.Count)
- 🎯 **Tasa de Éxito:** $([math]::Round(($passed / $results.Count) * 100, 1))%

## 📋 Detalles por Prueba

"@

$index = 1
foreach ($result in $results) {
    $status = if ($result.Success) { "✅" } else { "❌" }
    $markdown += @"

### $index. $status $($result.Name)

- **Duración:** $($result.Duration)s
- **Estado:** $(if ($result.Success) { "EXITOSA" } else { "FALLIDA" })
- **Código de Salida:** $($result.ExitCode)

"@
    $index++
}

$markdown += @"

## 📊 Reportes Disponibles

Los siguientes reportes fueron generados durante las pruebas:

1. ``cypress/reports/performance-report.json`` - Métricas detalladas de rendimiento
2. ``cypress/reports/performance-evaluation.json`` - Evaluación y recomendaciones
3. ``cypress/reports/benchmark.json`` - Comparativa con estándares
4. ``cypress/reports/stress-test-*.json`` - Resultados individuales de pruebas de estrés
5. ``cypress/reports/stress-test-consolidado.json`` - Reporte consolidado de estrés

## 💡 Recomendaciones

1. Revisar los archivos JSON generados en ``cypress/reports/`` para análisis detallado
2. Monitorear las métricas que estén cerca de los umbrales definidos
3. Ejecutar estas pruebas regularmente para detectar regresiones de rendimiento
4. Considerar implementar estas pruebas en el pipeline de CI/CD

## 🔍 Próximos Pasos

### Si todas las pruebas pasaron ✅
- Establecer estos resultados como baseline para futuras comparaciones
- Documentar las métricas actuales como KPIs del proyecto
- Configurar alertas si las métricas se degradan más del 20%

### Si alguna prueba falló ❌
- Revisar los logs detallados de Cypress
- Identificar cuellos de botella en el código
- Optimizar recursos y assets pesados
- Considerar implementar lazy loading o code splitting

---

*Reporte generado automáticamente - $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")*
"@

$markdown | Out-File -FilePath "$reportsDir\TEST-SUMMARY-REPORT.md" -Encoding UTF8

Write-Host "📄 Reporte Markdown guardado en: $reportsDir\TEST-SUMMARY-REPORT.md" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Abrir el reporte Markdown
$openReport = Read-Host "¿Deseas abrir el reporte Markdown? (s/n)"
if ($openReport -eq "s" -or $openReport -eq "S") {
    Start-Process "$reportsDir\TEST-SUMMARY-REPORT.md"
}

Write-Host "✨ Proceso completado!" -ForegroundColor Green
