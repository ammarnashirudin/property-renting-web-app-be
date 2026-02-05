import { genSaltSync, hashSync, compareSync } from "bcrypt";
import crypto from "crypto";
import { userRepository } from "../repositories/user.repository";
import { tenantRepository } from "../repositories/tenant.repository";
import { emailTokenRepository } from "../repositories/emailToken.repository";
import { passwordResetTokenRepository } from "@/repositories/passwordResetToken.repository";
import { generateToken } from "../helpers/token";
import { sendMail } from "./email.service";
import { APP_BASE_URL } from "../configs/env.configs";
import { createCustomError } from "../utils/customError";
import { OAuth2Client } from "google-auth-library";
import { use } from "react";


function generateRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
export const authService = {
  
  async registerUser(body: { name: string; email: string }) {
    const exist = await userRepository.findByEmail(body.email);
    if (exist) throw createCustomError(400, "Email sudah terdaftar");

    const user = await userRepository.createUser({
      role: "USER",
      name: body.name,
      email: body.email,
      provider: "EMAIL",
    });

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await emailTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const verifyUrl = `${APP_BASE_URL}/verify-email?token=${token}`;

    await sendMail(user.email, "Verifikasi Email & Set Password", "registration", {
      name: user.name,
      email: user.email,
      verifyUrl,
    });

    return { message: "Registrasi berhasil, cek email untuk verifikasi" };
  },

  async registerTenant(body: {
    name: string;
    email: string;
    companyName: string;
    phoneNumber: string;
  }) {
    const exist = await userRepository.findByEmail(body.email);
    if (exist) throw createCustomError(400, "Email sudah terdaftar");

    const user = await userRepository.createUser({
      role: "TENANT",
      name: body.name,
      email: body.email,
      provider: "EMAIL",
    });

    await tenantRepository.createTenant({
      userId: user.id,
      companyName: body.companyName,
      phoneNumber: body.phoneNumber,
    });

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await emailTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const verifyUrl = `${APP_BASE_URL}/verify-email?token=${token}`;

    await sendMail(user.email, "Verifikasi Email & Set Password", "registration", {
      name: user.name,
      email: user.email,
      verifyUrl,
    });

    return { message: "Registrasi tenant berhasil, cek email untuk verifikasi" };
  },

  async resendVerificationByEmail(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw createCustomError(404, "User tidak ditemukan");

    if (user.isVerified)
      throw createCustomError(400, "User sudah terverifikasi");

    await emailTokenRepository.invalidateAllUserTokens(user.id);

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await emailTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const verifyUrl = `${APP_BASE_URL}/verify-email?token=${token}`;

    await sendMail(user.email, "Verifikasi Email", "registration", {
      name: user.name,
      email: user.email,
      verifyUrl,
    });
  },


  async verifyEmailAndSetPassword(body: { token: string; password: string }) {
    const tokenData = await emailTokenRepository.findValidToken(body.token);

    if (!tokenData) throw createCustomError(400, "Token tidak valid");
    if (tokenData.used) throw createCustomError(400, "Token sudah digunakan");
    if (!tokenData.expiresAt || tokenData.expiresAt < new Date())
      throw createCustomError(400, "Token sudah expired");

    const user = tokenData.user;
    if (user.isVerified) throw createCustomError(400, "User sudah terverifikasi");

    const salt = genSaltSync(10);
    const hashed = hashSync(body.password, salt);
    
    if (!body.password || body.password.length < 8) {
    throw createCustomError(400, "Password minimal 8 karakter");}

    await userRepository.updateUser(user.id, {
      password: hashed,
      isVerified: true,
    });


    await emailTokenRepository.markUsed(tokenData.id);

    return { message: "Verifikasi berhasil, silakan login kembali" };
  },

  async login(body: { email: string; password: string }) {
    const user = await userRepository.findByEmail(body.email);
    if (!user) throw createCustomError(400, "Email atau password salah");

    if (!user.password) throw createCustomError(400, "User ini belum set password");

    const match = compareSync(body.password, user.password);
    if (!match) throw createCustomError(400, "Email atau password salah");

    if (!user.isVerified) throw createCustomError(403, "Akun belum terverifikasi");

    const token = generateToken(
      { id: user.id, role: user.role, email: user.email },
      "7d"
    );

    return {
      message: "Login berhasil",
      token,
      role: user.role,
      isVerified : user.isVerified,
    };
  },

  async requestResetPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw createCustomError(404, "User tidak ditemukan");

    if (user.provider && user.provider !== "EMAIL") {
      throw createCustomError(
        400,
        "Reset password hanya untuk user email/password"
      );
    }

    if (!user.password) {
      throw createCustomError(
        400,
        "User belum punya password (belum verifikasi)"
      );
    }

    await passwordResetTokenRepository.invalidateAllUserTokens(user.id);

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetUrl = `${APP_BASE_URL}/reset-password-confirm?token=${token}`;

    await sendMail(user.email, "Reset Password", "reset-password", {
      resetUrl,
    });

    return { message: "Link reset password dikirim ke email" };
  },

  async confirmResetPassword(body: { token: string; newPassword: string }) {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw createCustomError(400, "Password minimal 8 karakter");
    }

    const tokenData =
      await passwordResetTokenRepository.findValidToken(body.token);

    if (!tokenData)
      throw createCustomError(400, "Token tidak valid atau expired");

    const hashed = hashSync(body.newPassword, genSaltSync(10));

    await userRepository.updateUser(tokenData.user.id, {
      password: hashed,
    });

    await passwordResetTokenRepository.markUsed(tokenData.id);

    return { message: "Password berhasil direset, silakan login kembali" };
  },

  async socialAuth(body: {
    role: "USER" | "TENANT";
    provider: "google" | "facebook";
    token : string;
  }) {
    console.log("data masuk auth.service");
    console.log(body);
    
    
  let email: string;
  let name: string;
  let profileImage: string | undefined;
  let providerAccountId: string | undefined;

  if (body.provider === "google") {
    const ticket = await googleClient.verifyIdToken({
      idToken: body.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw createCustomError(400, "Invalid Google token");
    }

    email = payload.email;
    name = payload.name || "Google User";
    profileImage = payload.picture;
    providerAccountId = payload.sub
  } else {
    throw createCustomError(400, "Provider not supported");
  }

  let user = await userRepository.findByEmail(email);

  if (!user) {
    user = await userRepository.createUser({
      role: body.role,
      name,
      email,
      provider: body.provider.toUpperCase(),
      providerAccountId,
      profileImage,
    });
  }

  if (user.role !== body.role) {
    throw createCustomError(
      400,
      `Email ini sudah terdaftar sebagai ${user.role}`
    );
  }

  const token = generateToken(
    { id: user.id, role: user.role, email: user.email },
    "1d"
  );

  return {
    message: "Social login berhasil",
    token,
    role: user.role,
  };
}

    
};

