import { Agent, fetch as undiciFetch } from "undici";
import type { AiClientAction } from "./tools";
import { DVIZH_AI_FUNCTIONS } from "./tools";

export type LlmMessage = {
  role: string;
  content?: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: Record<string, unknown> | string;
  };
  functions_state_id?: string;
};

export type LlmCompletion = {
  text: string;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown> | string;
    functionsStateId?: string;
  };
  finishReason?: string;
  assistantMessage?: LlmMessage;
};

const OAUTH_URL =
  process.env.GIGACHAT_OAUTH_URL ??
  "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const API_BASE = (
  process.env.GIGACHAT_BASE_URL ?? "https://gigachat.devices.sberbank.ru/api/v1"
).replace(/\/$/, "");

const insecureAgent = new Agent({
  connect: { rejectUnauthorized: false },
});

let tokenCache: { token: string; expiresAt: number } | null = null;

async function gigachatFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<Response> {
  return undiciFetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
    dispatcher: insecureAgent,
    signal: AbortSignal.timeout(90_000),
  }) as unknown as Response;
}

export function isAiConfigured() {
  return Boolean(process.env.GIGACHAT_CREDENTIALS?.trim());
}

async function fetchAccessToken(): Promise<string> {
  const credentials = process.env.GIGACHAT_CREDENTIALS?.trim();
  if (!credentials) {
    throw new Error("GIGACHAT_CREDENTIALS не задан");
  }

  const scope = process.env.GIGACHAT_SCOPE?.trim() || "GIGACHAT_API_PERS";
  const rqUid = crypto.randomUUID();

  const res = await gigachatFetch(OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: rqUid,
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ scope }).toString(),
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_at?: number;
    error?: { message?: string };
  };

  if (!res.ok || !data.access_token) {
    const msg = data.error?.message ?? `OAuth ${res.status}`;
    if (res.status === 401) {
      throw new Error(
        "Неверный GIGACHAT_CREDENTIALS. Скопируй «Authorization key» из developers.sber.ru → проект → Авторизационные данные (не Client ID).",
      );
    }
    throw new Error(`GigaChat OAuth: ${msg}`);
  }

  const expiresAt =
    typeof data.expires_at === "number"
      ? data.expires_at * 1000
      : Date.now() + 25 * 60_000;

  tokenCache = { token: data.access_token, expiresAt };
  return data.access_token;
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  return fetchAccessToken();
}

function parseCompletion(data: unknown): LlmCompletion {
  const body = data as {
    choices?: {
      message?: LlmMessage;
      finish_reason?: string;
    }[];
  };

  const choice = body.choices?.[0];
  const msg = choice?.message;
  if (!msg) throw new Error("Пустой ответ GigaChat");

  const fc = msg.function_call;
  if (fc?.name) {
    return {
      text: msg.content?.trim() ?? "",
      functionCall: {
        name: fc.name,
        arguments: fc.arguments,
        functionsStateId: msg.functions_state_id,
      },
      finishReason: choice?.finish_reason,
      assistantMessage: msg,
    };
  }

  const text = msg.content?.trim();
  if (!text) throw new Error("Пустой ответ GigaChat");
  return {
    text,
    finishReason: choice?.finish_reason,
    assistantMessage: msg,
  };
}

async function chatCompletions(messages: LlmMessage[], withTools: boolean) {
  const token = await getAccessToken();
  const chatModel =
    process.env.GIGACHAT_MODEL?.trim() || process.env.AI_MODEL?.trim() || "GigaChat-2-Pro";

  const payload: Record<string, unknown> = {
    model: chatModel,
    messages,
    max_tokens: 1024,
    temperature: 0.6,
    stream: false,
  };

  if (withTools) {
    payload.functions = DVIZH_AI_FUNCTIONS;
    payload.function_call = "auto";
  }

  const res = await gigachatFetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as { message?: string; error?: { message?: string } };
    const msg = err.message ?? err.error?.message ?? JSON.stringify(data).slice(0, 200);
    if (res.status === 401) {
      tokenCache = null;
      throw new Error("Сессия GigaChat истекла — попробуй ещё раз");
    }
    if (res.status === 402 || res.status === 429) {
      throw new Error(`GigaChat: ${msg}`);
    }
    throw new Error(`GigaChat ${res.status}: ${msg}`);
  }

  return parseCompletion(data);
}

export async function callLlm(messages: LlmMessage[], _model: string) {
  const result = await chatCompletions(messages, false);
  return result.text;
}

export type AgentRunResult = {
  reply: string;
  actions: AiClientAction[];
};

export async function runAiAgent(
  messages: LlmMessage[],
  executeTool: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ message: string; actions?: AiClientAction[] }>,
  maxSteps = 5,
): Promise<AgentRunResult> {
  const thread = [...messages];
  const actions: AiClientAction[] = [];
  const pushActions = (next: AiClientAction[] | undefined) => {
    for (const a of next ?? []) {
      const dup = actions.some((x) => {
        if (x.type !== a.type) return false;
        if (x.type === "navigate" && a.type === "navigate") return x.screen === a.screen;
        return true;
      });
      if (!dup) actions.push(a);
    }
  };

  for (let step = 0; step < maxSteps; step++) {
    const completion = await chatCompletions(thread, true);

    if (!completion.functionCall) {
      return { reply: completion.text, actions };
    }

    const { name, arguments: rawArgs, functionsStateId } = completion.functionCall;
    const args =
      typeof rawArgs === "string"
        ? (JSON.parse(rawArgs || "{}") as Record<string, unknown>)
        : rawArgs;

    const toolResult = await executeTool(name, args);
    pushActions(toolResult.actions);

    const assistantMsg: LlmMessage = completion.assistantMessage ?? {
      role: "assistant",
      content: completion.text,
      function_call: { name, arguments: rawArgs },
      functions_state_id: functionsStateId,
    };

    thread.push(assistantMsg);
    thread.push({
      role: "function",
      name,
      content: JSON.stringify({
        ok: true,
        result: toolResult.message,
      }),
    });
  }

  const fallback = await chatCompletions(thread, false);
  return { reply: fallback.text, actions };
}
