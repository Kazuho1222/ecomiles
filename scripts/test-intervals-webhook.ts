import { config } from 'dotenv';
config();

const WEBHOOK_SECRET = process.env.INTERVALS_WEBHOOK_SECRET || 'test_secret';
const TARGET_URL = process.argv[2] || 'http://localhost:3000/api/intervals/webhook';
const ATHLETE_ID = process.argv[3] || 'demo_athlete';
const ACTIVITY_ID = process.argv[4] || '12345678';

async function testWebhook() {
  console.log(`Sending test webhook to: ${TARGET_URL}`);
  console.log(`Athlete ID: ${ATHLETE_ID}, Activity ID: ${ACTIVITY_ID}`);

  const payload = {
    secret: WEBHOOK_SECRET,
    events: [
      {
        athlete_id: ATHLETE_ID,
        type: 'ACTIVITY_UPLOADED',
        timestamp: new Date().toISOString(),
        activity: {
          id: ACTIVITY_ID,
          name: 'Test Intervals Activity',
          type: 'Ride',
          start_date_local: new Date().toISOString(),
        },
      },
    ],
  };

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response body: ${text}`);

    if (response.ok) {
      console.log('✅ Webhook test sent successfully!');
    } else {
      console.error('❌ Webhook test failed.');
    }
  } catch (error) {
    console.error('Error during webhook test:', error);
  }
}

testWebhook();
