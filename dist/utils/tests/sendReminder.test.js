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
const vitest_1 = require("vitest");
vitest_1.vi.mock("axios", () => ({
    default: { post: vitest_1.vi.fn().mockResolvedValue({ data: { success: true } }) },
}));
const axios_1 = __importDefault(require("axios"));
const checkNoReplyConversations_1 = require("../checkNoReplyConversations");
(0, vitest_1.describe)("sendAsadoresElBarrilReminder (mínimo)", () => {
    (0, vitest_1.beforeEach)(() => {
        var _a, _b;
        (_b = (_a = axios_1.default.post).mockClear) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
    (0, vitest_1.it)("llama axios.post al enviar recordatorio genérico", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, checkNoReplyConversations_1.sendAsadoresElBarrilReminder)("+573001234567");
        (0, vitest_1.expect)(axios_1.default.post).toHaveBeenCalled();
    }));
});
