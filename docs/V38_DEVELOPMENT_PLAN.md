# План разработки ДВЖ v38 — чеклист

> **Источник UI + спека:** `/Users/albertgiloan/Downloads/dvizh_v38_backend_handoff_pack`  
> **Flutter (prod):** `/Users/albertgiloan/Projects/dvizh_app`  
> **Backend (prod):** `/Users/albertgiloan/Desktop/DAR` → API `https://www.flroal.ru/api/v1`  
> **Главный spec:** `DVIZH_MASTER_SPEC_V1.md` · **Приёмка:** `BACKEND_ACCEPTANCE_CRITERIA.md`

Как пользоваться: меняй `[ ]` → `[x]`. В конце строки можно дописать дату и исполнителя.

## Автообновление (для агента)

После каждой сессии работы над v38 **обязательно** обновлять этот файл:

1. Проставить `[x]` только на пункты, которые реально сделаны (не «почти»).
2. Частично готовое — оставить `[ ]` и дописать в строке: `— частично: …`.
3. Обновить **матрицу экранов** (колонка «Статус»: ✅ / 🟡 / ⬜).
4. Пересчитать **сводку прогресса** внизу (дроби `готово/всего` + 🟡 если >0 и <100%).

| Зона | Репозиторий | Что делаем сейчас |
|------|-------------|-------------------|
| **M** Flutter | `dvizh_app` | v38 UI + `v38_integration/*` bridge |
| **B** Backend | `DAR` | Доработка API под v38 spec **в том же срезе**, что и фронт |
| **I** | оба | Мапперы, delegates, acceptance — только когда B+M согласованы |

### Правило: фронт и бэк — одновременно (вертикальный срез)

**Нельзя** считать фичу готовой, если сделан только bridge на существующий API или только UI на моках.

На **каждую** фичу (Wishlist, Disputes, Together, Auth, …) в одной сессии/итерации:

1. **B** — эндпоинты, поля, privacy/sanitizer по handoff-спеке (additive миграции).
2. **M** — Store/delegate под **реальный** контракт (не «как получится»).
3. **I** — hydrate + write-операции + acceptance-сценарий из `BACKEND_ACCEPTANCE_CRITERIA.md`.
4. **Deploy** — только когда B+M+I для среза закрыты (или явно помечено «blocked»).

Порядок фаз в документе — **приоритет экранов**, не «сначала весь фронт, потом весь бэк».

**Текущий долг (пример Wishlist):** фронт bridge есть, бэк не дотягивает спеку — нет `cancel-reservation`, `bought`, `surpriseMode` в модели, share links. Следующий срез = закрыть B, затем подтянуть M/I.

**Последнее обновление плана:** 2026-07-10 — Move reminder API + reports + challenge calendar guard (build 11).

## Легенда

| Метка | Зона ответственности |
|-------|---------------------|
| **M** | Flutter — UI, Store/Repository, навигация, ассеты |
| **B** | Backend — API, Prisma, алгоритмы, privacy на сервере |
| **I** | Интеграция — мапперы, подключение экрана к API, acceptance-сценарий |

## Launch-правила (не нарушать)

- [ ] Зафиксировано в коде и QA: **нет маскотов**, **нет блока «Приоритет»** на Today
- [ ] Спор и Вместе — **только приватные** на launch
- [ ] Задачи default `ownerOnly`, опционально `friends` / `public`
- [ ] Today progress — **никогда** не публичный
- [ ] Вызовы **не** попадают в Calendar автоматически
- [ ] Move → Calendar **только** по явному действию пользователя
- [ ] Wishlist surprise mode **не палит** бронирование владельцу
- [ ] Движ ≠ Лента; Лента ≠ карта событий

---

## Фаза 0 — Аудит и подготовка

### 0.1 Документы и окружение

