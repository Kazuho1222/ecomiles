import { config } from 'dotenv';
config();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const WEBHOOK_URL = process.env.STRAVA_WEBHOOK_URL;
const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

async function registerWebhook() {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !WEBHOOK_URL || !VERIFY_TOKEN) {
    console.error('Error: Missing environment variables.');
    console.log('Ensure STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_URL, and STRAVA_WEBHOOK_VERIFY_TOKEN are set.');
    process.exit(1);
  }

  console.log(`Registering webhook: ${WEBHOOK_URL}`);

  try {
    const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        callback_url: WEBHOOK_URL,
        verify_token: VERIFY_TOKEN,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Webhook registered successfully!');
      console.log('Subscription Data:', data);
    } else {
      console.error('Failed to register webhook:', data);
    }
  } catch (error) {
    console.error('Error during registration:', error);
  }
}

registerWebhook();
