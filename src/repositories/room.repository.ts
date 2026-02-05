import prisma from "../lib/prisma";

export const roomRepository = {
  create: (payload: any) => prisma.room.create({ data: payload }),

  update: (id: number, payload: any) =>
    prisma.room.update({ where: { id }, data: payload }),

  remove: (id: number) => prisma.room.delete({ where: { id } }),

  findById: (id: number) =>
    prisma.room.findUnique({
      where: { id },
      include: {
        availabilities: true,
        peakRates: true,
        property: true,
      },
    }),

  findByProperty: (propertyId: number) =>
    prisma.room.findMany({
      where: { propertyId },
      include: { availabilities: true, peakRates: true },
      orderBy: { id: "desc" },
    }),
};
