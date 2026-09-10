const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatApiParams {
  message: string;
  history: ChatMessageItem[];
  context: Record<string, unknown>;
}

export async function sendChatMessage(params: ChatApiParams): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let errMessage = 'I couldn’t reach the assistant. Please try again.';
    try {
      const data = await res.json();
      if (data.reply) errMessage = data.reply;
      else if (data.error) errMessage = data.error;
    } catch {
      // fallback error string
    }
    throw new Error(errMessage);
  }

  return res.json();
}
