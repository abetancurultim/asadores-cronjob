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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock("../../supabase", () => ({
    supabase: {
        from: vitest_1.vi.fn(() => ({
            select: vitest_1.vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vitest_1.vi.fn().mockReturnThis(),
            neq: vitest_1.vi.fn().mockReturnThis(),
        })),
    },
    TABLE_NAMES: { CHAT_HISTORY: "chat_history", MESSAGES: "messages" },
}));
const checkNoReplyConversations_1 = require("../checkNoReplyConversations");
(0, vitest_1.describe)("checkAsadoresElBarrilConversations (mínimo)", () => {
    (0, vitest_1.it)("no lanza si no hay conversaciones", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, vitest_1.expect)((0, checkNoReplyConversations_1.checkAsadoresElBarrilConversations)()).resolves.not.toThrow();
    }));
});
