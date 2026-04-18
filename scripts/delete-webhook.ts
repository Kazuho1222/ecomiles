import { config } from 'dotenv';
config();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

async function deleteWebhook() {
  const subscriptionId = process.argv[2];

  if (!subscriptionId) {
    console.error('Error: Please provide a subscription ID as an argument.');
    console.log('Usage: npx tsx scripts/delete-webhook.ts <subscription_id>');
    process.exit(1);
  }

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    console.error('Error: Missing environment variables STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET.');
    process.exit(1);
  }

  console.log(`Deleting Strava webhook subscription: ${subscriptionId}...`);

  try {
    const url = `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (response.status === 204) {
      console.log('Webhook subscription deleted successfully!');
    } else {
      const data = await response.json();
      console.error('Failed to delete subscription:', data);
    }
  } catch (error) {
    console.error('Error during deletion:', error);
  }
}

deleteWebhook();
