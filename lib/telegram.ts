import { getConfig } from "./config";

type TelegramPayload = {
  text: string;
  voiceUrl?: string;
};

export const sendTelegramUpdate = async ({ text, voiceUrl }: TelegramPayload) => {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = getConfig();
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { skipped: true };
  }

  const baseUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const responses: Response[] = [];

  const textResponse = await fetch(`${baseUrl}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" })
  });
  responses.push(textResponse);

  if (voiceUrl) {
    const voiceResponse = await fetch(`${baseUrl}/sendVoice`, {
      method: "POST",
      body: new URLSearchParams({ chat_id: TELEGRAM_CHAT_ID, voice: voiceUrl })
    });
    responses.push(voiceResponse);
  }

  return {
    skipped: false,
    ok: responses.every((res) => res.ok)
  };
};
