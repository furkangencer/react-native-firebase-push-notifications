import { PermissionsAndroid, Platform, AsyncStorage } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen, RemoteMessage } from 'react-native-firebase';
import DeviceInfo from 'react-native-device-info';

export default class WDCPush {
  #LOG_TYPES = {
    newToken: "newToken",
    refreshToken: "refreshToken"
  };
  #apiKey;
  #userEmail;
  #callbackAfterTap = () => {};

  constructor() {

  }

  /**
   * Initiates the Push Notificaiton Service
   * @param apiKey {string} WDC API Key
   * @param [userEmail] {string=""} Device user's email
   * @param [callbackToRegister] {function} Callback function to call on notification-tapping events. With this callback, you can access the custom key-value pairs that you specified in the notification body.
   * @returns {Promise<R>}
   */
  init(apiKey, userEmail='', callbackToRegister) {
    return new Promise((resolve, reject) => {
      this.checkParams(apiKey, userEmail, callbackToRegister)
        .then(() => this.checkIfOpenedByNotification())
        .then(() => this.createAndroidChannel(true))
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  }

  setEmail(email) {
    return new Promise((resolve, reject) => {
      if (typeof email !== 'string' || (email.length > 0 && !this.validateEmail(email)) ) reject('Email must be valid');
      //TODO: local'e yaz: await this.storeEmail(email);
      this.#userEmail = email;
      resolve();
    });
  }

  setCallback(callback) {
    return new Promise((resolve, reject) => {
      if(typeof callback !== "function") reject('Callback must be a function');
      this.#callbackAfterTap = callback;
      resolve();
    })
  }

  validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  checkParams(key, email, callback) {
    return new Promise((resolve, reject) => {
      if (typeof key !== "string") reject('Key must be string');
      if (typeof email !== 'string' || (email.length > 0 && !this.validateEmail(email)) ) reject('Email must be valid');
      this.#apiKey = key;
      this.#userEmail = email;
      if(typeof callback === 'function') this.#callbackAfterTap = callback;
      resolve();
    })
  };

  createAndroidChannel(createChannelGroup=false) {
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

  requestPermissionAndGetToken() {
    return new Promise((resolve, reject) => {
      this.requestPermission().then(async (res) => {
        let token = await this.getToken();
        // TODO: Android'de izin penceresi olmadığı için local'e yaz ???
        resolve(token)
      }).catch(err => reject(err));
    })
  }

  checkPermission() {
    return new Promise( async (resolve, reject) => {
      const enabled = await firebase.messaging().hasPermission();
      if (enabled) {
        // user has permissions
        resolve('User has permission');
      } else {
        // user doesn't have permission
        reject('User doesn\'t have permission');
      }
    })
  }

  requestPermission() {
    return new Promise(async (resolve, reject) => {
      try {
        await firebase.messaging().requestPermission();
        // User has authorised
        resolve('Authorized');
      } catch (error) {
        // User has rejected permissions
        reject('Denied');
      }
    })
  }

  getToken() {
    return new Promise(async (resolve, reject) => {
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        fcmToken = await firebase.messaging().getToken();
        if (fcmToken) {
          await AsyncStorage.setItem('fcmToken', fcmToken);
          // TODO: send token to backend
          console.log("Getting new token...");
          resolve(fcmToken);
        }else{
          reject(false);
        }
      }else {
        console.log("Token exists in local storage");
        resolve(fcmToken);
      }
    })
  }

  checkExternalStoragePermission() {
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

  sendToBackend(url, headers, body) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body),
      }).then((res) => {
        resolve(res.json())
      }).catch((err) => {
        reject(err)
      });
    })
  }

  requestFCMEndpoint(appServerKey, data) {
    return new Promise(async (resolve, reject) => {
      let token = await this.getToken();
      let reqBody = {
        registration_ids: [token],
        priority: 'high',
        time_to_live: 2419200
      };
      if(Platform.OS === "android") {
        // Data-Only message
        reqBody.data = {
          some_key: 'some value',
          sound: 'default',
          title: 'Check this Mobile (title)',
          body: 'Rich Notification testing (body)',
          badge: 0,
          subtitle: '',
          click_action: '',
          android_channel_id: 'push',
          tag: 'WDCPush',
          image: "http://www.three.co.uk/hub/wp-content/uploads/Google-logo-1-resized.jpg",
          ...data
        };
      }else if(Platform.OS === "ios") {
        // Notification + Data message
        reqBody.content_available = true;
        reqBody.data = {
          some_key: 'some value',
          sound: 'default'
        };
        reqBody.notification = {
          title: 'Check this Mobile (title)',
          body: 'Notification testing (body)',
          sound: 'default',
          badge: 0,
          subtitle: '',
          click_action: '',
          tag: 'WDCPush',
          ...data
        }
      }
      let reqHeaders = {
        Authorization: 'key='+appServerKey
      };

      this.sendToBackend('https://fcm.googleapis.com/fcm/send', reqHeaders , reqBody)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        })
    })
  }

  getDeviceInfo() {
    return new Promise(async (resolve, reject)=>{
      let infoObject = {
        uniqueId: await DeviceInfo.getUniqueId().then(id => id),
        brand: await  DeviceInfo.getBrand().then(brand=>brand),
        model: await DeviceInfo.getModel().then(model => model),
        deviceId: await DeviceInfo.getDeviceId().then(id => id),
        //product: await DeviceInfo.getProduct().then(product => product),
        osVersion: await DeviceInfo.getSystemVersion().then(version=>version)
      };
      console.log(infoObject);
      resolve(infoObject);
    });
  }

  onMessageListener() {
    return firebase.messaging().onMessage((message: RemoteMessage)=> {
      console.log('Event: onMessage', message);
      this.displayLocalNotification(message, true);
      // TODO: send log to backend
    })
  }

  onNotificationDisplayedListener() {
    return firebase.notifications().onNotificationDisplayed((notification: Notification) => {
      // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
      console.log('Event: Notification displayed - onNotificationDisplayed', notification);
      // this.displayLocalNotification(notification); // Android'de sonsuz döngüye sokuyor
      // TODO: send log to backend (ios açılma bilgisi => ios'ta app background ve foreground'dayken push gelince bu event fırlıyor )
    });
  }

  onNotificationListener() {
    return firebase.notifications().onNotification((notification: Notification) => {
      // BURAYI TEST ET==> notification.android.setChannelId('setrow-push').setSound('default');
      console.log('Event: Notification received - onNotification', notification);
      this.displayLocalNotification(notification);
      // TODO: send log to backend (for only android)
    });
  }

  onNotificationOpenedListener() {
    return firebase.notifications().onNotificationOpened(async (notificationOpen: NotificationOpen) => {
      const action = notificationOpen.action;
      const notification: Notification = notificationOpen.notification;

      console.log('Event: Notification opened - onNotificationOpened');
      await firebase.notifications().removeDeliveredNotification(notification._notificationId);
      this.#callbackAfterTap(notification.data);
      // TODO: send log to backend
    });
  }

  onTokenRefreshListener() {
    // The onTokenRefresh callback fires with the latest registration token whenever a new token is generated.
    return firebase.messaging().onTokenRefresh(async (fcmToken) => {
      await AsyncStorage.setItem("fcmToken", fcmToken);
      // TODO: send to backend
    });
  }

  checkIfOpenedByNotification() {
    return new Promise(async (resolve, reject) => {
      // To check if the app was opened by a notification being clicked / tapped / opened :
      const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
      if (notificationOpen) {
        // App was opened by a notification
        console.log('App is opened because of notification interaction');
        const action = notificationOpen.action;
        const notification: Notification = notificationOpen.notification;
        await firebase.notifications().removeDeliveredNotification(notification._notificationId);
        this.#callbackAfterTap(notification.data);
        // TODO: send log to backend
      }else {
        console.log('Not opened by notification', notificationOpen);
      }
      resolve();
    })
  }

  displayLocalNotification(notification: Notification, dataOnly=false) {
    this.createAndroidChannel().then(async () => {
      let notID = dataOnly ? notification._messageId : notification._notificationId;
      let title = dataOnly ? notification.data.title : notification.title;
      let body = dataOnly ? notification.data.body : notification.body;
      const localNotification = await new firebase.notifications.Notification({
        show_in_foreground: true,
        notificationId: notID,
        title: title,
        body: body,
        data: notification._data,
        // collapse_key: notification._collapseKey
      })
        .setSound(notification.data.sound)
        // .ios.setLaunchImage('http://www.three.co.uk/hub/wp-content/uploads/Google-logo-1-resized.jpg')
        .android.setBigPicture(notification.data.image)
        .android.setChannelId('push')
        .android.setSmallIcon('ic_notification')
        .android.setColor('#00FF00')
        .android.setPriority(firebase.notifications.Android.Priority.Max)
        .android.setVibrate(1000);
        // .ios.setBadge(2);

      // Build an action
      const action = new firebase.notifications.Android.Action('test_action', 'ic_launcher', 'My Test Action');
      // Add the action to the notification
      localNotification.android.addAction(action);

      await firebase.notifications().displayNotification(localNotification).then(()=> {
        console.log('Local notification has been displayed');
      }).catch((err)=> {
        console.log(err);
      });
    });
  }

  unsubscribe() {
    return new Promise(async (resolve, reject) => {
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      firebase.messaging().deleteToken()
        .then((res) => AsyncStorage.removeItem('fcmToken'))
        // TODO: send 'delete' request to backend ????
        .then(res => resolve())
        .catch(err => reject(err));
    })
  }
}

export let backgroundMessaging = async (message: RemoteMessage) => {
  // handle your message
  console.log(message);
  message._data = message.data;
  let wdc = await new WDCPush();
  wdc.displayLocalNotification(message, true);
  return Promise.resolve();
};