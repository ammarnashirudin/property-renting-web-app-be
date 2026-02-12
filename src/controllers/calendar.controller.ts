import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createCustomError } from "../utils/customError";

export const calendarController = {
  // get tenant's property calendar
  getPropertyCalendar: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { propertyId, month, year } = req.query;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (userRole !== "TENANT") {
        throw createCustomError(
          403,
          "Hanya tenant yang dapat mengakses kalender",
        );
      }

      // check if property belongs to tenant
      const property = await prisma.property.findFirst({
        where: {
          id: parseInt(propertyId as string),
          tenant: {
            userId: userId,
          },
        },
        include: {
          rooms: {
            include: {
              orders: {
                where: {
                  status: {
                    in: ["confirmed", "Menunggu_Konfirmasi_Pembayaran"],
                  },
                },
              },
            },
          },
        },
      });

      if (!property) throw createCustomError(404, "Property tidak ditemukan");

      // Calculate start and end date of the month
      const startDate = new Date(
        parseInt(year as string),
        parseInt(month as string) - 1,
        1,
      );
      const endDate = new Date(
        parseInt(year as string),
        parseInt(month as string),
        0,
      );

      // Get all bookings for this property in the month
      const bookings = await prisma.order.findMany({
        where: {
          room: {
            propertyId: parseInt(propertyId as string),
          },
          status: {
            in: ["confirmed", "Menunggu_Konfirmasi_Pembayaran"],
          },
          OR: [
            {
              checkIn: { lte: endDate },
              checkOut: { gte: startDate },
            },
          ],
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          room: true,
        },
        orderBy: {
          checkIn: "asc",
        },
      });

      // calendar data per day
      const calendarData = [];
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const dayBookings = bookings.filter((b) => {
          const checkIn = new Date(b.checkIn).toISOString().split("T")[0];
          const checkOut = new Date(b.checkOut).toISOString().split("T")[0];
          return dateStr >= checkIn && dateStr < checkOut;
        });

        calendarData.push({
          date: dateStr,
          day: d.getDate(),
          bookings: dayBookings,
          totalBookings: dayBookings.length,
          isAvailable: dayBookings.length < property.rooms.length,
        });
      }

      // Summary per room
      const roomSummary = property.rooms.map((room) => {
        const roomBookings = bookings.filter((b) => b.roomId === room.id);
        const bookedDays = roomBookings.reduce((total, booking) => {
          const days = Math.ceil(
            (new Date(booking.checkOut).getTime() -
              new Date(booking.checkIn).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return total + days;
        }, 0);

        return {
          roomId: room.id,
          roomName: room.name,
          totalBookings: roomBookings.length,
          bookedDays,
          availableDays:
            new Date(
              parseInt(year as string),
              parseInt(month as string),
              0,
            ).getDate() - bookedDays,
          occupancyRate: Math.round(
            (bookedDays /
              new Date(
                parseInt(year as string),
                parseInt(month as string),
                0,
              ).getDate()) *
              100,
          ),
        };
      });

      res.json({
        success: true,
        data: {
          property: {
            id: property.id,
            name: property.name,
            address: property.address,
          },
          month: parseInt(month as string),
          year: parseInt(year as string),
          totalRooms: property.rooms.length,
          calendar: calendarData,
          roomSummary: roomSummary,
          totalBookings: bookings.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get available rooms
  getAvailableRooms: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { propertyId, checkIn, checkOut } = req.query;

      const checkInDate = new Date(checkIn as string);
      const checkOutDate = new Date(checkOut as string);

      // searhh rooms with no bookings in the date range
      const rooms = await prisma.room.findMany({
        where: {
          propertyId: parseInt(propertyId as string),
        },
        include: {
          orders: {
            where: {
              status: {
                in: ["confirmed", "Menunggu_Konfirmasi_Pembayaran"],
              },
              OR: [
                {
                  checkIn: { lt: checkOutDate },
                  checkOut: { gt: checkInDate },
                },
              ],
            },
          },
        },
      });

      //filter rooms that have no bookings in the date range
      const availableRooms = rooms.filter((room) => room.orders.length === 0);

      res.json({
        success: true,
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalRooms: rooms.length,
          availableRooms: availableRooms.length,
          rooms: availableRooms,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
