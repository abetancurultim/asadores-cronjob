import { vi, describe, it, expect, beforeEach } from "vitest";
vi.mock("axios", () => ({
  default: { post: vi.fn().mockResolvedValue({ data: { success: true } }) },
}));

import axios from "axios";
import { sendAsadoresElBarrilReminder } from "../checkNoReplyConversations";

describe("sendAsadoresElBarrilReminder (mínimo)", () => {
  beforeEach(() => {
    (axios as any).post.mockClear?.();
  });

  it("llama axios.post al enviar recordatorio genérico", async () => {
    await sendAsadoresElBarrilReminder("+573001234567");
    expect((axios as any).post).toHaveBeenCalled();
  });
});