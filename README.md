# 📧 Asadores El Barril Cronjob - Sistema de Notificaciones WhatsApp

## 📝 Documentación General del Cronjob

### 🎯 Descripción General

El **Cronjob de Asadores El Barril** es un sistema automatizado de notificaciones WhatsApp que gestiona la comunicación con clientes a través de **tres escenarios principales**, ejecutándose en horarios específicos para mantener activas las ventanas de contexto de WhatsApp y mejorar la experiencia del cliente.

---

# 📧 Asadores El Barril — Cronjob de notificaciones WhatsApp (escenario único)

Resumen breve
--------------
Este repositorio ejecuta un único escenario: detectar conversaciones activas que llevan 48 horas sin respuesta del cliente y enviar un recordatorio por WhatsApp. La lógica principal está en `src/utils/checkNoReplyConversations.ts` y la programación en `src/index.ts`.

Qué hace exactamente (contrato)
- Input: consultas a Supabase sobre `chat_history` y `messages`.
- Output: envío de un template a un número de cliente y marcado de la conversación (`notified_no_reply = true`).
- Error modes: loguea errores y continúa con otras conversaciones.

Comportamiento detallado (basado en el código)
- Scheduler: `src/index.ts` crea jobs para Asadores El Barril en horarios de Colombia (Lun-Vie: 8,10,12,14,16,18; Sáb: 8,10,12). Cada job llama a `checkAsadoresElBarrilConversations()`.
- Filtrado inicial: se consultan filas en `TABLE_CHAT_HISTORY` donde `notified_no_reply = false`, `chat_status != 'closed'` y `is_archived = false`.
- Para cada conversación:
   - Se busca el último mensaje del asesor (`sender != 'client_message'`).
   - Se valida que ese mensaje se haya enviado dentro del horario laboral (`isWithinBusinessHours`).
   - Se calcula tiempo transcurrido; si >= 48 horas y el cliente no respondió después de ese mensaje, se envía un recordatorio y se marca la conversación (`notified_no_reply = true`).

Funciones y archivos clave
- `src/index.ts` — programación de jobs y conversión de hora Colombia → hora servidor.
- `src/utils/checkNoReplyConversations.ts` — contiene:
   - `checkAsadoresElBarrilConversations()` — flujo principal.
   - `processAsadoresElBarrilConversation()` — lógica por conversación.
   - `isWithinBusinessHours()` — valida Lun-Vie 8-18, Sáb 8-13, Dom cerrado.
   - `sendAsadoresElBarrilReminder(phoneNumber)` — envía el template (usa `axios.post` a un URL actualmente hardcodeado en el archivo).
   - `markAsNotifiedNoReply(conversationId)` — actualiza `notified_no_reply` en Supabase.

Notas importantes y recomendaciones
- El `sendAsadoresElBarrilReminder` usa hoy URLs hardcodeadas (`https://ultim.online/fenix/send-template` y `http://localhost:3024/fenix/send-template`). Recomiendo volver estas URLs configurables vía variable de entorno para entornos de staging/producción.
- `ecosystem.config.cjs` todavía contiene el nombre del proceso anterior (`fenix-cronjob`) — si quieres que todo use `asadores-cronjob` puedo cambiarlo.
- Tests: la suite usa Vitest y hay tests en `src/utils/tests` (no toqué nada). Tú pediste no cambiar los tests ahora; mantendré esa restricción.

Instalación y ejecución rápida
--------------------------------
1. Instalar dependencias

```bash
npm install
```

2. Ejecutar en desarrollo

```bash
npm run dev
```

3. Ejecutar tests (Vitest)

```bash
npm test
```

Checklist de requisitos cubiertos por esta documentación
- Documentar proyecto como escenario único de 48 horas — Done
- Documentar programación y comportamiento (index.ts + checkNoReplyConversations.ts) — Done
- No tocar tests — Acknowledged (no cambios aplicados)

Siguientes pasos opcionales (dime cuál ejecutar)
- Hacer las URLs de envío configurables vía `.env` (recomendado).
- Renombrar `ecosystem.config.cjs` process name a `asadores-cronjob` (cambiar PM2).
- Ajustar/optimizar tests o aumentar timeout del test que falla (me has pedido esperar para esto).