- [ ] **M** v38 пакет: `flutter pub get && flutter analyze && flutter test`
- [ ] **M** v38 пакет: `flutter run -d chrome` (web smoke)
- [ ] **B** DAR: `npm ci && npm run build` на staging
- [ ] **I** Составлена матрица: v38 экран → dvizh_app файл → DAR endpoint (ссылка на таблицу ниже)
- [ ] **I** Прогнан `BACKEND_ACCEPTANCE_CRITERIA.md` по текущему API — список ❌ вынесен в issues

### 0.2 Решения по архитектуре

- [x] **M** Принято: v38 `lib/` — **единственный** UI-источник (v2 `studio_ui.dart` — deprecate)
- [x] **M** Сохранены из dvizh_app: `core/auth`, `core/api`, `core/state`, iOS/Android, Firebase push
- [ ] **B** Миграции БД — только **additive**, без destructive `db push` на prod
- [x] **I** Схема: `Screen → Controller/Store → FeatureRepository → ApiClient` (bridge: `V38ApiBridge` → Store)

### Матрица экранов (заполнить по аудиту)

| v38 feature | dvizh_app сейчас | DAR API сейчас | Статус |
|-------------|------------------|----------------|--------|
| Auth/Onboarding | `features/auth/` (email) | `/auth/*` | 🟡 legacy auth |
| Today/Tasks | `v38/today_feature` + `V38ApiBridge` | `/diary/tasks/*` | 🟡 CRUD+complete bridge |
| Feed | `v38/feed_feature` + `V38FeedDelegate` | `/feed`, `/posts/*/like|going` | 🟡 load+actions |
| Move | `v38/move_screens` + `V38MoveLiveMap` | `/nearby`, `/events/*/join`, `/diary/events` | 🟡 join+calendar+report |
| Challenges | `v38/challenge_screens` | `/leaderboard/challenges`, `/challenges/*` | 🟡 load+join+progress |
| Profile | `v38/profile_feature` + `V38ProfileStore` | `/profile`, `/users/{username}`, `/friends` | 🟡 live + edit + public |
| Calendar | v38 quick + `calendarStore` + `V38CalendarDelegate` | `/diary/calendar`, `/diary/events` | 🟡 grid+sync+create |
| Medialist | v38 + `V38MediaDelegate` | `/media/*` CRUD | 🟡 read+write bridge |
| Wishlist | v38 + `V38WishlistDelegate` (reserve/cancel/bought) | `/wishlists/*` + cancel/bought | 🟡 B+M+I срез |
| Disputes | v38 + `V38DisputeDelegate` hydrate | `/duels/*` | 🟡 hydrate+mark |
| Together | v38 + `V38TogetherDelegate` hydrate | `/shared-goals/*` | 🟡 hydrate+tasks |
| Search | v38 `SearchScreen` + `V38SearchDelegate` | `/search` | 🟡 API bridge |
| Notifications | v38 `NotificationCenterScreen` + delegate | `/notifications`, `/push/register` | 🟡 load+read |

---

## Фаза 1 — Перенос фронта v38 в dvizh_app

### 1.1 Каркас и shell

- [x] **M** Скопированы `lib/v38/`, `assets/studio/` по `ASSET_INDEX.md`
- [x] **M** Подключён v38 `V38Shell` (`lib/v38_integration/v38_shell.dart`) — 5 табов + quick-ряд + «+»
- [x] **M** `go_router` переведён на v38 `FeedScreen`, `MoveScreen`, `TodayScreen`, `ChallengesScreen`, `ProfileScreen`
- [x] **M** Синхронизация темы `AppState.theme` ↔ `DvizhTheme.controller` + persist при переключении в профиле
- [x] **M** `AppNavBridge` — quick/create/notifications/search/profile
- [x] **M** `DvizhBackend.initializeDemo()` только в `kDebugMode`
- [ ] **M** 4 темы / выбор темы из онбординга (Дневная / Ночная жизнь) — частично (night sync)
- [ ] **M** Safe area, нижняя nav, глобальный header (лого, поиск, колокольчик) — из v38 kit
- [ ] **M** Empty / Error / Privacy states (`DvizhStatePanel`, `PrivateLaunchNotice`)
- [ ] **I** Smoke: все 5 табов открываются без crash на iOS

