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
exports.resetAsadoresElBarrilNotificationsOnClientReply = exports.sendAsadoresElBarrilReminder = exports.isWithinBusinessHours = exports.checkAsadoresElBarrilConversations = void 0;
const supabase_1 = require("./supabase");
const timeHelpers_1 = require("./timeHelpers");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
dotenv_1.default.config();
// ESCENARIO ASADORES EL BARRIL: Verificar conversaciones sin respuesta después de 48 horas
const checkAsadoresElBarrilConversations = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🔍 [${(0, timeHelpers_1.getCurrentColombiaTime)()}] ESCENARIO ASADORES EL BARRIL: Verificando conversaciones sin respuesta después de 48 horas...`);
    try {
        // Consultar conversaciones activas que no han sido notificadas, no están cerradas y no están archivadas
        const { data: conversations, error: conversationsError } = yield supabase_1.supabase
            .from(supabase_1.TABLE_NAMES.CHAT_HISTORY)
            .select("id, client_number, chat_status, is_archived, notified_no_reply")
            .eq("notified_no_reply", false)
            .neq("chat_status", "closed")
            .eq("is_archived", false);
        if (conversationsError) {
            console.error("❌ Error fetching conversations:", conversationsError);
            return;
        }
        if (!conversations || conversations.length === 0) {
            console.log("✅ No hay conversaciones pendientes de notificar (Asadores El Barril)");
            return;
        }
        console.log(`📋 Encontradas ${conversations.length} conversaciones activas para revisar (Asadores El Barril)`);
        for (const conversation of conversations) {
            yield processAsadoresElBarrilConversation(conversation);
        }
    }
    catch (error) {
        console.error("❌ Error general en checkAsadoresElBarrilConversations:", error);
    }
});
exports.checkAsadoresElBarrilConversations = checkAsadoresElBarrilConversations;
// Procesar conversación para Asadores El Barril (48 horas sin respuesta)
const processAsadoresElBarrilConversation = (conversation) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Buscar el último mensaje del asesor en esta conversación (cualquier sender que no sea client_message)
        const { data: lastAgentMessage, error: messageError } = yield supabase_1.supabase
            .from(supabase_1.TABLE_NAMES.MESSAGES)
            .select("created_at, sender")
            .eq("conversation_id", conversation.id)
            .neq("sender", "client_message")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        if (messageError || !lastAgentMessage) {
            console.log(`⚠️ No se encontró último mensaje del asesor para conversación ${conversation.id} (Asadores El Barril)`);
            return;
        }
        const lastAgentMessageDate = (0, moment_timezone_1.default)(lastAgentMessage.created_at).tz("America/Bogota");
        // Verificar que el mensaje del asesor fue enviado en horario laboral
        if (!(0, exports.isWithinBusinessHours)(lastAgentMessageDate)) {
            console.log(`⏰ Mensaje del asesor fuera de horario laboral para conversación ${conversation.id} (Asadores El Barril)`);
            return;
        }
        // Calcular tiempo transcurrido desde el último mensaje del asesor
        const now = (0, moment_timezone_1.default)().tz("America/Bogota");
        const timeDiffHours = now.diff(lastAgentMessageDate, "hours");
        console.log(`📞 Conversación ${conversation.id}: Último mensaje del asesor hace ${timeDiffHours} horas (Asadores El Barril)`);
        // Si han pasado más de 48 horas, verificar si el cliente respondió después
        if (timeDiffHours >= 48) {
            const clientReplied = yield hasClientRepliedAfter(conversation.id, lastAgentMessageDate);
            if (!clientReplied) {
                console.log(`📧 Enviando recordatorio Asadores El Barril a ${conversation.client_number}`);
                yield (0, exports.sendAsadoresElBarrilReminder)(conversation.client_number);
                yield markAsNotifiedNoReply(conversation.id);
            }
            else {
                console.log(`✅ Cliente ya respondió después del último mensaje del asesor (Asadores El Barril)`);
            }
        }
    }
    catch (error) {
        console.error(`❌ Error procesando conversación ${conversation.id} (Asadores El Barril):`, error);
    }
});
// Verificar si el cliente respondió después de una fecha específica
const hasClientRepliedAfter = (conversationId, afterDate) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data: clientMessages, error } = yield supabase_1.supabase
            .from(supabase_1.TABLE_NAMES.MESSAGES)
            .select("created_at")
            .eq("conversation_id", conversationId)
            .eq("sender", "client_message")
            .gte("created_at", afterDate.toISOString())
            .limit(1);
        if (error) {
            console.error("❌ Error verificando respuesta del cliente:", error);
            return false;
        }
        return clientMessages && clientMessages.length > 0;
    }
    catch (error) {
        console.error("❌ Error en hasClientRepliedAfter:", error);
        return false;
    }
});
// Verificar si una fecha está dentro del horario laboral
const isWithinBusinessHours = (date) => {
    const dayOfWeek = date.day(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const hour = date.hour();
    // Domingos no se trabaja
    if (dayOfWeek === 0) {
        return false;
    }
    // Lunes a Viernes: 8AM a 6PM
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return hour >= 8 && hour < 18;
    }
    // Sábados: 8AM a 1PM
    if (dayOfWeek === 6) {
        return hour >= 8 && hour < 13;
    }
    return false;
};
exports.isWithinBusinessHours = isWithinBusinessHours;
// Enviar recordatorio para Asadores El Barril (48 horas sin respuesta)
const sendAsadoresElBarrilReminder = (phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const templateUrl = "https://ultim.online/fenix/send-template";
        const testTemplateUrl = "http://localhost:3024/fenix/send-template";
        // Usamos temporalmente el template genérico del primer escenario
        const response = yield axios_1.default.post(templateUrl, {
            to: phoneNumber,
            templateId: "HXad825e16b3fef204b7e78ec9d0851950",
        });
        console.log(`✅ Recordatorio Asadores El Barril enviado exitosamente:`, response.data);
    }
    catch (error) {
        if (error.response) {
            console.error(`❌ Error enviando recordatorio Asadores El Barril:`, error.response.data);
        }
        else if (error.request) {
            console.error(`❌ No response from server:`, error.request);
        }
        else {
            console.error(`❌ Error:`, error.message);
        }
    }
});
exports.sendAsadoresElBarrilReminder = sendAsadoresElBarrilReminder;
// Marcar conversación como notificada para Asadores El Barril
const markAsNotifiedNoReply = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = yield supabase_1.supabase
            .from(supabase_1.TABLE_NAMES.CHAT_HISTORY)
            .update({ notified_no_reply: true })
            .eq("id", conversationId);
        if (error) {
            console.error(`❌ Error marcando conversación ${conversationId} como notificada (Asadores El Barril):`, error);
        }
        else {
            console.log(`✅ Conversación ${conversationId} marcada como notificada (Asadores El Barril)`);
        }
    }
    catch (error) {
        console.error(`❌ Error general marcando conversación ${conversationId} (Asadores El Barril):`, error);
    }
});
// Resetear notificaciones para Asadores El Barril cuando el cliente responda
// IMPORTANTE: Esta función debe ser llamada desde el webhook o sistema de mensajes
// específicamente para el cliente Asadores El Barril cuando un cliente envíe un mensaje
//
// Ejemplo de uso:
// await resetAsadoresElBarrilNotificationsOnClientReply(conversationId);
//
const resetAsadoresElBarrilNotificationsOnClientReply = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = yield supabase_1.supabase
            .from(supabase_1.TABLE_NAMES.CHAT_HISTORY)
            .update({
            notified_no_reply: false,
        })
            .eq("id", conversationId);
        if (error) {
            console.error(`❌ Error reseteando notificaciones Asadores El Barril para conversación ${conversationId}:`, error);
        }
        else {
            console.log(`✅ Notificaciones Asadores El Barril reseteadas para conversación ${conversationId} - cliente respondió`);
        }
    }
    catch (error) {
        console.error(`❌ Error general reseteando notificaciones Asadores El Barril para conversación ${conversationId}:`, error);
    }
});
exports.resetAsadoresElBarrilNotificationsOnClientReply = resetAsadoresElBarrilNotificationsOnClientReply;
