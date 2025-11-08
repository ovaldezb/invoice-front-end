# Dashboard Administrativo - Documentación

## 📊 Visión General

El Dashboard Administrativo es una vista centralizada que muestra métricas en tiempo real de tu sistema de facturación, utilizando **datos reales** obtenidos de los endpoints existentes.

## 🎯 Características Principales

### 1. **Tarjetas de Métricas (Stats Cards)**

#### 📄 Facturas Hoy
- **Descripción**: Total de facturas emitidas el día de hoy
- **Endpoint**: `TimbresService.getFacturasEmitidasByMes()`
- **Cálculo**: Filtra facturas con `fechaTimbrado` igual a la fecha actual

#### 📅 Facturas Últimos 7 Días
- **Descripción**: Total de facturas en la última semana
- **Endpoint**: `TimbresService.getFacturasEmitidasByMes()`
- **Cálculo**: Filtra facturas entre hoy y hace 7 días

#### 📈 Facturas del Mes
- **Descripción**: Total de facturas del mes actual
- **Endpoint**: `TimbresService.getFacturasEmitidasByMes(usuario, inicioMes, finMes)`
- **Cálculo**: Suma todas las facturas del mes actual

#### 🔒 Certificados Activos
- **Descripción**: Muestra certificados válidos vs total
- **Endpoint**: `CertificadosService.getAllCertificados(usuario)`
- **Cálculo**: Compara `cert.hasta` con fecha actual

#### ⚠️ Certificados por Vencer
- **Descripción**: Certificados que vencen en los próximos 30 días
- **Endpoint**: `CertificadosService.getAllCertificados(usuario)`
- **Cálculo**: `cert.hasta` está entre hoy y 30 días adelante
- **Alerta Visual**: Animación de pulso cuando hay certificados por vencer

### 2. **Gráficos Interactivos**

#### 📊 Gráfico de Barras - Últimos 7 Días
- **Tipo**: Gráfico de barras vertical animado
- **Datos**: Facturas emitidas por día (últimos 7 días)
- **Formato**: DD/MM
- **Interacción**: Tooltip muestra cantidad exacta al pasar el mouse
- **Animación**: Transición suave de 500ms

#### 🏆 Top 5 Certificados Más Usados
- **Tipo**: Lista ranking con badges
- **Datos**: Top 5 certificados con más facturas del mes
- **Destacados**: 
  - 🥇 1er lugar: Fondo dorado
  - 🥈 2do lugar: Fondo plata
  - 🥉 3er lugar: Fondo bronce
- **Información**: Nombre, RFC y cantidad de facturas

### 3. **Sistema de Alertas**

#### ⚠️ Alerta de Certificados por Vencer
- **Trigger**: Se muestra cuando `certificadosPorVencer > 0`
- **Diseño**: Banner naranja/rojo con ícono de advertencia
- **Mensaje**: "Tienes X certificado(s) que vencerá(n) en los próximos 30 días"
- **Acción**: Botón "Ver Certificados" (próxima implementación)

## 🔄 Flujo de Datos

```
Usuario accede al Dashboard (tab0)
    ↓
ngOnInit() - Obtiene idUsuarioCognito
    ↓
cargarDatosAdmin() - Ejecuta en paralelo:
    ├─→ cargarFacturasDelMes()
    │    ├─→ TimbresService.getFacturasEmitidasByMes()
    │    └─→ calcularEstadisticasFacturas()
    │         ├─→ totalFacturasHoy
    │         ├─→ totalFacturasSemana
    │         ├─→ totalFacturasMes
    │         ├─→ facturasUltimos7Dias[]
    │         └─→ certificadosMasUsados[]
    │
    └─→ cargarCertificados()
         ├─→ CertificadosService.getAllCertificados()
         └─→ Analiza estado de certificados
              ├─→ totalCertificados
              ├─→ certificadosActivos
              └─→ certificadosPorVencer
    ↓
isLoading = false
    ↓
Renderiza dashboard con datos reales
```

## 📡 Endpoints Utilizados

### TimbresService
```typescript
getFacturasEmitidasByMes(usuario: string, desde: string, hasta: string)
```
- **Método**: GET
- **URL**: `${this.URL}/timbres/getFacturasByMes/${usuario}/${desde}/${hasta}`
- **Response**: Array de certificados con sus facturas emitidas

### CertificadosService
```typescript
getAllCertificados(usuario: string)
```
- **Método**: GET
- **URL**: `${this.URL}/certificados/${usuario}`
- **Response**: Array de certificados con fecha de vigencia

## 🎨 Diseño Responsivo

### Desktop (lg: ≥1024px)
- Grid de 5 columnas para stats cards
- Grid de 2 columnas para gráficos
- Navegación horizontal de tabs

### Tablet (md: ≥768px)
- Grid de 2 columnas para stats cards
- Grid de 1 columna para gráficos

### Mobile (< 768px)
- Grid de 1 columna para todo
- Stack vertical de tabs
- Botón "Refrescar" de ancho completo

## 🔧 Componentes

### Archivos Creados
```
src/app/components/dashboard-admin/
├── dashboard-admin.component.ts       # Lógica y cálculos
├── dashboard-admin.component.html     # Template con stats y gráficos
└── dashboard-admin.component.css      # Estilos con Tailwind + custom
```

### Modificaciones
```
src/app/components/dashboard/
├── dashboard.component.ts             # Importa DashboardAdminComponent
└── dashboard.component.html           # Agrega tab0 (📊 Dashboard)
```

