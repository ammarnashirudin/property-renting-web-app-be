import { prisma } from "../lib/prisma";

export const orderRepository = {
  // create order by user
  async create(data: {
    userId: number;
    roomId: number;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
  }) {
    return await prisma.order.create({
      data: {
        userId: data.userId,
        roomId: data.roomId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice: data.totalPrice,
        status: "Menunggu_Pembayaran",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 jam
      },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  // get orders by user id
  async findByUserId(userId: number) {
    return await prisma.order.findMany({
      where: { userId },
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
  },

  // get orders by tenant id
  async findByTenantId(tenantId: number) {
    return await prisma.order.findMany({
      where: {
        room: {
          property: {
            tenantId: tenantId,
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
  },

  // upload payment proof
  async uploadPaymentProof(id: number, paymentProofUrl: string) {
    return await prisma.order.update({
      where: { id },
      data: {
        paymentProof: paymentProofUrl,
        status: "Menunggu_Konfirmasi_Pembayaran",
      },
      include: {
        room: {
          include: {
            property: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  },

  // update order status by tenant
  async updateStatus(id: number, status: string, note?: string) {
    // Update order status
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    // add payment log if note exist (for confirmation or rejection)
    if (note) {
      let paymentStatus = "Pembayaran_Ditolak";
      if (status === "confirmed") paymentStatus = "Pembayaran_Diterima";
      if (status === "Dibatalkan" && order.paymentProof)
        paymentStatus = "Pembayaran_Dikembalikan";

      await prisma.paymentLog.create({
        data: {
          orderId: id,
          status: paymentStatus,
          note: note,
        },
      });
    }

    return order;
  },

  // find expired orders (for cron job)
  async findExpiredOrders() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return await prisma.order.findMany({
      where: {
        status: "Menunggu_Pembayaran",
        createdAt: {
          lt: oneHourAgo,
        },
        paymentProof: null,
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
  },

  // cancel expired orders (for cron job)
  async cancelExpiredOrders() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        status: "Menunggu_Pembayaran",
        createdAt: {
          lt: oneHourAgo,
        },
        paymentProof: null,
      },
      data: {
        status: "Dibatalkan",
      },
    });

    console.log(
      `[System] ${result.count} expired orders automatically cancelled`,
    );
    return result;
  },

  // get order by id
  async findById(id: number) {
    return await prisma.order.findUnique({
      where: { id },
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
                tenant: {
                  select: {
                    companyName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
        paymentLogs: {
          orderBy: { createdAt: "desc" },
        },
        reviews: true,
      },
    });
  },

  // get orders by tenant id and date range (for report)
  async findByDateRange(tenantId: number, startDate: Date, endDate: Date) {
    return await prisma.order.findMany({
      where: {
        room: {
          property: {
            tenantId: tenantId,
          },
        },
        status: "confirmed",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        room: {
          include: {
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