### 1.2 Удаление legacy UI

- [x] **M** Router переведён с `v2.FeedScreen` и т.д. на v38 feature screens
- [ ] **M** `ui/v2/studio_ui.dart` — удалён или в `_backup/` (не в production path) — частично: `DEPRECATED.md`, убран из `main.dart`
- [ ] **M** `ui/studio/*` — удалён или сведён к общим токенам

### 1.3 Repository layer (v37 prep → prod)

- [x] **M** `V38ApiBridge` — HTTP-загрузка Feed / Move / Challenges + sync Today из AppState
- [x] **M** `v38_app_mappers.dart` + `v38_feed_mapper.dart` — DTO → v38 UI models
- [x] **M** `V38LiveStore` + delegates TaskStore / ChallengeStore → API write-back
- [x] **M** `V38ApiSync` в shell — bootstrap после login + sync при изменении AppState
- [x] **M** `InMemoryBackend` отключён в release (`kDebugMode` gate)
- [ ] **M** Полная миграция Store → `DvizhFeatureRepository` HTTP (все фичи)
- [ ] **M** `RepositoryResult` + loading / error / retry на всех экранах
- [ ] **I** Demo fallback при offline (seed/cache) — опционально, не блокирует launch

---

## Фаза 2 — Auth и онбординг

### 2.1 Frontend (M)

- [ ] **M** Экраны v38: телефон → SMS → профиль → интересы → город/район → тема → первое дело
- [ ] **M** Убраны Apple/Google auth из UI
- [ ] **M** Светлая тема по умолчанию
- [ ] **M** Первое дело после онбординга → Today

### 2.2 Backend (B)

- [ ] **B** SMS-провайдер (РФ): send code + verify
- [ ] **B** `POST /auth/register` (phone)
- [ ] **B** `POST /auth/login` (phone + code)
- [ ] **B** `POST /auth/refresh`
- [ ] **B** `GET /me` — профиль + privacy defaults
- [ ] **B** `PATCH /me/profile` — имя, ник, bio, интересы, район
- [ ] **B** Миграция существующих email-пользователей (bind phone) — если нужно

### 2.3 Интеграция (I)

- [ ] **I** `AuthController` → v38 auth flow (не ломая session storage)
- [ ] **I** Онбординг пишет в API: город, район, дефолтная visibility, тема
- [ ] **I** Acceptance: регистрация → первое дело в Today на реальном API

---

## Фаза 3 — Privacy layer (сквозной)

### 3.1 Backend (B) — обязательно на сервере

- [x] **B** Сервис `can()` — `src/lib/privacy-service.ts` (foundation)
- [x] **B** Relation resolver: owner / friend / blocked / stranger
- [ ] **B** Матрица из `PRIVACY_ACCESS_MATRIX_V1.md` покрыта unit-тестами
- [ ] **B** Surprise mode: owner не видит кто забронировал wishlist item — частично в wishlist-service
- [ ] **B** Today progress — всегда ownerOnly в ответах API
- [x] **B** `POST /users/{id}/block` + модели UserBlock/HiddenPost/ContentReport

### 3.2 Frontend (M)

- [ ] **M** `lib/core/privacy/` v38 подключён к ответам API (не только локальный guard)
- [ ] **M** UI скрывает действия при `ACCESS_DENIED` от сервера — частично: block author в ленте
- [ ] **M** `content_sanitizer` для surprise / private launch surfaces

### 3.3 Интеграция (I)

- [ ] **I** Задача `ownerOnly` — друг не видит в API и в UI
- [ ] **I** Задача `friends` — видна другу + в feed friends
- [x] **I** Заблокированный не видит контент блокирующего — feed/search фильтр UserBlock/HiddenPost
- [ ] **I** Acceptance § Privacy из `BACKEND_ACCEPTANCE_CRITERIA.md`

