import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createCustomError } from "../utils/customError";

export const reportController = {
  // SALES REPORTS
  getSalesReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (userRole !== "TENANT") {
        throw createCustomError(
          403,
          "Hanya tenant yang dapat mengakses laporan penjualan",
        );
      }

      const tenant = await prisma.tenant.findUnique({
        where: { userId },
      });

      if (!tenant) throw createCustomError(403, "Tenant tidak ditemukan");

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const orders = await prisma.order.findMany({
        where: {
          room: {
            property: {
              tenantId: tenant.id,
            },
          },
          status: "confirmed",
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          room: {
            include: {
              property: {
                select: { name: true, address: true },
              },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.totalPrice,
        0,
      );
      const totalOrders = orders.length;

      res.json({
        success: true,
        data: {
          period: { start, end },
          summary: {
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          },
          orders,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Property reports
  getPropertyReport: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (userRole !== "TENANT") {
        throw createCustomError(
          403,
          "Hanya tenant yang dapat mengakses laporan properti",
        );
      }

      const tenant = await prisma.tenant.findUnique({
        where: { userId },
      });

      if (!tenant) throw createCustomError(403, "Tenant tidak ditemukan");

      const properties = await prisma.property.findMany({
        where: { tenantId: tenant.id },
        include: {
          rooms: {
            include: {
              orders: {
                where: { status: "confirmed" },
              },
            },
          },
          reviews: true,
        },
      });

      const report = properties.map((property) => {
        const totalRooms = property.rooms.length;
        const totalBookings = property.rooms.reduce(
          (sum, room) => sum + room.orders.length,
          0,
        );
        const totalRevenue = property.rooms.reduce(
          (sum, room) =>
            sum + room.orders.reduce((s, o) => s + o.totalPrice, 0),
          0,
        );

        const averageRating =
          property.reviews.length > 0
            ? property.reviews.reduce((sum, r) => sum + r.rating, 0) /
              property.reviews.length
            : 0;

        return {
          propertyId: property.id,
          propertyName: property.name,
          propertyImage: property.image,
          propertyAddress: property.address,
          totalRooms,
          totalBookings,
          totalRevenue,
          averageRating,
          reviewsCount: property.reviews.length,
        };
      });

      res.json({
        success: true,
        data: {
          properties: report,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
