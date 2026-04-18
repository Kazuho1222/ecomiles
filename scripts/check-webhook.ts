import { config } from 'dotenv';
config();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

async function checkWebhook() {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    console.error('Error: Missing environment variables STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET.');
    process.exit(1);
  }

  console.log('Checking Strava webhook subscriptions...');

  try {
    const url = `https://www.strava.com/api/v3/push_subscriptions?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      if (Array.isArray(data) && data.length > 0) {
        console.log('Active Webhook Subscriptions:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('No active webhook subscriptions found.');
      }
    } else {
      console.error('Failed to fetch subscriptions:', data);
    }
  } catch (error) {
    console.error('Error during check:', error);
  }
}

checkWebhook();
