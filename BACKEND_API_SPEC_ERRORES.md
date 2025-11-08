# 📋 Especificación de API para Sistema de Tracking de Errores de Facturación

## 🎯 Objetivo
Implementar endpoints en AWS Lambda + MongoDB para gestionar el tracking de errores de facturación, permitiendo al administrador ser proactivo con clientes y el departamento contable.

---

## 📊 Modelo de Datos MongoDB

### Collection: `errores_facturacion`

```javascript
{
  _id: ObjectId,
  fecha: ISODate,
  ticketNumber: String,
  rfcReceptor: String,
  nombreReceptor: String,
  emailReceptor: String,
  tipoError: String, // Enum: ver tipos abajo
  codigoError: String,
  mensajeError: String,
  detalleError: Object, // JSON con toda la respuesta del error
  sucursal: String,
  intentos: Number, // Contador de intentos
  estado: String, // Enum: 'pendiente', 'en_revision', 'contactado', 'resuelto'
  notasAdmin: String, // Opcional
  resueltoEn: ISODate, // Opcional
  resueltoBy: String, // Opcional - email del admin
  idUsuarioCognito: String, // Opcional
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Tipos de Error (Enum)
```javascript
[
  'CFDI40147',           // Código postal inválido
  'CFDI40116',           // RFC inválido
  'CFDI40124',           // Uso CFDI no válido para régimen fiscal
  'TIMEOUT',             // Timeout al conectar con SAT
  'CERTIFICADO_VENCIDO', // Certificado CSD vencido
  'CERTIFICADO_INVALIDO',// Certificado CSD inválido
  'SIN_TIMBRES',         // Sin timbres disponibles
  'ERROR_RED',           // Error de conexión de red
  'ERROR_VALIDACION',    // Error de validación de datos
  'ERROR_SAT',           // Error general del SAT
  'ERROR_SERVIDOR',      // Error interno del servidor
  'OTRO'                 // Otros errores no clasificados
]
```

---

## 🔌 Endpoints Requeridos

### 1. **POST** `/errores-facturacion`
Registra un nuevo error de facturación.

**Request Body:**
```json
{
  "fecha": "2025-11-08T10:30:00.000Z",
  "ticketNumber": "MKTLV4243-1382723",
  "rfcReceptor": "XAXX010101000",
  "nombreReceptor": "PUBLICO EN GENERAL",
  "emailReceptor": "cliente@example.com",
  "tipoError": "CFDI40147",
  "codigoError": "CFDI40147",
  "mensajeError": "El código postal 00000 no es válido para el RFC del receptor",
  "detalleError": {
    "status": 400,
    "error": {
      "code": "CFDI40147",
      "message": "El código postal 00000 no es válido...",
      "details": "Validación SAT: El domicilio fiscal no corresponde..."
    }
  },
  "sucursal": "MKTLV4243",
  "intentos": 1,
  "estado": "pendiente",
  "idUsuarioCognito": "us-east-1_abc123def"
}
```

**Response:**
```json
{
  "_id": "673e5f2a8b4c1a0012345678",
  "mensaje": "Error registrado exitosamente"
}
```

**Lógica especial:**
- Si ya existe un error con el mismo `ticketNumber`, **incrementar** el campo `intentos` en lugar de crear uno nuevo.
- Actualizar `fecha` con la fecha del nuevo intento.

---

### 2. **GET** `/errores-facturacion`
Obtiene la lista de errores con filtros opcionales.

**Query Parameters:**
```
?fechaDesde=2025-11-01T00:00:00.000Z
&fechaHasta=2025-11-08T23:59:59.999Z
&tipoError=CFDI40147
&estado=pendiente
&rfc=XAXX010101000
&sucursal=MKTLV4243
&ticketNumber=MKTLV4243-1382723
```

**Response:**
```json
[
  {
    "_id": "673e5f2a8b4c1a0012345678",
    "fecha": "2025-11-08T10:30:00.000Z",
    "ticketNumber": "MKTLV4243-1382723",
    "rfcReceptor": "XAXX010101000",
    "nombreReceptor": "PUBLICO EN GENERAL",
    "emailReceptor": "cliente@example.com",
    "tipoError": "CFDI40147",
    "codigoError": "CFDI40147",
    "mensajeError": "El código postal 00000 no es válido...",
    "detalleError": { ... },
    "sucursal": "MKTLV4243",
    "intentos": 3,
    "estado": "pendiente",
    "notasAdmin": null,
    "resueltoEn": null,
    "resueltoBy": null
  }
]
```

**Orden:** Descendente por `fecha` (más recientes primero).

---

### 3. **GET** `/errores-facturacion/:id`
Obtiene un error específico por su ID.

**Response:**
```json
{
  "_id": "673e5f2a8b4c1a0012345678",
  "fecha": "2025-11-08T10:30:00.000Z",
  ...
}
```

---

### 4. **PUT** `/errores-facturacion/:id`
Actualiza un error existente (para cambiar estado, agregar notas, marcar como resuelto).

**Request Body:**
```json
{
  "estado": "en_revision",
  "notasAdmin": "Contactar al cliente para renovar certificado"
}
```

**Response:**
```json
{
  "_id": "673e5f2a8b4c1a0012345678",
  "fecha": "2025-11-08T10:30:00.000Z",
  "estado": "en_revision",
  "notasAdmin": "Contactar al cliente para renovar certificado",
  ...
}
```

**Lógica especial:**
- Si `estado` cambia a `'resuelto'`, automáticamente llenar `resueltoEn` con la fecha actual.

---

### 5. **GET** `/errores-facturacion/estadisticas`
Obtiene estadísticas agregadas de errores.

**Query Parameters:**
```
?fechaDesde=2025-11-01T00:00:00.000Z
&fechaHasta=2025-11-08T23:59:59.999Z
```

**Response:**
```json
{
  "totalErrores": 25,
  "erroresPendientes": 10,
  "erroresEnRevision": 5,
  "erroresResueltos": 10,
  "erroresPorTipo": [
    { "tipo": "CFDI40147", "cantidad": 8 },
    { "tipo": "CERTIFICADO_VENCIDO", "cantidad": 5 },
    { "tipo": "SIN_TIMBRES", "cantidad": 4 },
    ...
  ],
  "erroresPorDia": [
    { "fecha": "2025-11-08", "cantidad": 5 },
    { "fecha": "2025-11-07", "cantidad": 3 },
    ...
  ],
  "clientesMasAfectados": [
    { 
      "rfc": "VABO780711D41", 
      "nombre": "OMAR VALDEZ BECERRIL", 
      "cantidad": 5 
    },
    ...
  ]
}
```

**Lógica de cálculo:**
- `erroresPorTipo`: Agrupar por `tipoError` y contar.
- `erroresPorDia`: Agrupar por fecha (sin hora) y contar.
- `clientesMasAfectados`: Agrupar por `rfcReceptor`, sumar `intentos`, ordenar descendente, tomar top 10.

**MongoDB Aggregation Pipeline sugerido:**
```javascript
// Errores por tipo
db.errores_facturacion.aggregate([
  { $match: { fecha: { $gte: fechaDesde, $lte: fechaHasta } } },
  { $group: { _id: "$tipoError", cantidad: { $sum: 1 } } },
  { $project: { tipo: "$_id", cantidad: 1, _id: 0 } },
  { $sort: { cantidad: -1 } }
])

