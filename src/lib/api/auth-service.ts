import { db } from "@/lib/db";
import {
  hashPassword,
  signAccessToken,
  verifyPassword,
  findUserByEmail,
  normalizeEmail,
  type SessionUser,
} from "@/lib/auth";
import { presentProfileUser } from "@/lib/profile-fields";

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  username: true,
  avatar: true,
  coverImage: true,
  bio: true,
  city: true,
  district: true,
  telegram: true,
  vk: true,
  youtube: true,
  website: true,
  interests: true,
  lat: true,
  lng: true,
  verified: true,
  reputation: true,
  role: true,
} as const;

export type AuthPayload = {
  token: string;
  user: SessionUser;
};

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<AuthPayload | { error: string; code: string }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return { error: "Email и пароль обязательны", code: "EMPTY" };
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Неверный email или пароль", code: "INVALID_CREDENTIALS" };
  }

  const token = await signAccessToken(user.id);
  const { password: _, ...publicUser } = user;
  return { token, user: presentProfileUser(publicUser) as SessionUser };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  username: string;
  city?: string;
}): Promise<AuthPayload | { error: string; code: string }> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const city = (input.city ?? "Москва").trim() || "Москва";

  if (!email || !input.password || !name || !username) {
    return { error: "Заполните все обязательные поля", code: "EMPTY" };
  }

  const exists = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { username },
      ],
    },
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
  return { token, user: presentProfileUser(user) as SessionUser };
}
