import  prisma  from "../lib/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  createUser(data: {
    role: "USER" | "TENANT";
    name: string;
    email: string;
    provider?: string | null;
    providerAccountId?: string;
    profileImage?: string;
  }) {
    console.log("data masuk repos");
    console.log(data);
    
    
    return prisma.user.create({
      data: {
        role: data.role,
        name: data.name,
        email: data.email,
        provider: data.provider ?? null,
        providerAccountId: data.providerAccountId ?? null,
        profileImage: data.profileImage ?? null,
        isVerified: data.provider ? true : false, 
      },
    });
  },

  updateUser(id: number, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
};

