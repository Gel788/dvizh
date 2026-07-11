#!/usr/bin/env node
/** Заполнить профиль @gel888 мок-данными. VPS: node scripts/fill-albert-profile.mjs */
import pg from "pg";

const username = process.env.PROFILE_USERNAME ?? "gel888";

const mock = {
  bio: "Создаю ДВЖ — приложение для привычек, движения и жизни в ритме. Бегаю по утрам, смотрю кино и верю в маленькие шаги каждый день.",
  city: "Москва",
  district: "Развилка",
  telegram: "@gel888",
  vk: "vk.com/gel888",
  youtube: "youtube.com/@dvizhapp",
  website: "https://www.flroal.ru",
  interests: JSON.stringify(["Здоровье", "Привычки", "Движение", "Кино", "Бег"]),
};

const dbUrl = process.env.DATABASE_URL ?? "postgresql://dvizh:dvizh_test_2026@localhost:5432/dvizh?schema=public";
const client = new pg.Client({ connectionString: dbUrl });

await client.connect();
const res = await client.query(
  `UPDATE "User" SET
    bio = $1, city = $2, district = $3,
    telegram = $4, vk = $5, youtube = $6, website = $7, interests = $8
   WHERE username = $9
   RETURNING id, name, username, bio, city, district, telegram, vk, youtube, website, interests`,
  [mock.bio, mock.city, mock.district, mock.telegram, mock.vk, mock.youtube, mock.website, mock.interests, username],
);

if (!res.rowCount) {
  console.error(`User @${username} not found`);
  process.exit(1);
}

await client.query(
  `INSERT INTO "PrivacySettings" ("userId", "defaultDiary", "defaultWishlist", "defaultMedia", "profileInSearch", "locationPrecision", "showLevel")
   VALUES ($1, 'FRIENDS', 'FRIENDS', 'FRIENDS', true, 'district', true)
   ON CONFLICT ("userId") DO UPDATE SET
     "defaultDiary" = 'FRIENDS',
     "defaultWishlist" = 'FRIENDS',
     "defaultMedia" = 'FRIENDS',
     "profileInSearch" = true,
     "locationPrecision" = 'district',
     "showLevel" = true`,
  [res.rows[0].id],
);

console.log("Profile filled for", res.rows[0]);
await client.end();
