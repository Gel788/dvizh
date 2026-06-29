import { db } from "@/lib/db";
import {
  hashPassword,
  signAccessToken,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  username: true,
  avatar: true,
  city: true,
  district: true,
  lat: true,
  lng: true,
  verified: true,
  reputation: true,
} as const;

export type AuthPayload = {
  token: string;
  user: SessionUser;
};

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<AuthPayload | { error: string; code: string }> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) {
    return { error: "Email и пароль обязательны", code: "EMPTY" };
  }

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Неверный email или пароль", code: "INVALID_CREDENTIALS" };
  }

  const token = await signAccessToken(user.id);
  const { password: _, ...publicUser } = user;
  return { token, user: publicUser };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  username: string;
  city?: string;
}): Promise<AuthPayload | { error: string; code: string }> {
  const email = input.email.trim();
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const city = (input.city ?? "Москва").trim() || "Москва";

  if (!email || !input.password || !name || !username) {
    return { error: "Заполните все обязательные поля", code: "EMPTY" };
  }

  const exists = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (exists) {
    return { error: "Email или username уже заняты", code: "EXISTS" };
  }

  const user = await db.user.create({
    data: {
      email,
      password: await hashPassword(input.password),
      name,
      username,
      city,
    },
    select: USER_PUBLIC_SELECT,
  });

  const token = await signAccessToken(user.id);
  return { token, user };
}
