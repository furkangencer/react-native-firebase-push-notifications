import { PermissionsAndroid, Platform, AsyncStorage } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';

export default class SetrowPush {
  constructor(){

  }

  static async init(mkodu) {
    this._mkodu = mkodu;
    // mkodu check???
    await this.checkIfOpenedByNotification();
    await this.checkPermission()
      .then(()=> this.getToken())
      .then(()=> this.createAndroidChannel(true))
      .then((res) => {
        console.log('Everything is up and running!');
    }).catch((err) => {
      console.log(err);
    });
  }

  static createAndroidChannel(createChannelGroup=false) {
    return new Promise( (resolve, reject) => {
      if(Platform.OS === 'android') {
        if(createChannelGroup){
          const channelGroup = new firebase.notifications.Android.ChannelGroup('push', 'Push', firebase.notifications.Android.Importance.Max);
          firebase.notifications().android.createChannelGroup(channelGroup).then(() => {
            console.log('Android channel group created.');
            resolve();
          }).catch(() => {
            reject('Error when creating channel');
          });
        }else {
          const channel = new firebase.notifications.Android.Channel('push', 'Push', firebase.notifications.Android.Importance.Max);
          firebase.notifications().android.createChannel(channel).then(() => {
            console.log('Android channel created.');
            resolve();
          }).catch(() => {
            reject('Error when creating channel');
          });
        }
      }else if(Platform.OS === 'ios') {
        resolve();
      }
    });
  }

  static checkPermission() {
    return new Promise( async (resolve, reject) => {
      const enabled = await firebase.messaging().hasPermission();
      if (enabled) {
        // user has permissions
        await console.log('Has Permission');
        resolve('Has Permission');
      } else {
        // user doesn't have permission
        await console.log('User doesn\'t have permission. Asking for permission...');
        await this.requestPermission()
          .then(()=> {
            resolve();
          })
          .catch((err)=>{
            reject(err);
          })
      }
    })
  }

  static requestPermission() {
    return new Promise(async (resolve, reject) => {
      try {
        await firebase.messaging().requestPermission();
        // User has authorised
        console.log('Permission granted');
        resolve('Authorized');
      } catch (error) {
        // User has rejected permissions
        console.log('Permission denied');
        reject('Denied');
      }
    })
  }

  static getToken() {
    return new Promise(async (resolve, reject) => {
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        fcmToken = await firebase.messaging().getToken();
        if (fcmToken) {
          await console.log(fcmToken);
          await AsyncStorage.setItem('fcmToken', fcmToken);
          resolve(fcmToken);
        }else{
          reject(false);
        }
      }else {
        await console.log(fcmToken);
        resolve(fcmToken);
      }
    })
  }

  static checkExternalStoragePermission() {
    return new Promise((resolve, reject) => {
      // Only necessary for Android
      if (Platform.OS === 'android') {
        // Check whether the user has granted the app the WRITE_EXTERNAL_STORAGE permission
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then((granted) => {
          if (!granted) {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).then((result) => {
              if (result === PermissionsAndroid.RESULTS.GRANTED) {
                resolve('Permission granted');
              }else {
                reject('No Permission');
              }
            });
          }else {
            resolve('Permission granted');
          }
        });
      }else {
        resolve('This only works in Android!');
      }
    })
  }

  static sendToBackend(url, body) {
    return new Promise((resolve, reject) => {
      fetch('url', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).then((res) => {
        resolve(res)
      }).catch((err) => {
        reject(err)
      });
    })
  }

  static onMessageListener() {
    return firebase.messaging().onMessage((message: RemoteMessage)=> {
      console.log('Event: onMessage', message);
    })
  }

  static onNotificationDisplayedListener() {
    return firebase.notifications().onNotificationDisplayed((notification: Notification) => {
      // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
      console.log('Event: Notification displayed - onNotificationDisplayed', notification);
      // this.displayLocalNotification(notification); // Android'de sonsuz döngüye sokuyor
    });
  }

  static onNotificationListener() {
    return firebase.notifications().onNotification((notification: Notification) => {
      // BURAYI TEST ET==> notification.android.setChannelId('setrow-push').setSound('default');
      console.log('Event: Notification received - onNotification', notification);
      this.displayLocalNotification(notification);
    });
  }

  static onNotificationOpenedListener() {
    return firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
      const action = notificationOpen.action;
      const notification: Notification = notificationOpen.notification;

      console.log('Event: Notification opened - onNotificationOpened');
    });
  }

  static onTokenRefreshListener() {
    // The onTokenRefresh callback fires with the latest registration token whenever a new token is generated.
    return firebase.messaging().onTokenRefresh(fcmToken => {
      // Some code...
    });
  }

  static async checkIfOpenedByNotification() {
    // To check if the app was opened by a notification being clicked / tapped / opened :
    const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
      // App was opened by a notification
      console.log('App is opened because of notification interaction');
      const action = notificationOpen.action;
      const notification: Notification = notificationOpen.notification;

    }else {
      console.log('Not opened by notification', notificationOpen);
    }
  }

  static displayLocalNotification(notification: Notification) {
    const localNotification = new firebase.notifications.Notification({
      sound: 'default',
      show_in_foreground: true,
    })
      .setNotificationId(notification._notificationId)
      .setTitle(notification.title)
      .setBody(notification.body)
      //.setData(notification.data)
      .setData({
        key1: 'value1',
        key2: 'value2',
      })
      .setSound('default');
    localNotification.android.setChannelId('setrow-push');
    localNotification.android.setSmallIcon('ic_launcher');
    localNotification.android.setPriority(firebase.notifications.Android.Priority.Max);
    localNotification.android.setVibrate(1000);
    localNotification.ios.setBadge(2);
    this.createAndroidChannel(true).then(() => {
      firebase.notifications().displayNotification(localNotification);
      console.log('Local notification has been displayed');
    });
  }
}
