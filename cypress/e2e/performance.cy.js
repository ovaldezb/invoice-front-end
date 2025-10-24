describe('Pruebas de Performance', () => {
  
  // Prueba 1: Medir el tiempo de carga de la página principal
  it('Mide el tiempo de carga de la página principal', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('inicio-carga');
      },
      onLoad: (win) => {
        win.performance.mark('fin-carga');
        win.performance.measure('tiempo-carga-total', 'inicio-carga', 'fin-carga');
      }
    });

    cy.window().then((win) => {
      const performance = win.performance;
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      
      // Obtener métricas importantes
      const tiempoTotal = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
      const tiempoDNS = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart;
      const tiempoConexion = navigationTiming.connectEnd - navigationTiming.connectStart;
      const tiempoRespuesta = navigationTiming.responseEnd - navigationTiming.requestStart;
      const tiempoDOMContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;
      
      cy.log('⏱️ Tiempo total de carga: ' + tiempoTotal.toFixed(2) + 'ms');
      cy.log('🌐 Tiempo DNS: ' + tiempoDNS.toFixed(2) + 'ms');
      cy.log('🔌 Tiempo de conexión: ' + tiempoConexion.toFixed(2) + 'ms');
      cy.log('📥 Tiempo de respuesta: ' + tiempoRespuesta.toFixed(2) + 'ms');
      cy.log('📄 Tiempo DOM Content Loaded: ' + tiempoDOMContentLoaded.toFixed(2) + 'ms');
      
      // Validar que el tiempo total sea menor a 3 segundos (ajusta según necesites)
      expect(tiempoTotal).to.be.lessThan(3000);
    });
  });

  // Prueba 2: Medir Core Web Vitals (LCP, FID, CLS)
  it('Mide Core Web Vitals - Largest Contentful Paint (LCP)', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        new win.PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          cy.log('🎨 LCP (Largest Contentful Paint): ' + lastEntry.renderTime.toFixed(2) + 'ms');
          
          // LCP debe ser menor a 2.5 segundos para ser considerado "bueno"
          expect(lastEntry.renderTime).to.be.lessThan(2500);
          resolve();
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout de seguridad
        setTimeout(() => resolve(), 5000);
      });
    });
  });

  // Prueba 3: Medir el tiempo de carga de recursos (CSS, JS, imágenes)
  it('Analiza el tiempo de carga de recursos', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType('resource');
      
      // Agrupar recursos por tipo
      const scripts = resources.filter(r => r.name.includes('.js'));
      const styles = resources.filter(r => r.name.includes('.css'));
      const imagenes = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)/i));
      
      // Calcular tiempos promedio
      const promedioScripts = scripts.reduce((sum, r) => sum + r.duration, 0) / scripts.length;
      const promedioStyles = styles.reduce((sum, r) => sum + r.duration, 0) / styles.length;
      const promedioImagenes = imagenes.length > 0 
        ? imagenes.reduce((sum, r) => sum + r.duration, 0) / imagenes.length 
        : 0;
      
      cy.log('📊 Resumen de recursos:');
      cy.log('  - Scripts JS: ' + scripts.length + ' archivos, promedio: ' + promedioScripts.toFixed(2) + 'ms');
      cy.log('  - Hojas CSS: ' + styles.length + ' archivos, promedio: ' + promedioStyles.toFixed(2) + 'ms');
      cy.log('  - Imágenes: ' + imagenes.length + ' archivos, promedio: ' + promedioImagenes.toFixed(2) + 'ms');
      
      // Encontrar el recurso más lento
      const recursosOrdenados = resources.sort((a, b) => b.duration - a.duration);
      const recursoMasLento = recursosOrdenados[0];
      
      cy.log('🐌 Recurso más lento: ' + recursoMasLento.name);
      cy.log('   Duración: ' + recursoMasLento.duration.toFixed(2) + 'ms');
      
      // Validar que no haya recursos que tarden más de 2 segundos
      expect(recursoMasLento.duration).to.be.lessThan(2000);
    });
  });

  // Prueba 4: Medir el tiempo de respuesta del API
  it('Mide el tiempo de respuesta de llamadas API', () => {
    let tiempoInicio;
    
    cy.intercept('GET', '**/api/**', (req) => {
      tiempoInicio = Date.now();
      req.continue((res) => {
        const tiempoRespuesta = Date.now() - tiempoInicio;
        cy.log('🌐 API Call: ' + req.url);
        cy.log('⏱️ Tiempo de respuesta: ' + tiempoRespuesta + 'ms');
        
        // Validar que las llamadas API sean menores a 1 segundo
        expect(tiempoRespuesta).to.be.lessThan(1000);
      });
    }).as('apiCalls');
    
    cy.visit('/dashboard');
    // Esperar a que se completen las llamadas API (si las hay)
    cy.wait(2000);
  });

  // Prueba 5: Medir el uso de memoria
  it('Monitorea el uso de memoria', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      if (win.performance.memory) {
        const memory = win.performance.memory;
        
        const usedMemoryMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
        const totalMemoryMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
        const limitMemoryMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
        
        cy.log('💾 Uso de memoria:');
        cy.log('  - Memoria usada: ' + usedMemoryMB + ' MB');
        cy.log('  - Memoria total: ' + totalMemoryMB + ' MB');
        cy.log('  - Límite de memoria: ' + limitMemoryMB + ' MB');
        cy.log('  - Porcentaje usado: ' + ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%');
        
        // Validar que no use más del 80% de memoria disponible
        expect(memory.usedJSHeapSize / memory.jsHeapSizeLimit).to.be.lessThan(0.8);
      } else {
        cy.log('⚠️ Performance.memory no está disponible en este navegador');
      }
    });
  });

  // Prueba 6: Medir el rendimiento en navegación entre páginas
  it('Mide el rendimiento al navegar entre páginas', () => {
    const tiempos = [];
    
    cy.visit('/');
    
    // Navegar a diferentes secciones y medir el tiempo
    const rutas = ['/dashboard', '/factura', '/login'];
    
    rutas.forEach((ruta, index) => {
      const inicio = Date.now();
      
      cy.visit(ruta).then(() => {
        const tiempoNavegacion = Date.now() - inicio;
        tiempos.push(tiempoNavegacion);
        cy.log('🧭 Navegación a ' + ruta + ': ' + tiempoNavegacion + 'ms');
      });
    });
    
    cy.then(() => {
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      cy.log('📊 Tiempo promedio de navegación: ' + promedio.toFixed(2) + 'ms');
      
      // Validar que el promedio sea menor a 500ms
      expect(promedio).to.be.lessThan(500);
    });
  });

  // Prueba 7: Lighthouse Performance Score (requiere plugin)
  it('Verifica métricas de rendimiento generales', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      const timing = win.performance.timing;
      
      // First Paint y First Contentful Paint
      const paintEntries = win.performance.getEntriesByType('paint');
      
      paintEntries.forEach((entry) => {
        cy.log('🎨 ' + entry.name + ': ' + entry.startTime.toFixed(2) + 'ms');
        
        // First Contentful Paint debe ser menor a 1.8 segundos
        if (entry.name === 'first-contentful-paint') {
          expect(entry.startTime).to.be.lessThan(1800);
        }
      });
      
      // Time to Interactive (aproximado)
      const tti = timing.domInteractive - timing.navigationStart;
      cy.log('⚡ Time to Interactive (aproximado): ' + tti.toFixed(2) + 'ms');
      expect(tti).to.be.lessThan(3000);
    });
  });

  // Prueba 8: Medir el rendimiento de formularios (genera-factura)
  it('Mide el rendimiento del formulario de facturación', () => {
    cy.visit('/factura');
    
    // Medir tiempo de escritura y respuesta
    const inicio = Date.now();
    
    cy.get('input#ticketNumber').type('MKTLV4243-1382723', { delay: 0 });
    cy.get('button').contains('Consultar Venta').click();
    
    // Esperar la respuesta
    cy.contains('Sistema de Facturación', { timeout: 10000 }).should('be.visible').then(() => {
      const tiempoTotal = Date.now() - inicio;
      cy.log('📝 Tiempo de carga del formulario: ' + tiempoTotal + 'ms');
      
      // Validar que la carga sea menor a 3 segundos
      expect(tiempoTotal).to.be.lessThan(3000);
    });
  });

  // Prueba 9: Detectar memory leaks navegando múltiples veces
  it('Detecta posibles memory leaks', () => {
    const mediciones = [];
    
    // Repetir navegación 5 veces
    for (let i = 0; i < 5; i++) {
      cy.visit('/dashboard').then(() => {
        cy.window().then((win) => {
          if (win.performance.memory) {
            const usedMemory = win.performance.memory.usedJSHeapSize / 1048576;
            mediciones.push(usedMemory);
            cy.log('Iteración ' + (i + 1) + ': ' + usedMemory.toFixed(2) + ' MB');
          }
        });
      });
      
      cy.wait(500);
    }
    
    cy.then(() => {
      if (mediciones.length > 0) {
        const primera = mediciones[0];
        const ultima = mediciones[mediciones.length - 1];
        const incremento = ((ultima - primera) / primera) * 100;
        
        cy.log('📈 Incremento de memoria: ' + incremento.toFixed(2) + '%');
        
        // Validar que el incremento no sea mayor al 50%
        expect(incremento).to.be.lessThan(50);
      }
    });
  });

});
