# 🚀 Sistema de Gestión de Errores de Facturación

## 📌 Descripción

Este sistema permite al **administrador** visualizar, gestionar y dar seguimiento a los errores que ocurren durante el proceso de facturación. El objetivo es ser **proactivo** con clientes y el departamento contable, evitando pérdida de ventas y mejorando la experiencia del usuario.

---

## 🎯 Funcionalidades Implementadas

### 📊 Para el Administrador

1. **Dashboard de Errores** con:
   - Lista completa de errores con filtros avanzados
   - Estadísticas en tiempo real
   - Badge de alertas en pestaña del dashboard
   
2. **Información detallada de cada error:**
   - ✅ RFC y nombre del cliente
   - ✅ Email de contacto
   - ✅ Ticket relacionado
   - ✅ Tipo de error (CFDI, certificado, timbres, etc.)
   - ✅ Mensaje de error técnico
   - ✅ **Número de intentos** (para ver clientes recurrentes)
   - ✅ Fecha y hora
   - ✅ Sucursal afectada

3. **Acciones disponibles:**
   - 👁️ Ver detalle completo del error
   - 📝 Agregar notas internas
   - ✉️ Contactar cliente por email (pre-llenado)
   - 🔄 Cambiar estado (pendiente → en revisión → contactado → resuelto)
   - 🗑️ Eliminar error
   - 📥 Exportar a CSV

4. **Filtros y búsqueda:**
   - Por tipo de error
   - Por estado
   - Por RFC
   - Por número de ticket
   - Por rango de fechas
   - Por sucursal

5. **Vista de Estadísticas:**
   - Total de errores
   - Errores por estado
   - Errores por tipo (con gráficos de barras)
   - Clientes más afectados (top 10)
   - Tendencia de errores por día

---

## 📁 Archivos Creados

```
src/app/
├── models/
│   └── errorFacturacion.ts              # Modelo TypeScript con tipos
├── services/
│   └── error-tracking.service.ts        # Servicio con datos simulados
├── components/
│   └── admin-errores/
│       ├── admin-errores.component.ts   # Lógica del componente
│       ├── admin-errores.component.html # Template
│       └── admin-errores.component.css  # Estilos

BACKEND_API_SPEC_ERRORES.md              # Especificación para backend
README_SISTEMA_ERRORES.md                # Este archivo
```

---

## 🔧 Integración

### 1. Dashboard actualizado

Se agregó una **tercera pestaña** en el dashboard:

```
┌─────────────────────────────────────────────────┐
│  Ver Facturas  │  Configurar CSD  │  Gestión de Errores [5] │
└─────────────────────────────────────────────────┘
```

El badge `[5]` muestra errores pendientes en tiempo real.

### 2. Registro automático de errores

El componente `genera-factura` ahora **registra automáticamente** cada error que ocurre:

```typescript
error: (error) => {
  // 🆕 Se registra el error en el sistema de tracking
  this.registrarError(error);
  
  // Se muestra el mensaje al usuario
  Swal.fire({ ... });
}
```

---

## 🎨 Estilos y UX

- **Diseño moderno** con Tailwind CSS
- **Colores semánticos:**
  - 🟡 Amarillo: Pendiente
  - 🔵 Azul: En revisión
  - 🟣 Morado: Contactado
  - 🟢 Verde: Resuelto
  
- **Badges de prioridad:**
  - Errores con ≥3 intentos se muestran en rojo
  
- **Responsive:** Funciona en desktop, tablet y móvil

---

## 💾 Base de Datos (Backend)

### Collection MongoDB: `errores_facturacion`

Ver archivo **`BACKEND_API_SPEC_ERRORES.md`** para especificación completa.

**Campos principales:**
- `ticketNumber`: Número de ticket relacionado
- `rfcReceptor`: RFC del cliente
- `nombreReceptor`: Nombre del cliente
- `emailReceptor`: Email para contacto
- `tipoError`: Tipo clasificado (CFDI40147, TIMEOUT, etc.)
- `mensajeError`: Mensaje descriptivo
- `intentos`: Contador de intentos (⚠️ importante)
- `estado`: pendiente | en_revision | contactado | resuelto
- `notasAdmin`: Notas internas del administrador
- `detalleError`: JSON completo del error técnico

---

## 🔌 APIs Requeridas (Backend)

El servicio `error-tracking.service.ts` actualmente **simula** las respuestas del backend. 

**Endpoints necesarios:**

1. `POST /errores-facturacion` - Crear error
2. `GET /errores-facturacion` - Listar errores (con filtros)
3. `GET /errores-facturacion/:id` - Detalle de error
4. `PUT /errores-facturacion/:id` - Actualizar error
5. `GET /errores-facturacion/estadisticas` - Estadísticas
6. `DELETE /errores-facturacion/:id` - Eliminar error

**Para activar las APIs reales:**

En `src/app/services/error-tracking.service.ts`, descomentar las líneas marcadas con:
```typescript
// TODO: Descomentar cuando el backend esté listo
// return this.http.post(this.baseUrl, error, { observe: 'response' });
```

Y comentar/eliminar el código de simulación.

---

## 📊 Casos de Uso