Si quieres que aplique alguno de los pasos opcionales, indícame cuál y lo hago ahora.
npm install
```

### 2. Configurar variables de entorno

```bash
# Crear archivo .env basado en el ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# Para producción, las variables de tabla son opcionales (usa defaults)
# Para testing, descomenta y ajusta los nombres de tabla
```

### 3. Verificar configuración

```bash
npm run dev
```

## 🏃‍♂️ Ejecución

### Desarrollo

```bash
npm run dev
```

### Producción
pm2 logs asadores-cronjob
```bash
npm start
pm2 restart asadores-cronjob

### Usando PM2 (Recomendado para producción)
pm2 stop asadores-cronjob
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con configuración
pm2 start ecosystem.config.cjs

# Ver logs
pm2 logs fenix-cronjob

# Reiniciar
pm2 restart fenix-cronjob

# Detener
pm2 stop fenix-cronjob
```

## 🧪 Testing y Desarrollo

### Configuración de Testing

Para usar tablas de testing, configura tu `.env`:

```env
# Configuración para testing
TABLE_CHAT_HISTORY=chat_history_test
TABLE_MESSAGES=messages_test
TABLE_USERS=users_test
```

### Pruebas ESCENARIO 1 (cada minuto)

En `src/index.ts`, descomenta:

```typescript
schedule.scheduleJob("* * * * *", async () => {
  await executeInHoursJobWithValidation("Test ESCENARIO 1 (cada minuto)");
});
```

### Pruebas ESCENARIO 2 (cada 30 segundos)

En `src/index.ts`, descomenta:

```typescript
schedule.scheduleJob("*/30 * * * * *", async () => {
  await executeOutOfHoursJob("Test ESCENARIO 2 (cada 30 segundos)");
});
```

### Cambio entre Producción y Testing

```bash
# Para producción (usar defaults)
# Comentar o eliminar variables TABLE_* del .env

# Para testing
# Descomentar y ajustar variables TABLE_* en .env

# Reiniciar aplicación después de cambios
npm run dev
```

## 📁 Estructura del Proyecto

```
fenix-cronjob/
├── src/
│   ├── index.ts                              # Punto de entrada y programación de jobs
│   └── utils/
│       ├── checkConversations.ts             # Job original (deprecated)
│       ├── checkNoReplyConversations.ts      # Lógica principal - AMBOS ESCENARIOS
│       ├── checkUserName.ts                  # Búsqueda de nombres de usuario
│       ├── supabase.ts                       # Configuración de Supabase
│       └── timeHelpers.ts                    # Funciones de validación de horario
├── ecosystem.config.cjs                      # Configuración PM2
├── package.json                             # Dependencias y scripts
├── tsconfig.json                            # Configuración TypeScript
└── README.md                                # Esta documentación
```

## 🔄 Flujo de Funcionamiento

### ESCENARIO 1: Conversaciones sin respuesta en horario laboral

#### Ejecución Programada

- **12:30 PM Colombia**: Primer job diario
- **5:30 PM Colombia**: Segundo job diario

#### Lógica de Procesamiento

```typescript
1. Buscar conversaciones con:
   - chat_status != "closed"
   - is_archived = false
   - notified_no_reply = false
2. Para cada conversación:
   - Buscar último mensaje del asesor (sender != 'client_message')
   - Verificar que fue enviado en horario laboral
   - Si han pasado 3+ horas sin respuesta del cliente → Enviar recordatorio
   - Marcar notified_no_reply = true
```

### ESCENARIO 2: Mensajes fuera de horario laboral

#### Ejecución Programada

- **8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM** (cada 2 horas de 8AM-6PM)

#### Lógica de Procesamiento

```typescript
1. Buscar conversaciones con:
   - notified_out_of_hours = false
2. Para cada conversación:
   - Buscar último mensaje del cliente (sender = 'client_message')
   - Si fue enviado fuera de horario laboral → Enviar mensaje informativo
   - Marcar notified_out_of_hours = true
