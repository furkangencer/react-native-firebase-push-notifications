// @flow
import firebase from 'react-native-firebase';
// Optional flow type
import type { RemoteMessage } from 'react-native-firebase';
import SetrowPush from "./index";

export default async (message: RemoteMessage) => {
    // handle your message
    console.log(message);
    SetrowPush.displayLocalNotification(message, true);
    return Promise.resolve();
}