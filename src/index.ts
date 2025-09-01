import schedule from "node-schedule";
import {
  checkAsadoresElBarrilConversations,
} from "./utils/checkNoReplyConversations";
import { shouldRunJobNow, getCurrentColombiaTime } from "./utils/timeHelpers";
import moment from "moment-timezone";

// Switch global para habilitar/deshabilitar todos los cronjobs.
// Por defecto quedan habilitados, a menos que CRON_ENABLED="false".
const CRON_ENABLED = true;

// Función para calcular la hora del servidor que corresponde a una hora específica de Colombia
const getServerTimeForColombiaTime = (
  colombiaHour: number,
  colombiaMinute: number = 0
): { hour: number; minute: number } => {
  // Crear un momento en Colombia con la hora deseada
  const colombiaTime = moment()
    .tz("America/Bogota")
    .hour(colombiaHour)
    .minute(colombiaMinute)
    .second(0);

  // Convertir a la zona horaria del servidor (local)
  const serverTime = colombiaTime.local();

  console.log(
    `🕐 Colombia ${colombiaHour}:${colombiaMinute
      .toString()
      .padStart(2, "0")} = Servidor ${serverTime.hour()}:${serverTime
      .minute()
      .toString()
      .padStart(2, "0")}`
  );

  return {
    hour: serverTime.hour(),
    minute: serverTime.minute(),
  };
};

// Calcular las horas del servidor para los jobs de Asadores El Barril
const asadoresJobTime = getServerTimeForColombiaTime(12, 0); // 12:00 PM Colombia

// Función que ejecuta el job de Asadores El Barril con validación de horario laboral
const executeAsadoresElBarrilJob = async (jobName: string): Promise<void> => {
  console.log(`\n🏢 [${getCurrentColombiaTime()}] Iniciando ${jobName}...`);

  // Verificar si el job debe ejecutarse según el día y la hora
  if (!shouldRunJobNow()) {
    console.log(`⏸️ ${jobName} cancelado por estar fuera de horario laboral\n`);
    return;
  }

  try {
    // Ejecutar la lógica de verificación de conversaciones sin respuesta para Asadores El Barril (48 horas)
    await checkAsadoresElBarrilConversations();
    console.log(`✅ ${jobName} completado exitosamente\n`);
  } catch (error) {
    console.error(`❌ Error en ${jobName}:`, error);
  }
};

// ASADORES EL BARRIL: Job de verificación cada 2 horas en horario laboral
const createAsadoresElBarrilJobs = () => {
  const asadoresSchedules = [
    // Lunes a Viernes: 8AM, 10AM, 12PM, 2PM, 4PM, 6PM
    { colombiaHour: 8, description: "8AM Colombia", days: "1-5" },
    { colombiaHour: 10, description: "10AM Colombia", days: "1-5" },
    { colombiaHour: 12, description: "12PM Colombia", days: "1-5" },
    { colombiaHour: 14, description: "2PM Colombia", days: "1-5" },
    { colombiaHour: 16, description: "4PM Colombia", days: "1-5" },
    { colombiaHour: 18, description: "6PM Colombia", days: "1-5" },
    
    // Sábados: 8AM, 10AM, 12PM (hasta 1PM)
    { colombiaHour: 8, description: "8AM Colombia (sábado)", days: "6" },
    { colombiaHour: 10, description: "10AM Colombia (sábado)", days: "6" },
    { colombiaHour: 12, description: "12PM Colombia (sábado)", days: "6" },
  ];

  asadoresSchedules.forEach((scheduleConfig) => {
    const serverTime = getServerTimeForColombiaTime(
      scheduleConfig.colombiaHour,
      0
    );

    // Programar para los días específicos
    schedule.scheduleJob(
      `0 ${serverTime.hour} * * ${scheduleConfig.days}`,
      async () => {
        await executeAsadoresElBarrilJob(
          `ASADORES EL BARRIL: Job de verificación (${scheduleConfig.description} = ${serverTime.hour}:00 Servidor)`
        );
      }
    );

    console.log(
      `🏢 ASADORES EL BARRIL programado: ${scheduleConfig.description} = ${serverTime.hour}:00 servidor`
    );
  });
};

createAsadoresElBarrilJobs();

// ! Ejecutar el cronjob cada 3 minutos (para pruebas ASADORES EL BARRIL) - Descomenta la siguiente línea para probar
// schedule.scheduleJob("*/3 * * * *", async () => {
//   await executeAsadoresElBarrilJob("Test ASADORES EL BARRIL (cada 3 minutos)");
// });

if (CRON_ENABLED) {
  console.log("🚀 Sistema de notificaciones iniciado para Asadores El Barril:");
  console.log(
    "🏢 ASADORES EL BARRIL: Verificación cada 2 horas en horario laboral (48h sin respuesta)"
  );
  console.log("⏰ Horario laboral: Lun-Vie 8AM-6PM, Sáb 8AM-1PM, Dom cerrado");
  console.log("❌ Excluye conversaciones con chat_status = 'closed'");
  console.log("📦 ASADORES EL BARRIL: Excluye conversaciones con is_archived = true");
  console.log(`🕐 Hora actual en Colombia: ${getCurrentColombiaTime()}`);
  console.log(
    `🕐 Hora actual del servidor: ${moment().format("YYYY-MM-DD HH:mm:ss")}\n`
  );
} else {
  console.log(
    "⏸️ CRON deshabilitado: no se programará ningún escenario (establece CRON_ENABLED=true para habilitarlo)"
  );
}
