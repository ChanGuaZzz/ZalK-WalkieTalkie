import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

export async function sendPushNotification(token: string, message: string): Promise<void> {
  // Create the messages that you want to send to clients
  let messages: ExpoPushMessage[] = [];

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
    return;
  }

  // Construct a message
  messages.push({
    to: token,
    sound: 'default',
    body: message,
    data: { withSome: 'data' },
  });

  // The Expo push notification service accepts batches of notifications
  let chunks = expo.chunkPushNotifications(messages);
  let tickets: any[] = [];

  // Send the chunks to the Expo push notification service
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
}