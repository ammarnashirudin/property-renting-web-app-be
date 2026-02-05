import prisma from "../lib/prisma";

export const availabilityRepository = {
  set: async (roomId: number, date: Date, isAvailable: boolean) => {
    const exist = await prisma.roomAvailability.findFirst({
      where: { roomId, date },
    });

    if (exist) {
      return prisma.roomAvailability.update({
        where: { id: exist.id },
        data: { isAvailable },
      });
    }

    return prisma.roomAvailability.create({
      data: { roomId, date, isAvailable },
    });
  },
};
