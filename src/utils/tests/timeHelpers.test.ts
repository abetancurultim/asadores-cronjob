import { describe, it, expect } from "vitest";
import moment from "moment-timezone";
import { isWithinBusinessHours } from "../checkNoReplyConversations";

describe("isWithinBusinessHours", () => {
    it("Lunes 09:00 -> true", () => {
        const date = moment.tz("2023-09-01 09:00", "America/Bogota");
        expect(isWithinBusinessHours(date)).toBe(true);
    });
    it("Lunes 19:00 -> false", () => {
        const date = moment.tz("2023-09-01 19:00", "America/Bogota");
        expect(isWithinBusinessHours(date)).toBe(false);
    });
    it("Sábado 10:00 -> true", () => {
        const date = moment.tz("2023-09-02 10:00", "America/Bogota");
        expect(isWithinBusinessHours(date)).toBe(true);
    });
    it("Sábado 14:00 -> false", () => {
        const date = moment.tz("2023-09-02 14:00", "America/Bogota");
        expect(isWithinBusinessHours(date)).toBe(false);
    });
    it("Domingo 10:00 -> false", () => {
        const date = moment.tz("2023-09-03 10:00", "America/Bogota");
        expect(isWithinBusinessHours(date)).toBe(false);
    });
});