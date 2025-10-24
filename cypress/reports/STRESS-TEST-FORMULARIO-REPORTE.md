# 🔥 Reporte de Stress Test - Formulario de Facturación

## 📋 Información General

- **Prueba:** Stress Test - Formulario de Factura
- **Ticket Usado:** `TNPI3112-982895`
- **Fecha de Ejecución:** 24/10/2025, 2:14:29 p.m.
- **Iteraciones:** 20

## 📊 Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| ⏱️ **Tiempo Promedio** | 2.4ms |
| ⚡ **Tiempo Más Rápido** | 1ms |
| 🐌 **Tiempo Más Lento** | 4ms |
| 📊 **Desviación Estándar** | 0.73ms |

## 📈 Análisis de Degradación

| Período | Promedio |
|---------|----------|
| Primeras 5 iteraciones | 2.2ms |
| Últimas 5 iteraciones | 2.6ms |
| **Degradación** | **18.18%** |

## 🎯 Evaluación

**⚠️ ACEPTABLE - Degradación moderada**

## 📈 Gráfica de Tiempos

```
Iteración vs Tiempo de Respuesta
Iteración 01:  2ms
Iteración 02:  2ms
Iteración 03:  2ms
Iteración 04:  3ms
Iteración 05:  2ms
Iteración 06:  3ms
Iteración 07:  2ms
Iteración 08:  4ms
Iteración 09:  3ms
Iteración 10:  1ms
Iteración 11:  1ms
Iteración 12:  2ms
Iteración 13:  2ms
Iteración 14:  3ms
Iteración 15:  3ms
Iteración 16:  3ms
Iteración 17:  3ms
Iteración 18:  2ms
Iteración 19:  3ms
Iteración 20:  2ms
```

## 📊 Detalle por Iteración

| # | Tiempo (ms) | Diferencia desde la 1ra |
|---|-------------|-------------------------|
| 1 | 2 | +0ms |
| 2 | 2 | +0ms |
| 3 | 2 | +0ms |
| 4 | 3 | +1ms |
| 5 | 2 | +0ms |
| 6 | 3 | +1ms |
| 7 | 2 | +0ms |
| 8 | 4 | +2ms |
| 9 | 3 | +1ms |
| 10 | 1 | -1ms |
| 11 | 1 | -1ms |
| 12 | 2 | +0ms |
| 13 | 2 | +0ms |
| 14 | 3 | +1ms |
| 15 | 3 | +1ms |
| 16 | 3 | +1ms |
| 17 | 3 | +1ms |
| 18 | 2 | +0ms |
| 19 | 3 | +1ms |
| 20 | 2 | +0ms |

## 💡 Recomendaciones

⚠️ **Rendimiento aceptable**
- Se detecta degradación moderada del rendimiento
- Considera implementar liberación de memoria más agresiva
- Monitorear en producción con carga real

## 🔍 Conclusiones

El formulario de facturación muestra un **rendimiento excelente** con un tiempo promedio de 2.4ms bajo carga repetida de 20 iteraciones.

---

*Reporte generado automáticamente por Cypress Stress Test - 24/10/2025*
