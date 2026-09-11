const axios = require('axios');

const API_VERSION = 'v20.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

function client() {
  return axios.create({
    baseURL: `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

async function sendText(to, body) {
  return client().post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  });
}

async function sendButtons(to, bodyText, buttons) {
  return client().post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  });
}

async function sendList(to, bodyText, buttonLabel, sections) {
  return client().post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: { button: buttonLabel, sections },
    },
  });
}

async function sendCatalogMessage(to, bodyText, productRetailerIds) {
  return client().post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: { type: 'text', text: 'Our Sarees' },
      body: { text: bodyText },
      action: {
        catalog_id: process.env.CATALOG_ID,
        sections: [
          {
            title: 'Featured Sarees',
            product_items: productRetailerIds.map((id) => ({ product_retailer_id: id })),
          },
        ],
      },
    },
  });
}

async function sendTemplate(to, templateName, languageCode = 'en', components = []) {
  return client().post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: templateName, language: { code: languageCode }, components },
  });
}

module.exports = { sendText, sendButtons, sendList, sendCatalogMessage, sendTemplate };