```

### Horarios Laborales Definidos

- **Lunes a Viernes:** 8:00 AM - 6:00 PM
- **Sábados:** 8:00 AM - 1:00 PM
- **Domingos:** Cerrado

# � Asadores El Barril Cronjob - Sistema de Notificaciones WhatsApp

## 📝 Documentación General del Cronjob

### 🎯 Descripción General

El Cronjob de **Asadores El Barril** es un servicio que envía notificaciones automáticas por WhatsApp para mantener activas las ventanas de contexto y mejorar la atención al cliente.

El sistema implementa dos escenarios principales: recordatorios a clientes que no responden en horario laboral y mensajes informativos para conversaciones iniciadas fuera de horario.

---

### 🏗️ Arquitectura del Sistema

- `src/index.ts` — Scheduler principal y programación de jobs
- `src/utils/checkNoReplyConversations.ts` — Lógica de detección y envíos de recordatorios
- `src/utils/timeHelpers.ts` — Validación de horarios y zona horaria (America/Bogota)
- `src/utils/supabase.ts` — Conexión y consultas a Supabase

---

### 📅 Escenarios de Notificación

- ESCENARIO 1 (recordatorio): Primer barrido 12:30 PM y segundo barrido 5:30 PM (hora Colombia). Envía templates a conversaciones activas donde el cliente no respondió.
- ESCENARIO 2 (fuera de horario): Ejecución cada 2 horas entre 8AM y 6PM (8:00,10:00,12:00,14:00,16:00,18:00). Envía un mensaje informativo a conversaciones iniciadas fuera de horario.

---

### 🕐 Horarios Laborales

- Zona: America/Bogota (Colombia)
- Lun-Vie: 8:00 - 18:00
- Sábados: 8:00 - 13:00
- Domingos: Cerrado

---

## � Requisitos Previos

- Cuenta y credenciales de Supabase
- Variables de entorno (ver sección Variables de Entorno)

### Variables de entorno (ejemplo)

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key
TABLE_CHAT_HISTORY=chat_history
TABLE_MESSAGES=messages
TABLE_USERS=users
```

### Estructura mínima de tablas

- `chat_history` debe incluir flags booleanas: `notified_no_reply`, `notified_out_of_hours`, `notified_out_afternoon`.
- `messages` debe incluir `conversation_id`, `sender` y `created_at`.

---

## �️ Instalación y ejecución

```bash
git clone <repository-url>
cd asadores-cronjob
npm install
```

Desarrollo:

```bash
npm run dev
```

Producción (ejemplo con PM2):

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 logs asadores-cronjob
pm2 restart asadores-cronjob
pm2 stop asadores-cronjob
```

---

## 🧪 Tests incluidos

Este proyecto usa Vitest para pruebas unitarias. Los tests se encuentran en `src/utils/tests`.

Ejecutar tests:

```bash
npm install
npm test        # ejecuta los tests una vez
npm run test:watch  # modo watch durante desarrollo
```

Tests importantes:

- `src/utils/tests/timeHelpers.test.ts` — validaciones de horario
- `src/utils/tests/checkNoReplyConversations.test.ts` — lógica de recordatorios
- `src/utils/tests/sendReminder.test.ts` — envío de recordatorios (con mocks)

Si quieres ejecutar los tests usando tablas de testing en Supabase, configura las variables `TABLE_*` en el `.env` (por ejemplo `chat_history_test`) y ejecuta los tests.

---

## 🧾 Flujo de funcionamiento (resumen)

1. El scheduler invoca los jobs programados.
2. El job consulta conversaciones candidatas en Supabase.
3. Se evalúan condiciones (horario, flags, último remitente, tiempo transcurrido).
4. Si aplica, se envía un template/message y se marca la conversación con la flag correspondiente.
5. Cuando el cliente responde, las flags se resetean desde el webhook principal.

---

## 🔒 Seguridad

- ✅ Variables de entorno para credenciales sensibles
- ✅ Validación de datos antes de envío
- ✅ Manejo de errores robusto
- ✅ Logs sin información sensible
- ✅ Filtros de estado de conversación

## 📈 Rendimiento

- ⚡ Consultas optimizadas a base de datos
- 🔄 Procesamiento secuencial para evitar sobrecarga
- 📊 Control de duplicados eficiente con flags específicos
- ⏱️ Timeouts configurables
- 🎯 Ejecución solo en horarios necesarios
