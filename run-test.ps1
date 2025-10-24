# Script simple para ejecutar pruebas de Cypress
param([string]$TestType = "report")

Write-Host "Ejecutando pruebas de $TestType..." -ForegroundColor Cyan

$spec = switch ($TestType) {
    "performance" { "cypress/e2e/performance.cy.js" }
    "stress" { "cypress/e2e/stress-test.cy.js" }
    "report" { "cypress/e2e/performance-report.cy.js" }
    default { "cypress/e2e/performance-report.cy.js" }
}

Write-Host "Spec: $spec" -ForegroundColor Yellow

npx cypress run --spec $spec --browser chrome --config video=false

Write-Host "Prueba completada!" -ForegroundColor Green
