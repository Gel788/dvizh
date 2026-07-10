<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## v38 migration

При работе над миграцией v38 обновляй `docs/V38_DEVELOPMENT_PLAN.md` в конце сессии: галочки, матрица экранов, сводка прогресса (см. раздел «Автообновление» в плане).

### Обязательный порядок (без исключений)

1. **Вертикальный срез** — на одну фичу за итерацию: **B (DAR API)** → **M (Flutter delegate/store)** → **I (hydrate + write + acceptance)**. SMS-auth пропускаем по решению владельца.
2. **Запрещено** закрывать задачу, если сделан только bridge/read на старый API или только UI на моках.
3. Перед `[x]` в плане проверь: эндпоинт существует в `DAR/src/app/api/v1/`, delegate вызывает его, `flutter analyze` без errors.
4. Миграции БД — только **additive** (`surpriseMode`, новые поля, новые routes). Без destructive `db push` на prod.
5. `DvizhBackend.initializeDemo()` — не в release/prod-пути (только debug).