---

## Фаза 4 — Today / Tasks

### 4.1 Frontend (M)

- [x] **M** Периоды: Сегодня / Завтра / Неделя / Месяц / Год / Мечта — v38 UI
- [x] **M** Кольцо продуктивности, до 3 задач + «Все задачи (N)» — v38 UI
- [x] **M** CRUD задачи, visibility, тег, streak, XP burst — create/edit/add → API через delegate
- [x] **M** Complete / restore / uncomplete — delegate → `AppState` → API
- [x] **M** Фото-пруф UI (загрузка → API) — v38 `showTaskCompletionSheet` + `/diary/tasks/{id}/proof`
- [x] **M** Quick-ряд: Календарь, Медиа, Вишлист, Спор, Вместе — shell
- [x] **M** **Нет** блока «Приоритет» — v38 Today

### 4.2 Backend (B)

- [x] **B** `GET` задач по периодам — `/profile/diary` + `/profile?full=1` fallback (Flutter `diary_bundle_fetch.dart`)
- [x] **B** `GET /profile/diary` — route в DAR; на prod до деплоя — fallback выше
- [x] **B** `POST` задач — `/diary/tasks` (DAR prod)
- [x] **B** `PATCH` / `DELETE` — `/diary/tasks/{id}` (DAR prod)
- [x] **B** `POST` complete / uncomplete — `/diary/tasks/{id}/complete|uncomplete` (DAR prod)
- [x] **B** `POST` proof — endpoint + v38 UI wired
- [ ] **B** XP начисление идемпотентно (`lastXpDay` / anti-farm) — проверить под v38 spec
- [ ] **B** Task → feed candidate при `friends`/`public` (не автопост)

### 4.3 Интеграция (I)

- [x] **I** v38 `TaskStore` ← `AppState` через `V38ApiBridge.syncTasksFromAppState`
- [x] **I** Периоды API ↔ UI labels (маппинг `Сегодня` → `today`) — `v38_app_mappers.dart`
- [x] **I** Diary sync fallback `/profile?full=1` при 404 на `/profile/diary`
- [ ] **I** Выполнение на телефоне → XP/level в профиле обновляются — нужен smoke
- [ ] **I** Acceptance § Tasks / Today

---

## Фаза 5 — Feed + Pulse

### 5.1 Frontend (M)

- [x] **M** 5 scope-вкладок: Друзья / Рядом / Район / Город / Глобальное
- [x] **M** Hero top-3 + compact list
- [x] **M** Фильтры: Все / Дела / Вызовы / События / Медиа / Места / Вишлисты / Достижения
- [x] **M** Деталка поста, реакции, комментарии — like/going/comments API
- [x] **M** Действия: забрать себе, скрыть, пожаловаться, save → media/wishlist/task API
- [x] **M** Экран Пульс (индекс, метрики, тренды) — UI + `/pulse` при загрузке

### 5.2 Backend (B)

- [x] **B** `GET /feed` + curated — DAR prod; базовый scoring в `getFeedPosts` (`feed-scoring-service.ts`)
- [x] **B** Feed scoring по `FEED_ALGORITHM_RULES_V1.md` — частично: freshness/social/relevance/proximity без полного scope-mix
- [x] **B** Friends: почти все friend-visible задачи друзей — `GET /friends` → `tasks[]` (FRIENDS/PUBLIC diary tasks)
- [x] **B** Nearby: дозированно будничные public задачи (10–25%) — `mixNearbyPosts` в `feed-scope-service.ts`
- [x] **B** District/City/Global: только significant public — scope filter + curated `scope` param
- [x] **B** Hero endpoint: top-3 с cover_status, diversity rules — `heroes` в `GET /feed` (`pickHeroTop3`)
- [x] **B** `GET /pulse` — DAR prod (базовый)
- [ ] **B** `POST/DELETE /feed/posts` — только explicit publish
- [x] **B** Comments — `GET/POST /posts/{id}` (DAR prod)
- [x] **B** Reactions, take, save, hide signals — like/going/repost/hide/report; take → diary task
- [x] **B** `POST /reports`, `POST /posts/{id}/hide`, `POST /users/{id}/block`
- [x] **B** Спор / Вместе / calendar / wishlist reservations **не** в feed — duels убраны из curated highlights

