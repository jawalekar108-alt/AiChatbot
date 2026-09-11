const axios = require('axios');
const { Client } = require('pg'); // For your Supabase connection

module.exports = async (req, res) => {
  
  // ==========================================
  // 1. HANDLE INCOMING MESSAGES (POST Requests)
  // ==========================================
  if (req.method === 'POST') {
    try {
      const incomingMessage = req.body;
      console.log("Received WhatsApp webhook data:", JSON.stringify(incomingMessage, null, 2));

      // TODO: Add your custom Saree chatbot processing code here
      // (Reading message text, matching products, writing to Supabase, responding via Axios)

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error("Webhook processing error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // ===================================================
  // 2. HANDLE HOMEPAGE & WHATSAPP TOKENS (GET Requests)
  // ===================================================
  if (req.method === 'GET') {
    const query = req.query;

    // A. WhatsApp Hub Handshake Verification
    // This allows Meta to test your link and activate the webhook in Meta Developer Dashboard
    if (query['hub.mode'] === 'subscribe' && query['hub.verify_token']) {
      // Create a secret phrase in your Meta Dashboard (e.g., "MY_SECRET_TOKEN_123")
      // Update this string to match whatever string you input there!
      const MY_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'MY_SECRET_TOKEN_123';
      
      if (query['hub.verify_token'] === MY_VERIFY_TOKEN) {
        console.log("WhatsApp Webhook successfully verified!");
        return res.status(200).send(query['hub.challenge']);
      } else {
        return res.status(403).send('Verification token mismatch');
      }
    }

    // B. Standard Webpage Render for Meta Business Verification
    // This removes the Vercel 404 error and shows your matching GST business identity
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Saree Chatbot Service</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fafafa; color: #333; }
              .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: inline-block; max-width: 500px; text-align: left; }
              h1 { color: #8a2be2; margin-top: 0; font-size: 24px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
              p { color: #555; line-height: 1.6; }
              .status-badge { background: #e6f7ed; color: #1f8b4c; padding: 6px 12px; border-radius: 20px; font-weight: bold; display: inline-block; font-size: 14px; margin-bottom: 15px; }
              footer { margin-top: 50px; color: #777; font-size: 0.85em; text-align: center; line-height: 1.5; }
              .highlight { font-weight: bold; color: #111; }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="status-badge">● Systems Operational</div>
              <h1>Saree Automated Assistant</h1>
              <p>Our automated WhatsApp platform allows customers to browse collections, verify inventory, and complete orders directly inside messaging networks.</p>
              <p>For operations, complaints, or inquiries, please use the contact parameters verified below.</p>
          </div>
          <footer>
              © 2026 <span class="highlight">Vanijyaa Siddhi AI</span>. All Rights Reserved.<br>
              Registered Address: <span class="highlight">Sangli,India</span>
          </footer>
      </body>
      </html>
    `);
  }

  // ==========================================
  // 3. REJECT UNKNOWN HTTP METHODS
  // ==========================================
  return res.status(405).send('Method Not Allowed');
};
