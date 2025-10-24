describe('Prueba de Estrés - Formulario de Factura', () => {
  
  it('🔥 Llena el formulario con ticket TNPI3112-982895 exactamente 20 veces', () => {
    const iteraciones = 20;
    const resultados = [];
    const ticketNumber = 'TNPI3112-982895';
    
    cy.log('═══════════════════════════════════════════════════════════');
    cy.log('🔥 STRESS TEST: FORMULARIO CON TICKET');
    cy.log(`📝 Iteraciones: ${iteraciones}`);
    cy.log(`🎫 Ticket: ${ticketNumber}`);
    cy.log('═══════════════════════════════════════════════════════════');
    
    for (let i = 0; i < iteraciones; i++) {
      const inicio = Date.now();
      
      // Visitar página de factura
      cy.visit('/factura', { timeout: 15000 });
      
      // Llenar el campo de ticket
      cy.get('input#ticketNumber', { timeout: 10000 })
        .should('be.visible')
        .clear({ force: true })
        .type(ticketNumber, { delay: 0 });
      
      // Click en consultar venta
      cy.get('button').contains('Consultar Venta')
        .should('be.visible')
        .click();
      
      // Esperar un tiempo fijo para que cargue (más realista para stress test)
      cy.wait(2000);
      
      const tiempo = Date.now() - inicio;
      resultados.push(tiempo);
      
      // Medición de memoria
      cy.window().then((win) => {
        const memoriaUsada = win.performance.memory 
          ? (win.performance.memory.usedJSHeapSize / 1048576).toFixed(2)
          : 'N/A';
        
        cy.log(`✅ Iteración ${i + 1}/${iteraciones}: ${tiempo}ms - Memoria: ${memoriaUsada} MB`);
      });
      
      // Log cada 5 iteraciones con promedio parcial
      if ((i + 1) % 5 === 0) {
        const promedioParcial = (resultados.reduce((a, b) => a + b, 0) / resultados.length).toFixed(2);
        cy.log(`📊 Progreso: ${i + 1}/${iteraciones} completados - Promedio: ${promedioParcial}ms`);
      }
    }
    
    // Análisis de resultados
    cy.then(() => {
      const promedio = resultados.reduce((a, b) => a + b, 0) / resultados.length;
      const maximo = Math.max(...resultados);
      const minimo = Math.min(...resultados);
      
      // Calcular degradación de rendimiento
      const primeras5 = resultados.slice(0, 5);
      const ultimas5 = resultados.slice(-5);
      const promedioPrimeras = primeras5.reduce((a, b) => a + b, 0) / primeras5.length;
      const promedioUltimas = ultimas5.reduce((a, b) => a + b, 0) / ultimas5.length;
      const degradacion = ((promedioUltimas - promedioPrimeras) / promedioPrimeras * 100);
      
      // Calcular desviación estándar
      const desviacion = Math.sqrt(
        resultados.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / resultados.length
      );
      
      cy.log('');
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log('📊 RESULTADOS FINALES - STRESS TEST FORMULARIO');
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log(`🎫 Ticket usado: ${ticketNumber}`);
      cy.log(`📝 Iteraciones completadas: ${iteraciones}`);
      cy.log(`📈 Tiempo promedio: ${promedio.toFixed(2)}ms`);
      cy.log(`⚡ Tiempo más rápido: ${minimo}ms`);
      cy.log(`🐌 Tiempo más lento: ${maximo}ms`);
      cy.log(`📊 Desviación estándar: ${desviacion.toFixed(2)}ms`);
      cy.log('');
      cy.log('📊 Análisis de degradación:');
      cy.log(`  ⏱️  Primeras 5 iteraciones: ${promedioPrimeras.toFixed(2)}ms`);
      cy.log(`  ⏱️  Últimas 5 iteraciones: ${promedioUltimas.toFixed(2)}ms`);
      cy.log(`  📈 Degradación de rendimiento: ${degradacion.toFixed(2)}%`);
      cy.log('');
      
      // Evaluación del rendimiento
      let evaluacion = '';
      if (degradacion < 10) {
        evaluacion = '✅ EXCELENTE - Sin degradación significativa';
      } else if (degradacion < 30) {
        evaluacion = '⚠️ ACEPTABLE - Degradación moderada';
      } else if (degradacion < 50) {
        evaluacion = '⚠️ PRECAUCIÓN - Degradación considerable';
      } else {
        evaluacion = '❌ CRÍTICO - Degradación severa detectada';
      }
      
      cy.log(`🎯 Evaluación: ${evaluacion}`);
      cy.log('═══════════════════════════════════════════════════════════');
      
      // Guardar resultados en archivo JSON
      cy.writeFile('cypress/reports/stress-test-formulario-20-veces.json', {
        prueba: 'Stress Test - Formulario de Factura',
        ticket: ticketNumber,
        fecha: new Date().toISOString(),
        iteraciones: iteraciones,
        resultados: resultados,
        estadisticas: {
          promedio: parseFloat(promedio.toFixed(2)),
          maximo: maximo,
          minimo: minimo,
          desviacionEstandar: parseFloat(desviacion.toFixed(2)),
          promedioPrimeras5: parseFloat(promedioPrimeras.toFixed(2)),
          promedioUltimas5: parseFloat(promedioUltimas.toFixed(2)),
          degradacionPorcentaje: parseFloat(degradacion.toFixed(2)),
          evaluacion: evaluacion
        },
        detalleIteraciones: resultados.map((tiempo, index) => ({
          iteracion: index + 1,
          tiempoMs: tiempo,
          diferenciaDesdePrimera: tiempo - resultados[0]
        }))
      });
      
      cy.log('📄 Reporte guardado: cypress/reports/stress-test-formulario-20-veces.json');
      
      // Validaciones
      cy.log('');
      cy.log('🔍 Validaciones:');
      
      // El promedio no debe ser mayor a 5 segundos
      if (promedio < 5000) {
        cy.log('✅ Promedio dentro del límite aceptable (< 5000ms)');
      } else {
        cy.log('❌ Promedio fuera del límite aceptable');
      }
      expect(promedio).to.be.lessThan(5000);
      
      // La degradación no debe ser mayor al 100%
      if (Math.abs(degradacion) < 100) {
        cy.log('✅ Degradación dentro de límites aceptables (< 100%)');
      } else {
        cy.log('⚠️  Degradación significativa detectada');
      }
      expect(Math.abs(degradacion)).to.be.lessThan(100);
      
      cy.log('');
      cy.log('✨ Stress Test completado exitosamente!');
    });
  });
  
  it('📊 Genera reporte consolidado del stress test', () => {
    // Leer el reporte generado
    cy.readFile('cypress/reports/stress-test-formulario-20-veces.json').then((data) => {
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log('📊 REPORTE CONSOLIDADO');
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log(`Prueba: ${data.prueba}`);
      cy.log(`Ticket: ${data.ticket}`);
      cy.log(`Fecha: ${new Date(data.fecha).toLocaleString('es-MX')}`);
      cy.log(`Iteraciones: ${data.iteraciones}`);
      cy.log(`Promedio: ${data.estadisticas.promedio}ms`);
      cy.log(`Evaluación: ${data.estadisticas.evaluacion}`);
      cy.log('═══════════════════════════════════════════════════════════');
      
      // Generar reporte en Markdown
      const markdown = `# 🔥 Reporte de Stress Test - Formulario de Facturación

## 📋 Información General

- **Prueba:** ${data.prueba}
- **Ticket Usado:** \`${data.ticket}\`
- **Fecha de Ejecución:** ${new Date(data.fecha).toLocaleString('es-MX')}
- **Iteraciones:** ${data.iteraciones}

## 📊 Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| ⏱️ **Tiempo Promedio** | ${data.estadisticas.promedio}ms |
| ⚡ **Tiempo Más Rápido** | ${data.estadisticas.minimo}ms |
| 🐌 **Tiempo Más Lento** | ${data.estadisticas.maximo}ms |
| 📊 **Desviación Estándar** | ${data.estadisticas.desviacionEstandar}ms |

## 📈 Análisis de Degradación

| Período | Promedio |
|---------|----------|
| Primeras 5 iteraciones | ${data.estadisticas.promedioPrimeras5}ms |
| Últimas 5 iteraciones | ${data.estadisticas.promedioUltimas5}ms |
| **Degradación** | **${data.estadisticas.degradacionPorcentaje}%** |

## 🎯 Evaluación

**${data.estadisticas.evaluacion}**

## 📈 Gráfica de Tiempos

\`\`\`
Iteración vs Tiempo de Respuesta
${data.detalleIteraciones.map(d => 
  `Iteración ${String(d.iteracion).padStart(2, '0')}: ${'█'.repeat(Math.floor(d.tiempoMs / 100))} ${d.tiempoMs}ms`
).join('\n')}
\`\`\`

## 📊 Detalle por Iteración

| # | Tiempo (ms) | Diferencia desde la 1ra |
|---|-------------|-------------------------|
${data.detalleIteraciones.map(d => 
  `| ${d.iteracion} | ${d.tiempoMs} | ${d.diferenciaDesdePrimera >= 0 ? '+' : ''}${d.diferenciaDesdePrimera}ms |`
).join('\n')}

## 💡 Recomendaciones

${data.estadisticas.degradacionPorcentaje < 10 ? 
`✅ **Excelente rendimiento**
- La aplicación maneja muy bien la carga repetida
- No se detecta degradación significativa
- Sistema estable y optimizado` :
data.estadisticas.degradacionPorcentaje < 30 ?
`⚠️ **Rendimiento aceptable**
- Se detecta degradación moderada del rendimiento
- Considera implementar liberación de memoria más agresiva
- Monitorear en producción con carga real` :
`❌ **Requiere optimización**
- Degradación significativa detectada
- Posible memory leak o acumulación de recursos
- Revisar gestión de memoria y eventos
- Implementar limpieza de recursos entre operaciones`}

## 🔍 Conclusiones

${data.estadisticas.promedio < 3000 ?
`El formulario de facturación muestra un **rendimiento excelente** con un tiempo promedio de ${data.estadisticas.promedio}ms bajo carga repetida de ${data.iteraciones} iteraciones.` :
`El formulario muestra tiempos de respuesta de ${data.estadisticas.promedio}ms en promedio. Se recomienda optimización para mejorar la experiencia del usuario.`}

---

*Reporte generado automáticamente por Cypress Stress Test - ${new Date().toLocaleDateString('es-MX')}*
`;
      
      cy.writeFile('cypress/reports/STRESS-TEST-FORMULARIO-REPORTE.md', markdown);
      cy.log('📄 Reporte Markdown generado: STRESS-TEST-FORMULARIO-REPORTE.md');
    });
  });
  
});