## 📊 Modelos de Datos

### DashboardStats Interface
```typescript
interface DashboardStats {
  // Timbres y Facturación
  totalFacturasHoy: number;
  totalFacturasSemana: number;
  totalFacturasMes: number;
  
  // Certificados
  totalCertificados: number;
  certificadosActivos: number;
  certificadosPorVencer: number;
  
  // Tendencias
  facturasUltimos7Dias: { fecha: string; cantidad: number; }[];
  certificadosMasUsados: { nombre: string; rfc: string; facturas: number; }[];
}
```

## 🚀 Características Técnicas

### Performance
- **Carga Paralela**: Usa `Promise.all()` para ejecutar llamadas simultáneas
- **Caché**: Los datos se cargan una vez al inicializar
- **Animaciones CSS**: Usa GPU acceleration con `transform` y `opacity`

### Estado de Carga
- Spinner animado durante `isLoading = true`
- Mensaje "Cargando datos..."
- Botón "Refrescar" deshabilitado durante carga

### Manejo de Errores
- Try/catch en cada método de carga
- Console.error para debugging
- Estado vacío manejado con mensajes "No hay datos disponibles"

## 🎯 Casos de Uso

### Caso 1: Monitoreo Diario
**Objetivo**: Ver actividad de hoy
1. Admin entra al dashboard (por defecto se muestra tab0)
2. Ve inmediatamente "Facturas Hoy"
3. Identifica si hay actividad normal

### Caso 2: Análisis de Tendencias
**Objetivo**: Identificar patrones semanales
1. Admin revisa gráfico "Últimos 7 Días"
2. Identifica días con más/menos actividad
3. Puede planificar recursos

### Caso 3: Gestión Proactiva de Certificados
**Objetivo**: Evitar interrupción del servicio
1. Admin ve alerta naranja de certificados por vencer
2. Revisa cuántos certificados están en riesgo
3. Puede contactar clientes antes del vencimiento

### Caso 4: Identificar Clientes Activos
**Objetivo**: Priorizar soporte
1. Admin revisa "Top 5 Certificados Más Usados"
2. Identifica clientes con más actividad
3. Ofrece soporte proactivo a clientes principales

## 🔮 Próximas Mejoras

### Funcionalidades Sugeridas
1. **Exportar Reportes**: Botón para descargar PDF con métricas
2. **Filtros de Fecha**: Selector de rango personalizado
3. **Comparación Periodos**: Mes actual vs mes anterior
4. **Alertas Email**: Notificaciones automáticas de certificados por vencer
5. **Drill-Down**: Click en métricas para ver detalle
6. **Gráfico de Línea**: Tendencia de facturas por mes (últimos 6 meses)

### Endpoints Adicionales a Implementar
```typescript
// Obtener timbres disponibles
TimbresService.getTimbresDisponibles(usuario: string)

// Obtener facturas por estado (timbrada, cancelada, etc.)
FacturacionService.getFacturasPorEstado(usuario: string, estado: string)

// Obtener resumen financiero
FacturacionService.getResumenFinanciero(usuario: string, mes: string)
```

## 📝 Notas para Desarrolladores

### Testing
```bash
# Verificar que los endpoints respondan correctamente
# 1. Login con Cognito
# 2. Navegar a Dashboard
# 3. Verificar que tab0 se muestra por defecto
# 4. Comprobar que las stats cards se llenan con datos reales
# 5. Validar que los gráficos se renderizan correctamente
```

### Debugging
```typescript
// Activar console.log en métodos de carga para ver responses
console.log('Facturas del mes:', response?.body);
console.log('Certificados:', this.certificados);
console.log('Stats calculadas:', this.stats);
```

### Customización de Colores
Los gradientes de las stats cards se pueden personalizar en el HTML:
```html
<!-- Ejemplo: Cambiar color de "Facturas Hoy" -->
<div class="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
  <!-- Cambiar blue por: green, purple, indigo, pink, etc. -->
</div>
```

## ✅ Checklist de Implementación

- [x] Crear DashboardAdminComponent
- [x] Integrar TimbresService.getFacturasEmitidasByMes()
- [x] Integrar CertificadosService.getAllCertificados()
- [x] Calcular estadísticas de facturas
- [x] Analizar estado de certificados
- [x] Crear gráfico de barras (últimos 7 días)
- [x] Crear ranking de certificados más usados
- [x] Implementar sistema de alertas (certificados por vencer)
- [x] Agregar tab0 "📊 Dashboard" en navegación principal
- [x] Configurar tab0 como vista por defecto
- [x] Diseño responsivo (mobile, tablet, desktop)
- [x] Loading state con spinner
- [x] Botón "Refrescar" funcional
- [x] Animaciones CSS para mejora UX
- [ ] Implementar navegación "Ver Certificados" (pendiente)
- [ ] Agregar tests unitarios
- [ ] Agregar documentación API para backend

## 🎓 Conclusión

El Dashboard Administrativo proporciona una vista centralizada con **datos reales** que permite:

✅ **Monitoreo en Tiempo Real**: Ver actividad de facturación actual  
✅ **Análisis de Tendencias**: Identificar patrones de uso  
✅ **Gestión Proactiva**: Anticipar problemas (certificados por vencer)  
✅ **Toma de Decisiones**: Datos objetivos para planificación  
✅ **Mejora Continua**: Base para agregar más métricas  

**No usa datos mock**, todo viene de endpoints reales que consultan tu backend AWS Lambda + MongoDB.