### 5.3 Интеграция (I)

- [x] **I** v38 `feed_feature.dart` → `/feed` + `/feed/curated` + `/pulse` — `V38ApiBridge.loadFeed`
- [x] **I** HeroCardItem маппинг из API — `v38_feed_mapper.dart`
- [x] **I** Like/going работают с `/posts/{id}/like` и `/posts/{id}/going`
- [x] **I** Комментарии → API — `V38FeedDelegate.loadComments/addComment`
- [x] **I** Friends tab: posts + tasks + activities merge; district/global → scoped `/feed`
- [ ] **I** Acceptance § Feed

---

## Фаза 6 — Move (Движ)

### 6.1 Frontend (M)

- [x] **M** 5 scope-вкладок (как в Feed) — v38 MoveScopeTabs
- [x] **M** Реальная карта (`flutter_map`), GPS, радиус — `V38MoveLiveMap` + scope reload + user city/radius в `/nearby`
- [x] **M** Пины, фильтры: События / Челленджи / Места / Сегодня — маркеры по типу активности
- [x] **M** Hero rail + список активностей — v38 UI
- [x] **M** Создание активности — UI + `POST /events` через `AppState.createMoveEvent` + reload `/nearby`
- [x] **M** Действия: календарь, напоминание, репорт, шаринг — calendar+reminder API, report `/reports`, share flroal.ru URL; «В Ленту» — след. срез

### 6.2 Backend (B)

- [x] **B** Geo nearby — `/nearby` (DAR prod, не полный v38 `/move/activities` contract)
- [ ] **B** `GET /move/activities` (или расширить `/nearby` под v38 contract)
- [ ] **B** Geo: lat/lng, radius, scope filter — частично в `/nearby`
- [x] **B** `POST /events` — создание активности/события из Движа
- [ ] **B** Join requests + approve (если в spec)
- [ ] **B** `POST /move/activities/{id}/calendar` — только по user action
- [x] **B** `POST /reports` для move items — targetKind `move` + post/event
- [x] **B** Координаты округлены, точный адрес не отдаётся — `publicCoordinates` на `/nearby`, address скрыт в маппере

### 6.3 Интеграция (I)

- [x] **I** v38 `MoveStore.shared` ← `/nearby` — `V38ApiBridge.loadMove`
- [x] **I** Карта: маркеры из API, tap → select activity — `V38MoveLiveMap`
- [x] **I** Join event/challenge с экрана Move — `onJoinActivity`
- [x] **I** Move → Calendar: tap «Календарь» → `POST /diary/events` через delegate
- [x] **I** Move create → `POST /events` + reload `/nearby`
- [ ] **I** Acceptance § Move

---

## Фаза 7 — Challenges (Вызовы)

### 7.1 Frontend (M)

- [x] **M** Вкладки: Я / Друзья / Район / Город / Мир
- [x] **M** Вступить / выйти — UI + API delegate
- [x] **M** Отметиться за день — API sync через `hydrateFromApi` + real user/date
- [x] **M** Календарь прогресса по дням — `ChallengeProgressCalendar` + API `myProgress` hydrate (0-based)
- [x] **M** Итоги: started / finished / completionRate — `participantsFinished` + `completionRate` в API, `ChallengeResultScreen`
- [x] **M** Фото-пруф на отметку (UI) — picker + upload через `/challenges/{id}/progress`
- [x] **M** Создание вызова — `POST /posts` type CHALLENGE + `createChallengeRemote` + reload вкладки «Я»

