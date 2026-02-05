import { Response, NextFunction } from "express";
import  prisma  from "../lib/prisma";
import { createCustomError } from "../utils/customError";

export async function verifiedMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw createCustomError(401, "Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });

    if (!user) throw createCustomError(404, "User tidak ditemukan");
    if (!user.isVerified) throw createCustomError(403, "Akun belum terverifikasi");

    next();
  } catch (err) {
    next(err);
  }
}
