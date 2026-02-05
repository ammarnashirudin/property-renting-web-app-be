import { userRepository } from "../repositories/user.repository";
import { cloudinaryUpload, cloudinaryRemove } from "../utils/cloudinary";
import { createCustomError } from "../utils/customError";
import { authService } from "./auth.service";
import { compareSync, genSaltSync, hashSync } from "bcrypt";



function validateImage(file: Express.Multer.File) {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  if (!allowed.includes(file.mimetype)) {
    throw createCustomError(400, "File harus jpg/jpeg/png/gif");
  }
  if (file.size > 1024 * 1024) {
    throw createCustomError(400, "Ukuran file maksimal 1MB");
  }
}

export const userService = {
  async getProfile(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw createCustomError(404, "User tidak ditemukan");

    return user;
  },

  async updateProfile(
    userId: number,
    body: { name?: string },
    file?: Express.Multer.File
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw createCustomError(404, "User tidak ditemukan");

    let profileImage = user.profileImage;

    if (file) {
      validateImage(file);

      const upload = await cloudinaryUpload(file, "profile");
      if (user.profileImage) await cloudinaryRemove(user.profileImage);

      profileImage = upload.secure_url;
    }

    return await userRepository.updateUser(userId, {
      ...(body.name ? { name: body.name } : {}),
      profileImage,
    });
  },

  async updateEmail(userId: number, newEmail: string) {
    const exist = await userRepository.findByEmail(newEmail);
    if (exist) throw createCustomError(400, "Email sudah digunakan user lain");

    const user = await userRepository.findById(userId);
    if (!user) throw createCustomError(404, "User tidak ditemukan");

  
    await userRepository.updateUser(userId, {
      email: newEmail,
      isVerified: false,
    });

        
    await authService.resendVerificationByEmail(newEmail);

    return { message: "Email berhasil diupdate, silakan verifikasi ulang" };
  },
  

async updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const user = await userRepository.findById(userId);
  if (!user) throw createCustomError(404, "User tidak ditemukan");

  if (user.provider && user.provider !== "EMAIL") {
    throw createCustomError(
      400,
      "User social login tidak bisa mengganti password"
    );
  }

  if (!user.password || !compareSync(currentPassword, user.password)) {
    throw createCustomError(400, "Password lama salah");
  }

  if (newPassword.length < 8) {
    throw createCustomError(400, "Password minimal 8 karakter");
  }

  const hashed = hashSync(newPassword, genSaltSync(10));

  await userRepository.updateUser(userId, { password: hashed });

  return { message: "Password berhasil diupdate" };
},

};