### 7.2 Backend (B)

- [x] **B** `GET` challenges + leaderboard — `/leaderboard/challenges` (DAR prod)
- [x] **B** `POST` join / leave — `/challenges/{id}/join|leave` (DAR prod)
- [x] **B** `POST /challenges/{id}/progress` — daily mark (increment)
- [x] **B** Proof upload — `image` + `content` в `POST /challenges/{id}/progress` → `ChallengeReport`
- [x] **B** Summary stats — `participantsFinished` + `completionRate` в `getChallengeLeaderboard`
- [x] **B** `POST /posts` CHALLENGE — goalCount, rules, deadline, isGlobal, auto-join creator
- [x] **B** `GET /leaderboard/challenges?scope=mine` — вкладка «Я»
- [x] **B** Challenges **не** создают calendar events — guard в `createPersonalEventForUser`

### 7.3 Интеграция (I)

- [x] **I** v38 `challenge_screens.dart` → `/leaderboard/challenges` + join/leave
- [x] **I** Join/leave/check-in обновляет список через `_hydrateChallenges` после API
- [ ] **I** Acceptance § Challenges

---

## Фаза 8 — Profile + Social

### 8.1 Frontend (M)

- [x] **M** Hero: уровень, XP, streak, ритм недели, аватар — `V38ProfileStore` + `ProfileHeroCard`
- [x] **M** Метрики (streak, week done, challenges) — live из AppState
- [x] **M** Табы: Обзор / Друзья / Подписки / Ачивки / Медиаритм — UI v38
- [x] **M** Редактирование профиля — имя, bio, город, район, аватар → `PATCH /profile` + upload
- [x] **M** Публичный профиль друга — `V38PublicProfileScreen` → `GET /users/{username}`

### 8.2 Backend (B)

- [ ] **B** `GET /me`, `PATCH /profile`, avatar/cover upload — частично: PATCH+avatar на prod
- [ ] **B** `GET /friends`, requests accept/decline
- [ ] **B** Follow/subscriptions если отделены от friends
- [x] **B** `GET /users/{username}` с privacy filter — block + hidden posts
- [ ] **B** Achievements / XP / level в `/profile/diary`

### 8.3 Интеграция (I)

- [x] **I** v38 `profile_feature.dart` → `V38ProfileStore` / `V38ApiBridge.syncProfile`
- [x] **I** Счётчики друзей/подписок из реального API
- [x] **I** Поиск/социал → `/user/:username` открывает v38 public profile
- [ ] **I** Acceptance § Auth/Profile/Friends

---

## Фаза 9 — Calendar

### 9.1 Frontend (M)

- [x] **M** Месячная сетка — `CalendarScreen` + sync `/diary/calendar` + реальная дата
- [x] **M** CRUD событий, напоминания — create+edit+delete+reminderAt PATCH API
- [ ] **M** Поиск по календарю
- [ ] **M** Подмешивание в Today только Сегодня/Завтра

### 9.2 Backend (B)

- [ ] **B** `GET/POST/PATCH/DELETE /diary/events` — частично: все методы на prod
- [ ] **B** Reminders + cron (`/cron/reminders`) — endpoint + scheduler есть; smoke на prod
- [ ] **B** `sourceKind=move` при создании из Движа — задеплоено на prod (миграция + API)
- [ ] **B** Challenges не попадают в calendar

### 9.3 Интеграция (I)

- [x] **I** v38 `calendarStore` ← `/diary/calendar` через `V38ApiBridge`
- [x] **I** `createEvent` → `POST /diary/events` через `V38CalendarDelegate`
- [x] **I** `updateEvent` / `deleteEvent` → PATCH/DELETE `/diary/events/{id}`
- [x] **I** `setReminder` → `PATCH /diary/events/{id}` с `reminderAt`
- [x] **I** Move → Calendar создаёт event только после tap пользователя
- [ ] **I** Acceptance § Calendar

