import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";
import { getWaitlist } from "../../../src/lib/waitlist/db";
import { CONFIG } from "../../../src/lib/waitlist/security";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  try {
    const waitlist = await getWaitlist();
    await waitlist.estimatedDocumentCount();
    return { ok: true, powDifficulty: CONFIG.powDifficulty };
  } catch {
    setResponseStatus(event, 503);
    return { ok: false };
  }
});