// Clientes más afectados
db.errores_facturacion.aggregate([
  { $match: { fecha: { $gte: fechaDesde, $lte: fechaHasta } } },
  { 
    $group: { 
      _id: { rfc: "$rfcReceptor", nombre: "$nombreReceptor" },
      cantidad: { $sum: "$intentos" }
    }
  },
  { 
    $project: { 
      rfc: "$_id.rfc", 
      nombre: "$_id.nombre", 
      cantidad: 1, 
      _id: 0 
    }
  },
  { $sort: { cantidad: -1 } },
  { $limit: 10 }
])
```

---

### 6. **DELETE** `/errores-facturacion/:id`
Elimina un error del sistema (opcional - considerar soft delete).

**Response:**
```json
{
  "mensaje": "Error eliminado exitosamente"
}
```

**Recomendación:** Implementar **soft delete** (agregar campo `deletedAt` en lugar de eliminar físicamente).

---

## 🔐 Seguridad

1. **Autenticación:** Validar token JWT de AWS Cognito en todas las peticiones.
2. **Autorización:** Solo usuarios con rol `admin` pueden acceder a estos endpoints.
3. **Rate Limiting:** Máximo 100 requests por minuto por usuario.

---

## 🚀 Prioridad de Implementación

1. **Alta:** POST (crear error), GET (listar errores)
2. **Media:** PUT (actualizar), GET/:id (detalle)
3. **Baja:** DELETE, GET estadísticas

---

## 📝 Notas Adicionales

- **Índices MongoDB recomendados:**
  ```javascript
  db.errores_facturacion.createIndex({ fecha: -1 })
  db.errores_facturacion.createIndex({ ticketNumber: 1 })
  db.errores_facturacion.createIndex({ rfcReceptor: 1 })
  db.errores_facturacion.createIndex({ estado: 1 })
  db.errores_facturacion.createIndex({ tipoError: 1 })
  ```

- **Logs:** Registrar todas las operaciones en CloudWatch.
- **Notificaciones:** Considerar enviar email/SNS al admin cuando `erroresPendientes > 10`.

---

## 🧪 Testing

El frontend está simulando respuestas. Cuando implementes los endpoints, el frontend automáticamente cambiará a usar las APIs reales descomentando las líneas marcadas con `// TODO: Descomentar cuando el backend esté listo`.

**Ubicación del servicio:** `src/app/services/error-tracking.service.ts`

---

## 📞 Contacto

Si tienes dudas sobre la estructura de datos o necesitas más ejemplos, consulta:
- Modelo TypeScript: `src/app/models/errorFacturacion.ts`
- Servicio con datos simulados: `src/app/services/error-tracking.service.ts`
- Componente que consume: `src/app/components/admin-errores/admin-errores.component.ts`
