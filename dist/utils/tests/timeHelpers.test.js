"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const checkNoReplyConversations_1 = require("../checkNoReplyConversations");
(0, vitest_1.describe)("isWithinBusinessHours", () => {
    (0, vitest_1.it)("Lunes 09:00 -> true", () => {
        const date = moment_timezone_1.default.tz("2023-09-01 09:00", "America/Bogota");
        (0, vitest_1.expect)((0, checkNoReplyConversations_1.isWithinBusinessHours)(date)).toBe(true);
    });
    (0, vitest_1.it)("Lunes 19:00 -> false", () => {
        const date = moment_timezone_1.default.tz("2023-09-01 19:00", "America/Bogota");
        (0, vitest_1.expect)((0, checkNoReplyConversations_1.isWithinBusinessHours)(date)).toBe(false);
    });
    (0, vitest_1.it)("Sábado 10:00 -> true", () => {
        const date = moment_timezone_1.default.tz("2023-09-02 10:00", "America/Bogota");
        (0, vitest_1.expect)((0, checkNoReplyConversations_1.isWithinBusinessHours)(date)).toBe(true);
    });
    (0, vitest_1.it)("Sábado 14:00 -> false", () => {
        const date = moment_timezone_1.default.tz("2023-09-02 14:00", "America/Bogota");
        (0, vitest_1.expect)((0, checkNoReplyConversations_1.isWithinBusinessHours)(date)).toBe(false);
    });
    (0, vitest_1.it)("Domingo 10:00 -> false", () => {
        const date = moment_timezone_1.default.tz("2023-09-03 10:00", "America/Bogota");
        (0, vitest_1.expect)((0, checkNoReplyConversations_1.isWithinBusinessHours)(date)).toBe(false);
    });
});