---

## Фаза 10 — Wishlist

### 10.1 Frontend (M)

- [x] **M** Папки, желания, бронирование, surprise mode UI
- [x] **M** Share links, «хочу себе», архив
- [x] **M** Place wishes / путешествия

### 10.2 Backend (B)

- [x] **B** `POST .../reserve`, cancel, bought — `cancel-reservation`, `mark-bought`, `reservationStatus`, `surpriseMode`
- [ ] **B** Surprise sanitizer на сервере — частично: maskItems + surpriseMode
- [x] **B** Share links (tokenized URLs) — `shareToken` + `POST /wishlists/{id}/share` + `GET /wishlists/share/{token}`
- [ ] **B** Place-wishes / visited places

### 10.3 Интеграция (I)

- [x] **I** v38 `wishlist_feature.dart` → `/wishlists/*` (reserve/create/add/cancel/bought)
- [x] **I** Share link create → API token URL через `V38WishlistDelegate.onCreateShareLink`
- [x] **I** Владелец в surprise mode не видит who reserved — API mask + surpriseMode
- [ ] **I** Acceptance § Wishlist

---

## Фаза 11 — Disputes (Спор) — private launch

### 11.1 Frontend (M)

- [x] **M** Только «Мои споры», без публичных вкладок — v38 UI + PrivateLaunchNotice
- [x] **M** Создание, приглашение, доказательства, голосование, итог — create+mark API; friend picker на create

### 11.2 Backend (B)

- [x] **B** API `/duels` GET+POST + `/duels/{id}/mark` — DAR prod
- [ ] **B** evidence, votes, complete — без денег
- [x] **B** Не появляется в feed/search/public profile — curated highlights без duels

### 11.3 Интеграция (I)

- [x] **I** v38 `DisputeStore` ← `GET /duels` + create/mark → API + friend picker → `friendIds`
- [ ] **I** Acceptance § Disputes

---

## Фаза 12 — Together (Вместе) — private launch

### 12.1 Frontend (M)

- [x] **M** Spaces, участники, дела, заметки, приглашения — v38 UI; accept/decline invite API

### 12.2 Backend (B)

- [x] **B** API `/shared-goals` GET+POST + respond + item complete — DAR prod
- [ ] **B** Invites, members, tasks, notes
- [ ] **B** Не в feed/search

### 12.3 Интеграция (I)

- [x] **I** v38 `TogetherStore` ← `GET /shared-goals` + create/complete/respond + friend picker → `friendIds`
- [ ] **I** Acceptance § Together

---

## Фаза 13 — Medialist

### 13.1 Frontend (M)

- [x] **M** Фильмы / Сериалы / Книги / Игры — v38 UI
- [x] **M** Статусы, оценка, рецензия — add/update/delete → API через `V38MediaDelegate`

### 13.2 Backend (B)

- [x] **B** `GET/POST/PATCH/DELETE /media` — DAR prod (`/media`, `/media/{id}`)
- [ ] **B** Community catalog contributions (post-MVP опционально)

### 13.3 Интеграция (I)

- [x] **I** v38 `medialist_feature.dart` ← `V38MediaStore` read + `V38MediaDelegate` write
- [ ] **I** Acceptance § Medialist

---

## Фаза 14 — Search + Notifications + Reports

### 14.1 Frontend (M)

- [x] **M** Глобальный поиск: люди, события, вызовы, медиа, места — v38 `SearchScreen` → `/search` (люди/события/вызовы/посты)
- [x] **M** Центр уведомлений, read/unread — `NotificationCenterScreen` + live summary
- [ ] **M** Push permission gate (уже есть — проверить с v38 shell)

### 14.2 Backend (B)

