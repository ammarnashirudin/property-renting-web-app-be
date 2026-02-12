import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { orderRepository } from "../repositories/order.repository";
import { createCustomError } from "../utils/customError";

export const orderController = {
  // Crete order
  createOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { roomId, checkIn, checkOut, totalPrice } = req.body;

      if (!userId) throw createCustomError(401, "Unauthorized");

      const order = await orderRepository.create({
        userId,
        roomId: parseInt(roomId),
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        totalPrice: parseFloat(totalPrice),
      });

      res.status(201).json({
        success: true,
        message:
          "Booking berhasil, silakan upload bukti pembayaran dalam 1 jam",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  //Payment proof upload
  uploadPaymentProof: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const file = req.file;
      const userId = (req as any).user?.id;

      // file must exist
      if (!file)
        throw createCustomError(400, "File bukti pembayaran wajib diupload");

      // Validasi ekstensi file (hanya .jpg, .jpeg, .png)
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw createCustomError(400, "Format file harus .jpg atau .png");
      }

      //max 1MB = 1048576 bytes
      if (file.size > 1048576) {
        throw createCustomError(400, "Ukuran file maksimal 1MB");
      }

      // Check user and order
      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(id),
          userId,
        },
      });

      if (!order) throw createCustomError(404, "Order tidak ditemukan");

      // Check time limit (1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (order.createdAt < oneHourAgo) {
        throw createCustomError(
          400,
          "Batas waktu upload bukti pembayaran telah habis",
        );
      }

      // order status
      if (order.status !== "Menunggu_Pembayaran") {
        throw createCustomError(
          400,
          `Tidak bisa upload bukti untuk order dengan status ${order.status}`,
        );
      }

      // Mock URL - ganti dengan Cloudinary nanti
      const paymentProofUrl = `/uploads/payments/${Date.now()}-${file.originalname}`;

      // Update order
      const updatedOrder = await orderRepository.uploadPaymentProof(
        parseInt(id),
        paymentProofUrl,
      );

      res.status(200).json({
        success: true,
        message:
          "Bukti pembayaran berhasil diupload, menunggu konfirmasi tenant",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get my order
  getMyOrders: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { startDate, endDate, orderNo, status } = req.query;

      const where: any = { userId };

      // Filter by order number
      if (orderNo) {
        where.id = parseInt(orderNo as string);
      }

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
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
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },

  //Cancel order by user
  cancelOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(id),
          userId,
        },
      });

      if (!order) throw createCustomError(404, "Order tidak ditemukan");

      // check if payment proof exist
      if (order.paymentProof) {
        throw createCustomError(
          400,
          "Tidak dapat membatalkan order yang sudah upload bukti bayar",
        );
      }

      // check time limit (1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (order.createdAt < oneHourAgo) {
        throw createCustomError(
          400,
          "Order sudah otomatis dibatalkan karena melewati batas waktu",
        );
      }

      const updatedOrder = await orderRepository.updateStatus(
        parseInt(id),
        "Dibatalkan",
        "Dibatalkan oleh user",
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
