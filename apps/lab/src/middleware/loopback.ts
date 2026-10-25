import type { Request, Response, NextFunction } from "express";

export function loopbackGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.LAB_ALLOW_CONTAINER === "true" || process.env.LAB_ALLOW_CONTAINER === "1") {
    next();
    return;
  }

  const remote = req.socket.remoteAddress ?? "";
  const isLoopback =
    remote === "127.0.0.1" ||
    remote === "::1" ||
    remote === "::ffff:127.0.0.1" ||
    remote === "localhost";

  if (!isLoopback) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN_REMOTE_ACCESS",
        message: "The Proofline lab server only accepts requests from loopback interfaces.",
      },
    });
    return;
  }

  next();
}
