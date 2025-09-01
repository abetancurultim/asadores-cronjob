"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_schedule_1 = __importDefault(require("node-schedule"));
const checkNoReplyConversations_1 = require("./utils/checkNoReplyConversations");
const timeHelpers_1 = require("./utils/timeHelpers");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
// Switch global para habilitar/deshabilitar todos los cronjobs.
// Por defecto quedan habilitados, a menos que CRON_ENABLED="false".
const CRON_ENABLED = true;
// Función para calcular la hora del servidor que corresponde a una hora específica de Colombia
const getServerTimeForColombiaTime = (colombiaHour, colombiaMinute = 0) => {
    // Crear un momento en Colombia con la hora deseada
    const colombiaTime = (0, moment_timezone_1.default)()
        .tz("America/Bogota")
        .hour(colombiaHour)
        .minute(colombiaMinute)
        .second(0);
    // Convertir a la zona horaria del servidor (local)
    const serverTime = colombiaTime.local();
    console.log(`🕐 Colombia ${colombiaHour}:${colombiaMinute
        .toString()
        .padStart(2, "0")} = Servidor ${serverTime.hour()}:${serverTime
        .minute()
        .toString()
        .padStart(2, "0")}`);
    return {
        hour: serverTime.hour(),
        minute: serverTime.minute(),
    };
};
// Calcular las horas del servidor para los jobs de Asadores El Barril
const asadoresJobTime = getServerTimeForColombiaTime(12, 0); // 12:00 PM Colombia
// Función que ejecuta el job de Asadores El Barril con validación de horario laboral
const executeAsadoresElBarrilJob = (jobName) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`\n🏢 [${(0, timeHelpers_1.getCurrentColombiaTime)()}] Iniciando ${jobName}...`);
    // Verificar si el job debe ejecutarse según el día y la hora
    if (!(0, timeHelpers_1.shouldRunJobNow)()) {
        console.log(`⏸️ ${jobName} cancelado por estar fuera de horario laboral\n`);
        return;
    }
    try {
        // Ejecutar la lógica de verificación de conversaciones sin respuesta para Asadores El Barril (48 horas)
        yield (0, checkNoReplyConversations_1.checkAsadoresElBarrilConversations)();
        console.log(`✅ ${jobName} completado exitosamente\n`);
    }
    catch (error) {
        console.error(`❌ Error en ${jobName}:`, error);
    }
});
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
        const serverTime = getServerTimeForColombiaTime(scheduleConfig.colombiaHour, 0);
        // Programar para los días específicos
        node_schedule_1.default.scheduleJob(`0 ${serverTime.hour} * * ${scheduleConfig.days}`, () => __awaiter(void 0, void 0, void 0, function* () {
            yield executeAsadoresElBarrilJob(`ASADORES EL BARRIL: Job de verificación (${scheduleConfig.description} = ${serverTime.hour}:00 Servidor)`);
        }));
        console.log(`🏢 ASADORES EL BARRIL programado: ${scheduleConfig.description} = ${serverTime.hour}:00 servidor`);
    });
};
createAsadoresElBarrilJobs();
// ! Ejecutar el cronjob cada 3 minutos (para pruebas ASADORES EL BARRIL) - Descomenta la siguiente línea para probar
// schedule.scheduleJob("*/3 * * * *", async () => {
//   await executeAsadoresElBarrilJob("Test ASADORES EL BARRIL (cada 3 minutos)");
// });
if (CRON_ENABLED) {
    console.log("🚀 Sistema de notificaciones iniciado para Asadores El Barril:");
    console.log("🏢 ASADORES EL BARRIL: Verificación cada 2 horas en horario laboral (48h sin respuesta)");
    console.log("⏰ Horario laboral: Lun-Vie 8AM-6PM, Sáb 8AM-1PM, Dom cerrado");
    console.log("❌ Excluye conversaciones con chat_status = 'closed'");
    console.log("📦 ASADORES EL BARRIL: Excluye conversaciones con is_archived = true");
    console.log(`🕐 Hora actual en Colombia: ${(0, timeHelpers_1.getCurrentColombiaTime)()}`);
    console.log(`🕐 Hora actual del servidor: ${(0, moment_timezone_1.default)().format("YYYY-MM-DD HH:mm:ss")}\n`);
}
else {
    console.log("⏸️ CRON deshabilitado: no se programará ningún escenario (establece CRON_ENABLED=true para habilitarlo)");
}
