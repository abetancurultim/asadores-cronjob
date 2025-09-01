import { supabase, TABLE_NAMES } from "./supabase";
import { getCurrentColombiaTime } from "./timeHelpers";
import axios from "axios";
import dotenv from "dotenv";
import moment from "moment-timezone";

dotenv.config();

type Conversation = {
  id: string;
  client_number: string;
  chat_status: string;
  is_archived: boolean;
  notified_no_reply: boolean;
};

type Message = {
  id: string;
  conversation_id: string;
  sender: string;
  created_at: string;
};

// ESCENARIO ASADORES EL BARRIL: Verificar conversaciones sin respuesta después de 48 horas
export const checkAsadoresElBarrilConversations = async (): Promise<void> => {
  console.log(
    `🔍 [${getCurrentColombiaTime()}] ESCENARIO ASADORES EL BARRIL: Verificando conversaciones sin respuesta después de 48 horas...`
  );

  try {
    // Consultar conversaciones activas que no han sido notificadas, no están cerradas y no están archivadas
    const { data: conversations, error: conversationsError } = await supabase
      .from(TABLE_NAMES.CHAT_HISTORY)
      .select(
        "id, client_number, chat_status, is_archived, notified_no_reply"
      )
      .eq("notified_no_reply", false)
      .neq("chat_status", "closed")
      .eq("is_archived", false);

    if (conversationsError) {
      console.error("❌ Error fetching conversations:", conversationsError);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log(
        "✅ No hay conversaciones pendientes de notificar (Asadores El Barril)"
      );
      return;
    }

    console.log(
      `📋 Encontradas ${conversations.length} conversaciones activas para revisar (Asadores El Barril)`
    );

    for (const conversation of conversations as Conversation[]) {
      await processAsadoresElBarrilConversation(conversation);
    }
  } catch (error) {
    console.error("❌ Error general en checkAsadoresElBarrilConversations:", error);
  }
};

// Procesar conversación para Asadores El Barril (48 horas sin respuesta)
const processAsadoresElBarrilConversation = async (
  conversation: Conversation
): Promise<void> => {
  try {
    // Buscar el último mensaje del asesor en esta conversación (cualquier sender que no sea client_message)
    const { data: lastAgentMessage, error: messageError } = await supabase
      .from(TABLE_NAMES.MESSAGES)
      .select("created_at, sender")
      .eq("conversation_id", conversation.id)
      .neq("sender", "client_message")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (messageError || !lastAgentMessage) {
      console.log(
        `⚠️ No se encontró último mensaje del asesor para conversación ${conversation.id} (Asadores El Barril)`
      );
      return;
    }

    const lastAgentMessageDate = moment(lastAgentMessage.created_at).tz(
      "America/Bogota"
    );

    // Verificar que el mensaje del asesor fue enviado en horario laboral
    if (!isWithinBusinessHours(lastAgentMessageDate)) {
      console.log(
        `⏰ Mensaje del asesor fuera de horario laboral para conversación ${conversation.id} (Asadores El Barril)`
      );
      return;
    }

    // Calcular tiempo transcurrido desde el último mensaje del asesor
    const now = moment().tz("America/Bogota");
    const timeDiffHours = now.diff(lastAgentMessageDate, "hours");

    console.log(
      `📞 Conversación ${conversation.id}: Último mensaje del asesor hace ${timeDiffHours} horas (Asadores El Barril)`
    );

    // Si han pasado más de 48 horas, verificar si el cliente respondió después
    if (timeDiffHours >= 48) {
      const clientReplied = await hasClientRepliedAfter(
        conversation.id,
        lastAgentMessageDate
      );

      if (!clientReplied) {
        console.log(
          `📧 Enviando recordatorio Asadores El Barril a ${conversation.client_number}`
        );
        await sendAsadoresElBarrilReminder(conversation.client_number);
        await markAsNotifiedNoReply(conversation.id);
      } else {
        console.log(
          `✅ Cliente ya respondió después del último mensaje del asesor (Asadores El Barril)`
        );
      }
    }
  } catch (error) {
    console.error(
      `❌ Error procesando conversación ${conversation.id} (Asadores El Barril):`,
      error
    );
  }
};

// Verificar si el cliente respondió después de una fecha específica
const hasClientRepliedAfter = async (
  conversationId: string,
  afterDate: moment.Moment
): Promise<boolean> => {
  try {
    const { data: clientMessages, error } = await supabase
      .from(TABLE_NAMES.MESSAGES)
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
  } catch (error) {
    console.error("❌ Error en hasClientRepliedAfter:", error);
    return false;
  }
};

// Verificar si una fecha está dentro del horario laboral
export const isWithinBusinessHours = (date: moment.Moment): boolean => {
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

// Enviar recordatorio para Asadores El Barril (48 horas sin respuesta)
export const sendAsadoresElBarrilReminder = async (phoneNumber: string): Promise<void> => {
  try {
    const templateUrl = "https://ultim.online/fenix/send-template";
    const testTemplateUrl = "http://localhost:3024/fenix/send-template";

    // Usamos temporalmente el template genérico del primer escenario
    const response = await axios.post(templateUrl, {
      to: phoneNumber,
      templateId: "HXad825e16b3fef204b7e78ec9d0851950",
    });

    console.log(`✅ Recordatorio Asadores El Barril enviado exitosamente:`, response.data);
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error enviando recordatorio Asadores El Barril:`, error.response.data);
    } else if (error.request) {
      console.error(`❌ No response from server:`, error.request);
    } else {
      console.error(`❌ Error:`, error.message);
    }
  }
};

// Marcar conversación como notificada para Asadores El Barril
const markAsNotifiedNoReply = async (conversationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAMES.CHAT_HISTORY)
      .update({ notified_no_reply: true })
      .eq("id", conversationId);

    if (error) {
      console.error(
        `❌ Error marcando conversación ${conversationId} como notificada (Asadores El Barril):`,
        error
      );
    } else {
      console.log(
        `✅ Conversación ${conversationId} marcada como notificada (Asadores El Barril)`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error general marcando conversación ${conversationId} (Asadores El Barril):`,
      error
    );
  }
};

// Resetear notificaciones para Asadores El Barril cuando el cliente responda
// IMPORTANTE: Esta función debe ser llamada desde el webhook o sistema de mensajes
// específicamente para el cliente Asadores El Barril cuando un cliente envíe un mensaje
//
// Ejemplo de uso:
// await resetAsadoresElBarrilNotificationsOnClientReply(conversationId);
//
export const resetAsadoresElBarrilNotificationsOnClientReply = async (
  conversationId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAMES.CHAT_HISTORY)
      .update({
        notified_no_reply: false,
      })
      .eq("id", conversationId);

    if (error) {
      console.error(
        `❌ Error reseteando notificaciones Asadores El Barril para conversación ${conversationId}:`,
        error
      );
    } else {
      console.log(
        `✅ Notificaciones Asadores El Barril reseteadas para conversación ${conversationId} - cliente respondió`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error general reseteando notificaciones Asadores El Barril para conversación ${conversationId}:`,
      error
    );
  }
};
