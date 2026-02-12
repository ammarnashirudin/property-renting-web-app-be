import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { orderRepository } from "../repositories/order.repository";
import { createCustomError } from "../utils/customError";
import { sendMail } from "../services/email.service";

export const tenantOrderController = {
  // Get tenant orders
  getTenantOrders: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (userRole !== "TENANT") {
        throw createCustomError(403, "Hanya tenant yang dapat mengakses");
      }

      const tenant = await prisma.tenant.findUnique({
        where: { userId },
      });

      if (!tenant) throw createCustomError(403, "Tenant tidak ditemukan");

      const orders = await prisma.order.findMany({
        where: {
          room: {
            property: {
              tenantId: tenant.id,
            },
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              profileImage: true,
            },
          },
          room: {
            include: {
              property: {
                select: {
                  name: true,
                  address: true,
                  image: true,
                },
              },
            },
          },
          paymentLogs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by status
      const grouped = {
        Menunggu_Pembayaran: orders.filter(
          (o) => o.status === "Menunggu_Pembayaran",
        ),
        Menunggu_Konfirmasi_Pembayaran: orders.filter(
          (o) => o.status === "Menunggu_Konfirmasi_Pembayaran",
        ),
        confirmed: orders.filter((o) => o.status === "confirmed"),
        Dibatalkan: orders.filter((o) => o.status === "Dibatalkan"),
        all: orders,
      };

      res.json({
        success: true,
        data: grouped,
      });
    } catch (error) {
      next(error);
    }
  },

  // confirm payment
  confirmPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const userId = (req as any).user?.id;

      // Cek akses tenant
      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(id),
          room: {
            property: {
              tenant: { userId },
            },
          },
        },
        include: {
          user: true,
          room: {
            include: {
              property: true,
            },
          },
        },
      });

      if (!order) throw createCustomError(404, "Order tidak ditemukan");

      // Update status
      const updatedOrder = await orderRepository.updateStatus(
        parseInt(id),
        "confirmed",
        note || "Pembayaran dikonfirmasi",
      );

      // send email notification to user
      try {
        await sendMail(
          order.user.email,
          "Pembayaran Dikonfirmasi",
          "order-confirmed",
          {
            name: order.user.name,
            orderId: order.id,
            propertyName: order.room.property.name,
            address: order.room.property.address,
            checkIn: order.checkIn,
            checkOut: order.checkOut,
            totalPrice: order.totalPrice,
          },
        );
      } catch (emailError) {
        console.error("Gagal kirim email:", emailError);
      }

      res.json({
        success: true,
        message:
          "Pembayaran dikonfirmasi, email notifikasi telah dikirim ke user",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  // reject payment back to waiting for payment
  rejectPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!reason) throw createCustomError(400, "Alasan penolakan wajib diisi");

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(id),
          room: {
            property: {
              tenant: { userId },
            },
          },
        },
      });

      if (!order) throw createCustomError(404, "Order tidak ditemukan");

      // back to waiting for payment
      const updatedOrder = await orderRepository.updateStatus(
        parseInt(id),
        "Menunggu_Pembayaran",
        `Pembayaran ditolak: ${reason}`,
      );

      res.json({
        success: true,
        message: "Pembayaran ditolak, status kembali ke Menunggu Pembayaran",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  // cancel order by tenant
  cancelOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!reason)
        throw createCustomError(400, "Alasan pembatalan wajib diisi");

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(id),
          room: {
            property: {
              tenant: { userId },
            },
          },
        },
      });

      if (!order) throw createCustomError(404, "Order tidak ditemukan");

      // Check if payment proof exist
      if (order.paymentProof) {
        throw createCustomError(
          400,
          "Tidak dapat membatalkan order yang sudah upload bukti bayar",
        );
      }

      const updatedOrder = await orderRepository.updateStatus(
        parseInt(id),
        "Dibatalkan",
        `Dibatalkan oleh tenant: ${reason}`,
      );

      res.json({
        success: true,
        message: "Order berhasil dibatalkan",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },
};
