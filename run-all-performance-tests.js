/**
 * Script para ejecutar todas las pruebas de rendimiento y estrés
 * Genera reportes consolidados en formato JSON y Markdown
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 INICIANDO SUITE COMPLETA DE PRUEBAS');
console.log('═══════════════════════════════════════════════════════════\n');

const tests = [
  {
    name: 'Pruebas de Rendimiento',
    spec: 'cypress/e2e/performance.cy.js',
    emoji: '⚡'
  },
  {
    name: 'Pruebas de Estrés',
    spec: 'cypress/e2e/stress-test.cy.js',
    emoji: '💪'
  },
  {
    name: 'Reportes de Performance',
    spec: 'cypress/e2e/performance-report.cy.js',
    emoji: '📊'
  }
];

let currentTest = 0;

function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`\n${test.emoji} Ejecutando: ${test.name}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const startTime = Date.now();
    
    const command = `npx cypress run --spec "${test.spec}" --browser chrome --headless`;
    
    const child = exec(command, { maxBuffer: 1024 * 1024 * 10 });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        console.log(`\n✅ ${test.name} completadas en ${duration}s\n`);
        resolve({ success: true, duration, test: test.name });
      } else {
        console.log(`\n⚠️ ${test.name} finalizadas con código ${code} en ${duration}s\n`);
        resolve({ success: false, duration, test: test.name, code });
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Error ejecutando ${test.name}:`, error.message);
      reject(error);
    });
  });
}

async function runAllTests() {
  const results = [];
  const globalStartTime = Date.now();
  
  for (const test of tests) {
    try {
      const result = await runTest(test);
      results.push(result);
      
      // Pequeña pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      results.push({
        success: false,
        test: test.name,
        error: error.message
      });
    }
  }
  
  const globalEndTime = Date.now();
  const totalDuration = ((globalEndTime - globalStartTime) / 1000).toFixed(2);
  
  // Generar reporte final
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL DE PRUEBAS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ ÉXITO' : '❌ FALLÓ';
    console.log(`${index + 1}. ${status} - ${result.test} (${result.duration}s)`);
  });
  
  console.log(`\n⏱️  Tiempo total: ${totalDuration}s`);
  console.log(`✅ Exitosas: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`❌ Fallidas: ${results.filter(r => !r.success).length}/${results.length}`);
  
  // Guardar resumen
  const summary = {
    timestamp: new Date().toISOString(),
    totalDuration: `${totalDuration}s`,
    results: results,
    success: results.every(r => r.success),
    stats: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'cypress', 'reports', 'test-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n📄 Reporte guardado en: cypress/reports/test-summary.json');
  
  // Generar reporte Markdown
  await generateMarkdownReport(summary);
  
  console.log('═══════════════════════════════════════════════════════════\n');
  
  process.exit(results.every(r => r.success) ? 0 : 1);
}

async function generateMarkdownReport(summary) {
  let markdown = `# 📊 Reporte de Pruebas de Rendimiento y Estrés\n\n`;
  markdown += `**Fecha:** ${new Date(summary.timestamp).toLocaleString('es-MX')}\n\n`;
  markdown += `**Duración Total:** ${summary.totalDuration}\n\n`;
  
  markdown += `## 📈 Resumen Ejecutivo\n\n`;
  markdown += `- ✅ **Pruebas Exitosas:** ${summary.stats.passed}/${summary.stats.total}\n`;
  markdown += `- ❌ **Pruebas Fallidas:** ${summary.stats.failed}/${summary.stats.total}\n`;
  markdown += `- 🎯 **Tasa de Éxito:** ${((summary.stats.passed / summary.stats.total) * 100).toFixed(1)}%\n\n`;
  
  markdown += `## 📋 Detalles por Prueba\n\n`;
  
  summary.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    markdown += `### ${index + 1}. ${status} ${result.test}\n\n`;
    markdown += `- **Duración:** ${result.duration}s\n`;
    markdown += `- **Estado:** ${result.success ? 'EXITOSA' : 'FALLIDA'}\n`;
    if (result.code) {
      markdown += `- **Código de Salida:** ${result.code}\n`;
    }
    if (result.error) {
      markdown += `- **Error:** ${result.error}\n`;
    }
    markdown += `\n`;
  });
  
  // Intentar leer reportes generados
  const reportsDir = path.join(__dirname, 'cypress', 'reports');
  
  if (fs.existsSync(reportsDir)) {
    markdown += `## 📊 Reportes Generados\n\n`;
    
    const reportFiles = [
      'performance-report.json',
      'performance-evaluation.json',
      'benchmark.json',
      'stress-test-consolidado.json'
    ];
    
    for (const file of reportFiles) {
      const filePath = path.join(reportsDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          markdown += `### 📄 ${file}\n\n`;
          markdown += '```json\n';
          markdown += JSON.stringify(data, null, 2);
          markdown += '\n```\n\n';
        } catch (error) {
          markdown += `⚠️ Error leyendo ${file}\n\n`;
        }
      }
    }
  }
  
  markdown += `## 💡 Recomendaciones\n\n`;
  markdown += `1. Revisar los archivos JSON generados en \`cypress/reports/\` para análisis detallado\n`;
  markdown += `2. Monitorear las métricas que estén cerca de los umbrales definidos\n`;
  markdown += `3. Ejecutar estas pruebas regularmente para detectar regresiones de rendimiento\n`;
  markdown += `4. Considerar implementar estas pruebas en el pipeline de CI/CD\n\n`;
  
  markdown += `---\n\n`;
  markdown += `*Reporte generado automáticamente por el sistema de pruebas de rendimiento*\n`;
  
  fs.writeFileSync(
    path.join(__dirname, 'cypress', 'reports', 'TEST-SUMMARY-REPORT.md'),
    markdown
  );
  
  console.log('📄 Reporte Markdown guardado en: cypress/reports/TEST-SUMMARY-REPORT.md');
}

// Verificar que el servidor esté corriendo
console.log('🔍 Verificando servidor de desarrollo...\n');

const checkServer = exec('curl http://localhost:4200 --max-time 5', (error) => {
  if (error) {
    console.log('⚠️  El servidor no está corriendo en localhost:4200');
    console.log('📝 Por favor, inicia el servidor con: npm start\n');
    console.log('Luego ejecuta este script nuevamente.\n');
    process.exit(1);
  } else {
    console.log('✅ Servidor detectado en localhost:4200\n');
    runAllTests();
  }
});
