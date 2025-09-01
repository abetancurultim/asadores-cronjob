import { vi, describe, it, expect } from "vitest";

vi.mock("../../supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
    })),
  },
  TABLE_NAMES: { CHAT_HISTORY: "chat_history", MESSAGES: "messages" },
}));

import { checkAsadoresElBarrilConversations } from "../checkNoReplyConversations";

describe("checkAsadoresElBarrilConversations (mínimo)", () => {
  it("no lanza si no hay conversaciones", async () => {
    await expect(checkAsadoresElBarrilConversations()).resolves.not.toThrow();
  });
});