### Caso 1: Cliente con múltiples intentos fallidos

**Problema:** Un cliente intenta facturar 5 veces con el mismo error de CP inválido.

**Solución:**
1. Admin ve en la tabla que hay un error con `intentos: 5`
2. El sistema lo marca con badge rojo (alta prioridad)
3. Admin hace clic en "Contactar cliente"
4. Se abre email pre-llenado con el problema
5. Admin marca como "contactado"

### Caso 2: Certificado vencido

**Problema:** Certificado CSD vence y todas las facturas fallan.

**Solución:**
1. Dashboard muestra alerta con múltiples errores tipo `CERTIFICADO_VENCIDO`
2. Admin ve en estadísticas que es el error más común del día
3. Admin agrega nota: "Renovar certificado urgente"
4. Marca como "en_revision"
5. Cuando se renueva, marca como "resuelto"

### Caso 3: Análisis de tendencias

**Problema:** Muchos errores de tipo CFDI40147 últimamente.

**Solución:**
1. Admin entra a vista "Estadísticas"
2. Ve que CFDI40147 es el error más frecuente
3. Identifica que proviene de una sucursal específica
4. Capacita al personal de esa sucursal
5. Monitorea disminución de errores

---

## 🧪 Datos de Prueba (Simulados)

El servicio incluye 7 errores simulados para testing:

1. **Código postal inválido** (3 intentos, pendiente)
2. **RFC inválido** (1 intento, pendiente)
3. **Certificado vencido** (5 intentos, en revisión)
4. **Sin timbres** (2 intentos, contactado)
5. **Timeout SAT** (1 intento, pendiente)
6. **Uso CFDI inválido** (2 intentos, pendiente)
7. **Error de validación** (1 intento, resuelto)

---

## 🚀 Cómo Usar

### Para el Desarrollador Frontend

1. El sistema ya está integrado
2. Solo prueba con datos simulados
3. Cuando el backend esté listo, descomentar las APIs

### Para el Desarrollador Backend

1. Lee `BACKEND_API_SPEC_ERRORES.md`
2. Implementa los 6 endpoints
3. Configura MongoDB con índices recomendados
4. Prueba con Postman/Thunder Client
5. Notifica al equipo frontend

### Para el Administrador (Usuario Final)

1. Inicia sesión en la aplicación
2. Ve al Dashboard
3. Haz clic en pestaña "Gestión de Errores"
4. Revisa errores pendientes (badge rojo)
5. Usa filtros para buscar específicos
6. Contacta clientes según prioridad
7. Marca como resuelto cuando se solucione

---

## 📈 Métricas de Éxito

Con este sistema, el administrador puede:

- ✅ Reducir tiempo de respuesta a clientes afectados
- ✅ Identificar problemas recurrentes proactivamente
- ✅ Evitar pérdida de ventas por errores no atendidos
- ✅ Generar reportes de errores para capacitación
- ✅ Mejorar la experiencia del cliente

---

## 🔮 Futuras Mejoras (Opcionales)

1. **Notificaciones automáticas:**
   - Email al admin cuando hay >5 errores pendientes
   - Push notifications en tiempo real

2. **Inteligencia artificial:**
   - Sugerencias automáticas de solución
   - Predicción de errores futuros

3. **Integración con CRM:**
   - Crear tickets automáticos
   - Sincronizar con Zendesk/Freshdesk

4. **Reportes programados:**
   - Email semanal con resumen
   - PDF descargable

5. **Webhooks:**
   - Notificar a Slack cuando hay error crítico
   - Integrar con Microsoft Teams

---

## 👥 Roles y Permisos

| Rol | Puede ver | Puede editar | Puede eliminar |
|-----|-----------|--------------|----------------|
| Admin | ✅ Todos | ✅ Sí | ✅ Sí |
| Usuario normal | ❌ No | ❌ No | ❌ No |

---

## 🐛 Troubleshooting

### El badge no muestra errores
- Verifica que el servicio `ErrorTrackingService` esté cargando datos
- Revisa la consola del navegador por errores

### Los filtros no funcionan
- Asegúrate de hacer clic en "Aplicar Filtros"
- Los datos simulados son fijos, no cambian

### No puedo contactar cliente
- Verifica que tengas un cliente de email configurado
- El botón abre `mailto:` con el email del cliente

---

## 📞 Soporte

Para dudas o problemas, contacta al equipo de desarrollo.

**Archivos clave:**
- Servicio: `src/app/services/error-tracking.service.ts`
- Componente: `src/app/components/admin-errores/`
- API Spec: `BACKEND_API_SPEC_ERRORES.md`

---

## ✅ Checklist de Implementación

- [x] Modelo de datos TypeScript
- [x] Servicio con datos simulados
- [x] Componente admin completo
- [x] Integración en dashboard
- [x] Registro automático de errores
- [x] Estilos CSS responsive
- [x] Documentación API backend
- [ ] Backend Lambda implementado ⏳
- [ ] Base de datos MongoDB configurada ⏳
- [ ] Testing end-to-end ⏳

---

**Versión:** 1.0.0  
**Fecha:** 8 de Noviembre, 2025  
**Estado:** ✅ Frontend completo | ⏳ Backend pendiente
