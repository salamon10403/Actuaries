export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { category, sender, text } = req.body;

    // Put your Bot Token and Chat ID securely here
    const BOT_TOKEN = '8728008796:AAE8yK1MRJAWfPRF5uC9qsNMfHzx_r4zeKo';
    const CHAT_ID = '8992009768';

    const formattedMessage = `📬 *New Website Message*\n\n` +
                             `📂 *Category:* ${category}\n` +
                             `👤 *From:* ${sender || 'Anonymous'}\n` +
                             `💬 *Message:* ${text}`;

    const telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(telegramURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: formattedMessage,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();
        if (data.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ success: false, error: data.description });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
