import type { RequestHandler } from "express";
import { materializeDeadlineNotifications } from "./db";
import { sdk } from "./_core/sdk";

export const rfqDeadlineHandler: RequestHandler = async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const ownersProcessed = await materializeDeadlineNotifications();
    return res.json({ ok: true, taskUid: user.taskUid, ownersProcessed });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, method: req.method },
      timestamp: new Date().toISOString(),
    });
  }
};
