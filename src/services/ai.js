const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getGroqConfig() {
  const apiKey = String(process.env.GROQ_API_KEY || '').trim();
  const model = String(process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  return { apiKey, model };
}

async function askAI(prompt) {
  const question = String(prompt || '').trim();
  if (!question) throw new Error('Question is required');

  const { apiKey, model } = getGroqConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are Corgi-Bot AI Support. Help users understand Corgi-Bot features, Discord server usage, and general questions. Answer in the same language as the user when possible. Be concise, safe, and helpful.',
          },
          { role: 'user', content: question },
        ],
        temperature: 0.6,
        max_completion_tokens: 700,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();

      if (response.status === 401) {
        throw new Error('Groq API key is invalid');
      }
      if (response.status === 429) {
        throw new Error('Groq free limit reached. Please try again later.');
      }

      throw new Error(`Groq API ${response.status}: ${body.slice(0, 500)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text || !String(text).trim()) {
      throw new Error('Groq returned an empty response');
    }

    return String(text).trim();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Groq request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { askAI, getGroqConfig };
