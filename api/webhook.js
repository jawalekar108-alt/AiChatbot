const { handleIncomingMessage } = require('../lib/webhook-logic');

module.exports = async (req, res) => {
  // --- Meta's one-time webhook verification handshake ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- Incoming message/event notifications ---
  if (req.method === 'POST') {
    // Acknowledge immediately - Meta requires a fast 200 or it will retry/back off
    res.status(200).send('EVENT_RECEIVED');

    try {
      const entry = req.body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      if (message) {
        await handleIncomingMessage(message, contact);
      }
    } catch (err) {
      console.error('Error handling webhook event:', err);
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
};
