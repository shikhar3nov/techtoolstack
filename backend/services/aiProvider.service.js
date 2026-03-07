const DEFAULT_TIMEOUT_MS = 7000;

const resolveProviderMode = () =>
  (process.env.AI_PROVIDER || process.env.AI_ROUTER_PROVIDER || 'heuristic').trim().toLowerCase();

const withTimeout = async (executor, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await executor(controller.signal);
    return result;
  } finally {
    clearTimeout(timer);
  }
};

const parseJsonFromText = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch {
    // continue to bracket extraction
  }

  const firstBrace = value.indexOf('{');
  const lastBrace = value.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = value.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return null;
};

const invokeOpenAI = async ({ messages, temperature, timeoutMs }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { mode: 'heuristic', error: 'missing_openai_api_key' };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await withTimeout(
      (signal) =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            temperature,
            response_format: { type: 'json_object' },
            messages
          }),
          signal
        }),
      timeoutMs
    );

    if (!response.ok) {
      return { mode: 'heuristic', error: `openai_http_${response.status}` };
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '';
    const data = parseJsonFromText(content);
    if (!data) {
      return { mode: 'heuristic', error: 'openai_parse_error' };
    }

    return { mode: 'openai', model, data };
  } catch {
    return { mode: 'heuristic', error: 'openai_request_failed' };
  }
};

const invokeOllama = async ({ messages, temperature, timeoutMs }) => {
  const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
  const url = `${baseUrl}/api/chat`;

  try {
    const response = await withTimeout(
      (signal) =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            stream: false,
            format: 'json',
            options: {
              temperature
            },
            messages
          }),
          signal
        }),
      timeoutMs
    );

    if (!response.ok) {
      return { mode: 'heuristic', error: `ollama_http_${response.status}` };
    }

    const payload = await response.json();
    const content = payload?.message?.content || '';
    const data = parseJsonFromText(content);
    if (!data) {
      return { mode: 'heuristic', error: 'ollama_parse_error' };
    }

    return { mode: 'ollama', model, data };
  } catch {
    return { mode: 'heuristic', error: 'ollama_unavailable' };
  }
};

const invokeHuggingFace = async ({ messages, temperature, timeoutMs }) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
  if (!apiKey) {
    return { mode: 'heuristic', error: 'missing_huggingface_api_key' };
  }

  const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
  const url =
    process.env.HUGGINGFACE_BASE_URL ||
    process.env.HF_BASE_URL ||
    'https://router.huggingface.co/v1/chat/completions';

  try {
    const response = await withTimeout(
      (signal) =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            temperature,
            messages
          }),
          signal
        }),
      timeoutMs
    );

    if (!response.ok) {
      return { mode: 'heuristic', error: `huggingface_http_${response.status}` };
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '';
    const data = parseJsonFromText(content);
    if (!data) {
      return { mode: 'heuristic', error: 'huggingface_parse_error' };
    }

    return { mode: 'huggingface', model, data };
  } catch {
    return { mode: 'heuristic', error: 'huggingface_request_failed' };
  }
};

const completeJson = async ({
  systemPrompt,
  userPayload,
  temperature = 0.1,
  timeoutMs = Number(process.env.AI_PROVIDER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
}) => {
  const provider = resolveProviderMode();
  if (provider === 'heuristic') {
    return { mode: 'heuristic', data: null, error: null };
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload)
    }
  ];

  if (provider === 'openai') {
    return invokeOpenAI({ messages, temperature, timeoutMs });
  }
  if (provider === 'ollama') {
    return invokeOllama({ messages, temperature, timeoutMs });
  }
  if (provider === 'huggingface' || provider === 'hf') {
    return invokeHuggingFace({ messages, temperature, timeoutMs });
  }

  return { mode: 'heuristic', data: null, error: `unsupported_provider_${provider}` };
};

module.exports = {
  completeJson,
  resolveProviderMode
};
