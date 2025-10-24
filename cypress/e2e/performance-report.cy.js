describe('Performance Report - Dashboard Detallado', () => {
  
  it('Genera reporte completo de performance', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      const performance = win.performance;
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      const paintEntries = performance.getEntriesByType('paint');
      
      // Crear objeto con todas las métricas
      const metricas = {
        timestamp: new Date().toISOString(),
        url: win.location.href,
        navegacion: {
          tiempoTotal: (navigation.loadEventEnd - navigation.fetchStart).toFixed(2) + 'ms',
          DNS: (navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2) + 'ms',
          conexion: (navigation.connectEnd - navigation.connectStart).toFixed(2) + 'ms',
          respuesta: (navigation.responseEnd - navigation.requestStart).toFixed(2) + 'ms',
          domContentLoaded: (navigation.domContentLoadedEventEnd - navigation.fetchStart).toFixed(2) + 'ms',
          domComplete: (navigation.domComplete - navigation.fetchStart).toFixed(2) + 'ms'
        },
        recursos: {
          total: resources.length,
          scripts: resources.filter(r => r.name.includes('.js')).length,
          estilos: resources.filter(r => r.name.includes('.css')).length,
          imagenes: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)/i)).length,
          masLento: resources.sort((a, b) => b.duration - a.duration)[0]?.name || 'N/A'
        },
        paint: {},
        memoria: null
      };
      
      // Agregar paint entries
      paintEntries.forEach(entry => {
        metricas.paint[entry.name] = entry.startTime.toFixed(2) + 'ms';
      });
      
      // Agregar memoria si está disponible
      if (performance.memory) {
        metricas.memoria = {
          usada: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
          limite: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
          porcentaje: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
        };
      }
      
      // Imprimir reporte en formato tabla
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log('📊 REPORTE DE PERFORMANCE');
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log('🌐 URL: ' + metricas.url);
      cy.log('⏰ Fecha: ' + metricas.timestamp);
      cy.log('');
      cy.log('🚀 MÉTRICAS DE NAVEGACIÓN:');
      cy.log('  ⏱️  Tiempo Total: ' + metricas.navegacion.tiempoTotal);
      cy.log('  🌐 DNS: ' + metricas.navegacion.DNS);
      cy.log('  🔌 Conexión: ' + metricas.navegacion.conexion);
      cy.log('  📥 Respuesta: ' + metricas.navegacion.respuesta);
      cy.log('  📄 DOM Content Loaded: ' + metricas.navegacion.domContentLoaded);
      cy.log('  ✅ DOM Complete: ' + metricas.navegacion.domComplete);
      cy.log('');
      cy.log('📦 RECURSOS CARGADOS:');
      cy.log('  📊 Total de recursos: ' + metricas.recursos.total);
      cy.log('  📜 Scripts JS: ' + metricas.recursos.scripts);
      cy.log('  🎨 Hojas CSS: ' + metricas.recursos.estilos);
      cy.log('  🖼️  Imágenes: ' + metricas.recursos.imagenes);
      cy.log('  🐌 Recurso más lento: ' + metricas.recursos.masLento);
      cy.log('');
      cy.log('🎨 PAINT TIMING:');
      Object.keys(metricas.paint).forEach(key => {
        cy.log('  ' + key + ': ' + metricas.paint[key]);
      });
      
      if (metricas.memoria) {
        cy.log('');
        cy.log('💾 USO DE MEMORIA:');
        cy.log('  📊 Memoria usada: ' + metricas.memoria.usada);
        cy.log('  📦 Memoria total: ' + metricas.memoria.total);
        cy.log('  🎯 Límite: ' + metricas.memoria.limite);
        cy.log('  📈 Porcentaje usado: ' + metricas.memoria.porcentaje);
      }
      
      cy.log('═══════════════════════════════════════════════════════════');
      
      // Escribir el reporte a un archivo
      cy.writeFile('cypress/reports/performance-report.json', metricas);
      
      // Crear evaluación de performance
      const evaluacion = {
        tiempoTotalMs: parseFloat(metricas.navegacion.tiempoTotal),
        calificacion: null,
        recomendaciones: []
      };
      
      if (evaluacion.tiempoTotalMs < 1000) {
        evaluacion.calificacion = '🌟 EXCELENTE';
        evaluacion.recomendaciones.push('Tu aplicación tiene un rendimiento excepcional');
      } else if (evaluacion.tiempoTotalMs < 2000) {
        evaluacion.calificacion = '✅ BUENO';
        evaluacion.recomendaciones.push('Buen rendimiento, pero hay margen de mejora');
      } else if (evaluacion.tiempoTotalMs < 3000) {
        evaluacion.calificacion = '⚠️ ACEPTABLE';
        evaluacion.recomendaciones.push('Considera optimizar recursos');
        evaluacion.recomendaciones.push('Revisa el tamaño de archivos JS y CSS');
      } else {
        evaluacion.calificacion = '❌ NECESITA MEJORAS';
        evaluacion.recomendaciones.push('Implementa lazy loading');
        evaluacion.recomendaciones.push('Optimiza imágenes');
        evaluacion.recomendaciones.push('Reduce el tamaño de bundles');
        evaluacion.recomendaciones.push('Considera usar CDN');
      }
      
      cy.log('');
      cy.log('📋 EVALUACIÓN: ' + evaluacion.calificacion);
      cy.log('💡 RECOMENDACIONES:');
      evaluacion.recomendaciones.forEach(rec => {
        cy.log('  • ' + rec);
      });
      
      cy.writeFile('cypress/reports/performance-evaluation.json', evaluacion);
    });
  });

  // Benchmark comparativo
  it('Benchmark: Compara performance con estándares de la industria', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0];
      const paintEntries = win.performance.getEntriesByType('paint');
      
      const metricas = {
        FCP: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        LCP: null, // Se obtiene con PerformanceObserver
        TTI: navigation.domInteractive - navigation.navigationStart,
        TotalLoad: navigation.loadEventEnd - navigation.fetchStart
      };
      
      // Estándares de la industria (según Google)
      const estandares = {
        FCP: { bueno: 1800, aceptable: 3000 },
        TTI: { bueno: 3800, aceptable: 7300 },
        TotalLoad: { bueno: 2000, aceptable: 3000 }
      };
      
      const comparacion = {
        FCP: metricas.FCP < estandares.FCP.bueno ? '✅ BUENO' : 
             metricas.FCP < estandares.FCP.aceptable ? '⚠️ ACEPTABLE' : '❌ NECESITA MEJORAS',
        TTI: metricas.TTI < estandares.TTI.bueno ? '✅ BUENO' : 
             metricas.TTI < estandares.TTI.aceptable ? '⚠️ ACEPTABLE' : '❌ NECESITA MEJORAS',
        TotalLoad: metricas.TotalLoad < estandares.TotalLoad.bueno ? '✅ BUENO' : 
                   metricas.TotalLoad < estandares.TotalLoad.aceptable ? '⚠️ ACEPTABLE' : '❌ NECESITA MEJORAS'
      };
      
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log('📊 BENCHMARK vs ESTÁNDARES DE LA INDUSTRIA');
      cy.log('═══════════════════════════════════════════════════════════');
      cy.log('🎨 First Contentful Paint (FCP):');
      cy.log('  Tu app: ' + metricas.FCP.toFixed(2) + 'ms');
      cy.log('  Estándar bueno: <' + estandares.FCP.bueno + 'ms');
      cy.log('  Resultado: ' + comparacion.FCP);
      cy.log('');
      cy.log('⚡ Time to Interactive (TTI):');
      cy.log('  Tu app: ' + metricas.TTI.toFixed(2) + 'ms');
      cy.log('  Estándar bueno: <' + estandares.TTI.bueno + 'ms');
      cy.log('  Resultado: ' + comparacion.TTI);
      cy.log('');
      cy.log('🚀 Total Load Time:');
      cy.log('  Tu app: ' + metricas.TotalLoad.toFixed(2) + 'ms');
      cy.log('  Estándar bueno: <' + estandares.TotalLoad.bueno + 'ms');
      cy.log('  Resultado: ' + comparacion.TotalLoad);
      cy.log('═══════════════════════════════════════════════════════════');
      
      cy.writeFile('cypress/reports/benchmark.json', {
        metricas,
        estandares,
        comparacion
      });
    });
  });

});