- [x] **B** `GET /search?q=&city=` + privacy `profileInSearch` — DAR prod
- [x] **B** `GET /notifications`, `PATCH .../read` — DAR prod
- [ ] **B** `POST /reports`
- [ ] **B** FCM/APNs — device tokens (`/push/register`) — частично: native есть

### 14.3 Интеграция (I)

- [x] **I** Search UI → API с privacy-filtered results — `V38SearchDelegate` + `v38_search_mappers.dart`
- [x] **I** Notifications hydrate + mark all read — `V38NotificationDelegate`
- [ ] **I** Push на реальном устройстве (не только UI)
- [x] **I** Reports/hide/block из Feed UI

---

## Фаза 15 — Деплой и QA

### 15.1 Backend

- [ ] **B** Staging = prod schema parity
- [x] **B** PM2 / `ecosystem.config.cjs` — deploy без downtime (промежуточный deploy 2026-07-10)
- [ ] **B** Мониторинг `/api/v1/health`
- [ ] **B** Полный прогон `BACKEND_ACCEPTANCE_CRITERIA.md`

### 15.2 Mobile

- [x] **M** `flutter build ios --release` + установка на iPhone — build 1.2.0 (7–8)
- [ ] **M** `flutter build ios --release` + TestFlight
- [ ] **M** `flutter build apk/appbundle` (если нужен Android)
- [ ] **M** Реальное устройство: login → 5 табов → quick screens
- [x] **I** API base: prod `flroal.ru` в release-сборке
- [x] **I** Email login → главный экран (auth race fix, build 7+)

### 15.3 Web (опционально)

- [ ] **W** DAR web parity с v38 (если нужен)
- [ ] **I** Единый API contract web + mobile

---

## Сводка прогресса (обновлять вручную)

| Фаза | M | B | I | Готово |
|------|---|---|---|--------|
| 0 Аудит | 3/6 | 0/1 | 1/3 | 🟡 |
| 1 Фронт v38 | 11/21 | — | 0/2 | 🟡 |
| 2 Auth | 0/4 | 0/7 | 0/3 | ⬜ |
| 3 Privacy | 0/3 | 3/6 | 1/4 | 🟡 |
| 4 Today | 7/7 | 7/7 | 3/4 | 🟡 |
| 5 Feed | 6/6 | 10/10 | 5/5 | 🟡 |
| 6 Move | 6/6 | 4/8 | 6/6 | 🟡 |
| 7 Challenges | 6/6 | 8/8 | 3/3 | 🟡 |
| 8 Profile | 5/5 | 2/5 | 3/3 | 🟡 |
| 9 Calendar | 2/3 | 1/4 | 5/5 | 🟡 |
| 10 Wishlist | 3/3 | 5/5 | 3/3 | 🟡 |
| 11 Disputes | 2/2 | 2/4 | 2/3 | 🟡 |
| 12 Together | 1/1 | 1/4 | 2/3 | 🟡 |
| 13 Medialist | 2/2 | 1/2 | 1/2 | 🟡 |
| 14 Search/Notif | 2/3 | 3/4 | 3/4 | 🟡 |
| 15 Deploy/QA | 0/? | 0/? | 0/? | ⬜ |

> Дроби — `[x]` / всего пунктов в подсекциях фазы. 🟡 = начато, ⬜ = не начато, ✅ = всё `[x]`.

---

## Частично уже сделано (dvizh_app — отметить при переносе на v38)

> Сверить при миграции: не считать готовым без v38 UI.

- [~] **I** v2 shell + `StudioLiveBridge` (feed, move, challenges, profile, today) — **заменить на v38**
- [~] **I** `StudioMoveMap` — реальная карта на `/nearby`
- [~] **I** Quick screens (`studio_quick_views.dart`) — живые данные AppState
- [~] **B** DAR: diary, feed, nearby, challenges, wishlist, duels, shared-goals, media, pulse

---

*Документ создан: 2026-07-10. Последнее обновление: Challenges proof API + calendar move sourceKind (build 9).*
