import { PrismaClient, PostType, AnnouncementCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { generateAchievementCatalog } from "../src/lib/achievements-generator";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.notification.deleteMany();
  await prisma.taskCopy.deleteMany();
  await prisma.diaryTask.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievementDef.deleteMany();
  await prisma.duelParticipant.deleteMany();
  await prisma.duel.deleteMany();
  await prisma.sharedGoalItem.deleteMany();
  await prisma.sharedGoalMember.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.privacySettings.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.challengeReport.deleteMany();
  await prisma.challengeParticipant.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.going.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tagFollow.deleteMany();
  await prisma.districtFollow.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("demo1234", 10);
  const adminPassword = await bcrypt.hash("admin1234", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@dvizh.app",
        password: adminPassword,
        name: "Администратор",
        username: "admin",
        bio: "Центр управления ДВИЖ",
        city: "Москва",
        district: "Тверской",
        verified: true,
        reputation: 9999,
        role: "ADMIN",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=admin",
      },
    }),
    prisma.user.create({
      data: {
        email: "anna@dvizh.app",
        password,
        name: "Анна Козлова",
        username: "anna_run",
        bio: "Бегаю по Хамовникам каждое утро. Организую локальные челленджи.",
        city: "Москва",
        district: "Хамовники",
        lat: 55.7262,
        lng: 37.5693,
        verified: true,
        reputation: 1240,
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=anna",
      },
    }),
    prisma.user.create({
      data: {
        email: "max@dvizh.app",
        password,
        name: "Макс Волков",
        username: "max_vol",
        bio: "Волонтёр, кофе-энтузиаст, люблю районные ивенты.",
        city: "Москва",
        district: "Сокол",
        lat: 55.805,
        lng: 37.515,
        verified: true,
        reputation: 890,
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=max",
      },
    }),
    prisma.user.create({
      data: {
        email: "daria@dvizh.app",
        password,
        name: "Дарья Смирнова",
        username: "daria_city",
        bio: "Кафе-челленджи и городские прогулки.",
        city: "Москва",
        district: "Арбат",
        lat: 55.752,
        lng: 37.592,
        reputation: 560,
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=daria",
      },
    }),
    prisma.user.create({
      data: {
        email: "ivan@dvizh.app",
        password,
        name: "Иван Петров",
        username: "ivan_p",
        bio: "Теннис, спорт, ищу напарников.",
        city: "Москва",
        district: "Тверской",
        lat: 55.76,
        lng: 37.61,
        reputation: 320,
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=ivan",
      },
    }),
    prisma.user.create({
      data: {
        email: "demo@dvizh.app",
        password,
        name: "Демо Пользователь",
        username: "demo",
        bio: "Тестовый аккаунт — войди и попробуй всё!",
        city: "Москва",
        district: "Хамовники",
        lat: 55.73,
        lng: 37.57,
        reputation: 150,
        role: "ADMIN",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=demo",
      },
    }),
  ]);

  const [admin, anna, max, daria, ivan, demo] = users;

  await prisma.follow.createMany({
    data: [
      { followerId: demo.id, followingId: anna.id },
      { followerId: demo.id, followingId: max.id },
      { followerId: demo.id, followingId: daria.id },
      { followerId: anna.id, followingId: max.id },
      { followerId: max.id, followingId: anna.id },
    ],
  });

  await prisma.districtFollow.createMany({
    data: [
      { userId: demo.id, district: "Хамовники", city: "Москва" },
      { userId: demo.id, district: "Сокол", city: "Москва" },
    ],
  });

  await prisma.tagFollow.createMany({
    data: [
      { userId: demo.id, tag: "бег" },
      { userId: demo.id, tag: "волонтёрство" },
    ],
  });

  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        name: "Первый шаг",
        description: "Выполнил первый челлендж",
        icon: "footprints",
        color: "#D94F2B",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Локальный герой",
        description: "Топ-3 в районе за месяц",
        icon: "trophy",
        color: "#1B6B6B",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Организатор",
        description: "Создал 5+ ивентов",
        icon: "calendar",
        color: "#C4A035",
      },
    }),
  ]);

  await prisma.userBadge.createMany({
    data: [
      { userId: anna.id, badgeId: badges[0].id },
      { userId: anna.id, badgeId: badges[1].id },
      { userId: max.id, badgeId: badges[0].id },
      { userId: max.id, badgeId: badges[2].id },
    ],
  });

  const activityPost = await prisma.post.create({
    data: {
      type: PostType.ACTIVITY,
      authorId: anna.id,
      content:
        "5 км по набережной до рассвета — лучший старт дня. Кто завтра со мной в 6:30 у метро Спортивная?",
      city: "Москва",
      district: "Хамовники",
      lat: 55.7262,
      lng: 37.5693,
      tags: "бег,утро,хамовники",
    },
  });

  const challengePost = await prisma.post.create({
    data: {
      type: PostType.CHALLENGE,
      authorId: anna.id,
      title: "30 дней без лифта",
      content:
        "Поднимаемся пешком весь июнь. Отчитываемся фото лестницы + этаж. Мотивация — здоровье и соседи!",
      city: "Москва",
      district: "Хамовники",
      lat: 55.7262,
      lng: 37.5693,
      radiusKm: 10,
      tags: "здоровье,челлендж",
      challenge: {
        create: {
          goalCount: 30,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          rules: "Каждый день — фото отчёт. Пропуск = streak сбрасывается.",
          isSeasonal: true,
          seasonName: "Июньский вызов",
          isGlobal: true,
        },
      },
    },
    include: { challenge: true },
  });

  const districtChallengePost = await prisma.post.create({
    data: {
      type: PostType.CHALLENGE,
      authorId: demo.id,
      title: "10 000 шагов по Хамовникам",
      content: "Каждый день фиксируем шаги в районе. Кто наберёт больше за неделю — получает бейдж района.",
      city: "Москва",
      district: "Хамовники",
      lat: 55.73,
      lng: 37.57,
      tags: "шаги,район,здоровье",
      challenge: {
        create: {
          goalCount: 10000,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          rules: "Шаги считаются только в радиусе района.",
        },
      },
    },
    include: { challenge: true },
  });

  const friendChallengePost = await prisma.post.create({
    data: {
      type: PostType.CHALLENGE,
      authorId: max.id,
      title: "Серия субботников",
      content: "Каждую субботу — час волонтёрства. Отмечаемся фото с площадки.",
      city: "Москва",
      district: "Сокол",
      tags: "друзья,волонтёрство",
      challenge: {
        create: {
          goalCount: 8,
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { challenge: true },
  });

  const businessChallengePost = await prisma.post.create({
    data: {
      type: PostType.CHALLENGE,
      authorId: daria.id,
      title: "5 кофе — шестой в подарок",
      content:
        "Заходи в Coffee Room на Арбате, отмечайся в челлендже. После 5 визитов — кофе бесплатно.",
      city: "Москва",
      district: "Арбат",
      lat: 55.752,
      lng: 37.592,
      tags: "кофе,бизнес",
      challenge: {
        create: {
          goalCount: 5,
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isBusiness: true,
          businessName: "Coffee Room",
          reward: "Бесплатный кофе на 6-й визит",
        },
      },
    },
    include: { challenge: true },
  });

  const announcePost = await prisma.post.create({
    data: {
      type: PostType.ANNOUNCEMENT,
      authorId: ivan.id,
      title: "Ищу напарника на теннис",
      content:
        "Уровень средний, играю по вторникам и четвергам в 19:00. Корт у метро Белорусская.",
      city: "Москва",
      district: "Тверской",
      lat: 55.76,
      lng: 37.61,
      category: AnnouncementCategory.SPORT,
      contactInfo: "@ivan_p",
      tags: "теннис,спорт",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const volunteerPost = await prisma.post.create({
    data: {
      type: PostType.ANNOUNCEMENT,
      authorId: max.id,
      title: "Субботник в парке Сокольники",
      content:
        "Собираемся в 10:00 у главного входа. Перчатки и пакеты дадим. После — чай на скамейках.",
      city: "Москва",
      district: "Сокол",
      lat: 55.805,
      lng: 37.515,
      category: AnnouncementCategory.EVENT,
      tags: "волонтёрство,экология",
    },
  });

  const maxActivity = await prisma.post.create({
    data: {
      type: PostType.ACTIVITY,
      authorId: max.id,
      content:
        "Раздал 20 обедов вместе с «Едим вместе». Спасибо всем, кто пришёл помогать — вы огонь!",
      city: "Москва",
      district: "Сокол",
      lat: 55.805,
      lng: 37.515,
      tags: "волонтёрство,еда",
    },
  });

  await prisma.challengeParticipant.createMany({
    data: [
      { challengeId: challengePost.challenge!.id, userId: demo.id, progress: 12, streak: 5 },
      { challengeId: challengePost.challenge!.id, userId: max.id, progress: 8, streak: 3 },
      { challengeId: districtChallengePost.challenge!.id, userId: demo.id, progress: 4200, streak: 4 },
      { challengeId: districtChallengePost.challenge!.id, userId: anna.id, progress: 6100, streak: 6 },
      { challengeId: friendChallengePost.challenge!.id, userId: max.id, progress: 3, streak: 3 },
      { challengeId: friendChallengePost.challenge!.id, userId: anna.id, progress: 2, streak: 2 },
      { challengeId: friendChallengePost.challenge!.id, userId: demo.id, progress: 1, streak: 1 },
      { challengeId: businessChallengePost.challenge!.id, userId: demo.id, progress: 2, streak: 2 },
      { challengeId: businessChallengePost.challenge!.id, userId: daria.id, progress: 5, streak: 5 },
    ],
  });

  await prisma.challengeReport.createMany({
    data: [
      {
        challengeId: challengePost.challenge!.id,
        userId: demo.id,
        content: "День 12 — 9 этаж без лифта!",
        lat: 55.73,
        lng: 37.57,
      },
      {
        challengeId: businessChallengePost.challenge!.id,
        userId: demo.id,
        content: "Визит #2 — латте и круассан",
        lat: 55.752,
        lng: 37.592,
      },
    ],
  });

  await prisma.like.createMany({
    data: [
      { postId: activityPost.id, userId: demo.id },
      { postId: activityPost.id, userId: max.id },
      { postId: challengePost.id, userId: demo.id },
      { postId: maxActivity.id, userId: anna.id },
      { postId: volunteerPost.id, userId: demo.id },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { postId: activityPost.id, userId: demo.id, content: "Завтра буду! Беру светоотражающую жилетку." },
      { postId: activityPost.id, userId: max.id, content: "+1, выхожу из Сокола к 6:20" },
      { postId: challengePost.id, userId: max.id, content: "Уже 8 дней подряд, присоединяйтесь!" },
    ],
  });

  await prisma.going.createMany({
    data: [
      { postId: volunteerPost.id, userId: demo.id },
      { postId: volunteerPost.id, userId: anna.id },
      { postId: activityPost.id, userId: demo.id },
    ],
  });

  const club = await prisma.club.create({
    data: {
      name: "Бегуны Хамовников",
      description: "Утренние пробежки, марафоны и мотивация. Открытый клуб для всех уровней.",
      city: "Москва",
      district: "Хамовники",
      creatorId: anna.id,
      members: {
        create: [
          { userId: anna.id, role: "ADMIN" },
          { userId: demo.id, role: "MEMBER" },
          { userId: max.id, role: "MEMBER" },
        ],
      },
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: "Городские волонтёры",
      description: "Субботники, помощь соседям, благотворительные акции.",
      city: "Москва",
      district: "Сокол",
      creatorId: max.id,
      members: {
        create: [
          { userId: max.id, role: "ADMIN" },
          { userId: demo.id, role: "MEMBER" },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: "Майский забег района",
      description: "5 км по Хамовникам + afterparty. Регистрация в клубе.",
      organizerId: anna.id,
      clubId: club.id,
      city: "Москва",
      district: "Хамовники",
      lat: 55.7262,
      lng: 37.5693,
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isSeasonal: true,
      attendees: {
        create: [{ userId: demo.id }, { userId: max.id }],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: "Встреча клуба волонтёров",
      description: "Планируем июльские акции. Кофе и план на доске.",
      organizerId: max.id,
      clubId: club2.id,
      city: "Москва",
      district: "Сокол",
      lat: 55.805,
      lng: 37.515,
      startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      attendees: { create: [{ userId: demo.id }] },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: demo.id,
        type: "CHALLENGE_NEARBY",
        title: "Новый челлендж рядом",
        body: "«30 дней без лифта» в Хамовниках — 2 км от вас",
        link: `/post/${challengePost.id}`,
      },
      {
        userId: demo.id,
        type: "FRIEND_COMPLETED",
        title: "Макс выполнил отчёт",
        body: "8-й день челленджа без лифта",
        link: `/post/${challengePost.id}`,
      },
      {
        userId: demo.id,
        type: "LIKE",
        title: "Анна лайкнула ваш комментарий",
        body: "«Завтра буду!»",
        link: `/post/${activityPost.id}`,
      },
      {
        userId: demo.id,
        type: "EVENT_REMINDER",
        title: "Ивент через 3 дня",
        body: "Встреча клуба волонтёров",
        link: "/events",
      },
    ],
  });

  await prisma.achievementDef.createMany({
    data: generateAchievementCatalog().map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      category: a.category,
      icon: a.icon,
      color: a.color,
      threshold: a.threshold,
    })),
  });

  await prisma.userProfile.createMany({
    data: users.map((u, i) => ({
      userId: u.id,
      xp: [9999, 3520, 2100, 890, 450, 1200][i] ?? 500,
      level: [20, 14, 11, 8, 5, 10][i] ?? 5,
      tasksCompleted: [100, 42, 28, 15, 8, 12][i] ?? 5,
      tasksCreated: [50, 20, 12, 8, 4, 10][i] ?? 3,
      mascotVariant: i % 3,
      mascotStage: Math.min(3, Math.floor(i / 2)),
    })),
  });

  await prisma.privacySettings.createMany({
    data: users.map((u) => ({ userId: u.id })),
  });

  await prisma.friendship.createMany({
    data: [
      { requesterId: demo.id, addresseeId: anna.id, status: "ACCEPTED" },
      { requesterId: demo.id, addresseeId: max.id, status: "ACCEPTED" },
      { requesterId: daria.id, addresseeId: demo.id, status: "ACCEPTED" },
    ],
  });

  const demoTasks = await Promise.all([
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Пробежка 5 км перед работой", period: "TODAY", hashtag: "спорт", streak: 14, sortOrder: 0, dueDate: new Date() } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Позвонить маме", period: "TODAY", hashtag: "семья", sortOrder: 1, dueDate: new Date() } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "20 страниц «Дюны»", period: "TODAY", hashtag: "книги", streak: 6, sortOrder: 2, dueDate: new Date() } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Встреча с Лёшей в 14:00", period: "TOMORROW", hashtag: "встречи", sortOrder: 0, dueDate: new Date(Date.now() + 86400000) } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Сходить в зал 3 раза", period: "WEEK", hashtag: "спорт", sortOrder: 0, dueDate: new Date(Date.now() + 3 * 86400000) } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Пробежать полумарафон", period: "YEAR", hashtag: "спорт", sortOrder: 0 } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Прочитать 24 книги", period: "YEAR", hashtag: "книги", checklistJson: JSON.stringify(["7 из 24"]), sortOrder: 1 } }),
    prisma.diaryTask.create({ data: { userId: demo.id, title: "Выучить испанский до B1", period: "DREAM", hashtag: "языки", sortOrder: 0 } }),
    prisma.diaryTask.create({
      data: {
        userId: anna.id,
        title: "Утренняя пробежка 8 км",
        period: "TODAY",
        visibility: "FRIENDS",
        hashtag: "бег",
        streak: 21,
        done: true,
        doneAt: new Date(),
      },
    }),
    prisma.diaryTask.create({
      data: {
        userId: max.id,
        title: "Волонтёрская смена в приюте",
        period: "TODAY",
        visibility: "PUBLIC",
        hashtag: "волонтёрство",
        copyCount: 3,
      },
    }),
  ]);

  await prisma.activity.createMany({
    data: [
      {
        userId: anna.id,
        type: "TASK_COMPLETED",
        visibility: "FRIENDS",
        title: "Утренняя пробежка 8 км",
        body: "серия 21 день · #бег",
        xpGained: 10,
        taskId: demoTasks[6].id,
      },
      {
        userId: max.id,
        type: "TASK_CREATED",
        visibility: "PUBLIC",
        title: "Волонтёрская смена в приюте",
        body: "#волонтёрство",
        taskId: demoTasks[7].id,
      },
      {
        userId: anna.id,
        type: "CHALLENGE_JOINED",
        visibility: "FRIENDS",
        title: "Вступила в «30 дней без лифта»",
        postId: challengePost.id,
      },
      {
        userId: daria.id,
        type: "MEDIA_ADDED",
        visibility: "PUBLIC",
        title: "Оппенгеймер",
        body: "FILM · рецензия: сильный финал",
      },
      {
        userId: demo.id,
        type: "WISHLIST_ADDED",
        visibility: "FRIENDS",
        title: "Мой день рождения",
        body: "Kindle Paperwhite",
      },
      {
        userId: anna.id,
        type: "SHARED_GOAL_UPDATED",
        visibility: "FRIENDS",
        title: "Купить свечи",
        body: "Подготовка к ДР Маши",
      },
      {
        userId: demo.id,
        type: "DUEL_STARTED",
        visibility: "FRIENDS",
        title: "10 000 шагов каждый день",
        body: "⚔️",
      },
      {
        userId: max.id,
        type: "EVENT_ATTENDED",
        visibility: "PUBLIC",
        title: "Субботник в парке Сокольники",
        postId: volunteerPost.id,
      },
      {
        userId: max.id,
        type: "CHALLENGE_CREATED",
        visibility: "FRIENDS",
        title: "Серия субботников",
        postId: friendChallengePost.id,
      },
    ],
  });

  const duel = await prisma.duel.create({
    data: {
      creatorId: demo.id,
      title: "10 000 шагов каждый день",
      description: "С Аней и Максом",
      emoji: "👟",
      period: "DAILY",
      visibility: "PRIVATE",
      participants: {
        create: [
          { userId: demo.id, streak: 12, totalMarks: 12 },
          { userId: anna.id, streak: 9, totalMarks: 9 },
          { userId: max.id, streak: 7, totalMarks: 7 },
        ],
      },
    },
    include: { participants: true },
  });

  const now = new Date();
  for (const p of duel.participants) {
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (Math.random() > 0.3) {
        await prisma.duelMark.create({ data: { participantId: p.id, markedAt: d } });
      }
    }
  }

  const goal = await prisma.sharedGoal.create({
    data: {
      creatorId: demo.id,
      title: "Подготовка к ДР Маши",
      eventAt: new Date(Date.now() + 14 * 86400000),
      members: { create: [{ userId: demo.id }, { userId: anna.id }, { userId: max.id }] },
      items: {
        create: [
          { title: "Заказать торт", assigneeId: anna.id, sortOrder: 0 },
          { title: "Купить свечи", done: true, sortOrder: 1 },
          { title: "Собрать гостей в чат", assigneeId: demo.id, sortOrder: 2 },
        ],
      },
    },
  });

  const wishlist = await prisma.wishlist.create({
    data: {
      userId: demo.id,
      title: "Мой день рождения",
      occasion: "Июль 2026",
      eventAt: new Date(Date.now() + 23 * 86400000),
      visibility: "FRIENDS",
      items: {
        create: [
          { title: "Kindle Paperwhite", price: "12 990 ₽", link: "https://example.com" },
          { title: "Беговые кроссовки", price: "8 500 ₽", reserved: true, reservedBy: "anna" },
        ],
      },
    },
  });

  await prisma.mediaItem.createMany({
    data: [
      { userId: demo.id, type: "FILM", title: "Дюна: Часть вторая", status: "DONE", rating: 5, review: "Эпично", visibility: "PUBLIC" },
      { userId: demo.id, type: "BOOK", title: "Дюна", status: "IN_PROGRESS", visibility: "PUBLIC" },
      { userId: demo.id, type: "SERIES", title: "The Bear", status: "WANT", visibility: "FRIENDS" },
      { userId: demo.id, type: "GAME", title: "Hades II", status: "WANT", visibility: "PUBLIC" },
    ],
  });

  await prisma.challenge.updateMany({
    where: { postId: businessChallengePost.id },
    data: { isGlobal: true, isBusiness: true, reward: "+500 XP" },
  });

  console.log(`Seed complete. ${generateAchievementCatalog().length} achievements. Demo: demo@dvizh.app / demo1234. Admin: admin@dvizh.app / admin1234`);
  void goal;
  void wishlist;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
