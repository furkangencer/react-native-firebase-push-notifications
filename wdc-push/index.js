import { PermissionsAndroid, Platform, AsyncStorage, Linking } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen, RemoteMessage } from 'react-native-firebase';
import DeviceInfo from 'react-native-device-info';

class WDCPush {
  #config = {
    apiKey: "",
    userEmail: "",
    bundleId: "",
    callbackAfterTap: function () { }
  };
  #tokenRefreshListener = null;
  #messageListener = null;
  #notificationDisplayedListener = null;
  #notificationListener = null;
  #notificationOpenedListener = null;

  /**
   * Initiates the Push Notification Service
   * @param config {object} Config object
   * @returns {Promise<R>}
   */
  init(config={}) {
    return new Promise((resolve, reject) => {
      this.checkParams(config)
        .then(() => this.checkIfOpenedByNotification())
        .then(() => this.createAndroidChannel(true))
        .then(() => this.createListeners())
        .then(() => resolve())
        .catch(err => reject(err))
    })
  }

  setEmail(email) {
    return new Promise((resolve, reject) => {
      if (typeof email !== 'string' || (email.length > 0 && !this.validateEmail(email)) ) reject('Email must be valid');
      // TODO: sendRequest => apiKey, email, deviceUniqueId
      this.#config.userEmail = email;
      AsyncStorage.setItem('config', JSON.stringify(this.#config))
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
  }

  setCallback(callback) {
    return new Promise((resolve, reject) => {
      if(typeof callback !== "function") reject('Callback must be a function');
      this.#config.callbackAfterTap = callback;
      resolve();
    })
  }

  validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  checkParams(config) {
    return new Promise(async (resolve, reject) => {
      this.#config = { ...this.#config, ...config};
      if (typeof this.#config.apiKey !== "string") reject('Key must be string');
      if (typeof this.#config.userEmail !== 'string' || (this.#config.userEmail.length > 0 && !this.validateEmail(this.#config.userEmail)) ) reject('Email must be valid');
      if (typeof this.#config.apiKey !== "string") reject('Bundle ID must be string');
      if (typeof this.#config.callbackAfterTap !== 'function') reject('Callback must be function');
      AsyncStorage.setItem('config', JSON.stringify(this.#config)) // config's "callbackAfterTap" property gets discarded automatically when stringifying
        .then(res => resolve(res))
        .catch(err => reject(err));
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
      firebase.messaging().requestPermission()
        .then(async () => {
          // User has authorised
          resolve('Authorized');
        })
        .catch(async (err) => {
          // User has rejected permissions
          reject('Denied');
        })
    })
  }

  getToken() {
    return new Promise(async (resolve, reject) => {
      await AsyncStorage.setItem('isSubscribed', 'true');
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        fcmToken = await firebase.messaging().getToken();
        if (fcmToken) {
          // New Token Generated
          await AsyncStorage.setItem('fcmToken', fcmToken);
          await this.getDeviceInfo().then((deviceInfo) => {
            let reqBody = {
              apiKey: this.#config.apiKey,
              email : this.#config.userEmail,
              fcmToken: fcmToken,
              ...deviceInfo
            };
            this.sendRequest("https://push.setrowid.com/mobile/v1/register.php", {}, reqBody).then(res => console.log(res));
          });
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

  sendRequest(url, headers, body, method='POST') {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: method,
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
          title: 'Notification testing (title)',
          body: 'Rich Notification testing (body)',
          badge: 0,
          subtitle: '',
          click_action: '',
          android_channel_id: 'push',
          tag: 'WDCPush',
          image: "",
          ...data
        };
      }else if(Platform.OS === "ios") {
        // Notification + Data message
        reqBody.content_available = true;
        reqBody.data = {
          some_key: 'some value',
          sound: 'default',
          tag: 'WDCPush',
          sendId: 1
        };
        reqBody.notification = {
          title: 'Notification testing (title)',
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

      this.sendRequest('https://fcm.googleapis.com/fcm/send', reqHeaders , reqBody)
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
        deviceOs: Platform.OS,
        deviceUniqueId: await DeviceInfo.getUniqueId().then(id => id),
        deviceBrand: await  DeviceInfo.getBrand().then(brand=>brand),
        deviceModel: await DeviceInfo.getModel().then(model => model),
        deviceId: await DeviceInfo.getDeviceId().then(id => id),
        deviceOsVersion: await DeviceInfo.getSystemVersion().then(version=>version)
        //Product: await DeviceInfo.getProduct().then(product => product),
      };
      //console.log(infoObject);
      resolve(infoObject);
    });
  }

  onMessageListener() {
    return firebase.messaging().onMessage((message: RemoteMessage)=> {
      console.log('Event: onMessage', message);
      this.displayLocalNotification(message, true);
    })
  }

  onNotificationDisplayedListener() {
    return firebase.notifications().onNotificationDisplayed(async (notification: Notification) => {
      // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
      console.log('Event: Notification displayed - onNotificationDisplayed', notification);
      if (Platform.OS === 'ios') {
        this.sendLog('display', notification);
      }
    });
  }

  onNotificationListener() {
    return firebase.notifications().onNotification((notification: Notification) => {
      console.log('Event: Notification received - onNotification', notification);
      this.displayLocalNotification(notification);
    });
  }

  onNotificationOpenedListener() {
    return firebase.notifications().onNotificationOpened(async (notificationOpen: NotificationOpen) => {
      const action = notificationOpen.action;
      const notification: Notification = notificationOpen.notification;

      console.log('Event: Notification opened - onNotificationOpened');
      await firebase.notifications().removeDeliveredNotification(notification._notificationId);
      this.#config.callbackAfterTap(notification.data);
      this.sendLog('tap', notification);
    });
  }

  onTokenRefreshListener() {
    // The onTokenRefresh callback fires with the latest registration token whenever a new token is generated.
    return firebase.messaging().onTokenRefresh(async (newFcmToken) => {
      let isSubscribed = await AsyncStorage.getItem('isSubscribed');
      if(isSubscribed === 'true') {
        let oldFcmToken = await AsyncStorage.getItem("fcmToken");
        if (oldFcmToken !== newFcmToken) {
          await AsyncStorage.setItem("fcmToken", newFcmToken);
          await this.getDeviceInfo().then((deviceInfo) => {
            let reqBody = {
              apiKey: this.#config.apiKey,
              oldFcmToken: oldFcmToken,
              newFcmToken: newFcmToken,
              ...deviceInfo
            };
            this.sendRequest("https://push.setrowid.com/mobile/v1/update.php", {}, reqBody,'PATCH')
          });
        }
      }
    });
  }

  checkIfOpenedByNotification() {
    return new Promise(async (resolve, reject) => {
      // Check if the app was opened by a notification tap
      const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
      if (notificationOpen) {
        // App was opened by a notification
        console.log('App is opened because of notification interaction');
        const action = notificationOpen.action;
        const notification: Notification = notificationOpen.notification;
        await firebase.notifications().removeDeliveredNotification(notification._notificationId);
        this.#config.callbackAfterTap(notification.data);
        this.sendLog('tap', notification);
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
        .android.setBigPicture(notification.data.image)
        .android.setChannelId('push')
        .android.setSmallIcon('ic_notification')
        .android.setColor('#00FF00')
        .android.setPriority(firebase.notifications.Android.Priority.Max)
        .android.setVibrate(1000);
      // .ios.setBadge(2);

      // TODO: Add action buttons (Android)
      // Build an action
      // const action = new firebase.notifications.Android.Action('test_action', 'ic_launcher', 'My Test Action');
      // Add the action to the notification
      // localNotification.android.addAction(action);

      await firebase.notifications().displayNotification(localNotification).then(async ()=> {
        if (Platform.OS === 'android') {
          this.sendLog('display', notification);
        }
        console.log('Local notification has been displayed');
      }).catch((err)=> {
        console.log(err);
      });
    });
  }

  unsubscribe() {
    return new Promise(async (resolve, reject) => {
      let fcmTokenToDelete = await AsyncStorage.getItem('fcmToken');
      firebase.messaging().deleteToken()
        .then(() => AsyncStorage.removeItem('fcmToken'))
        .then(() => AsyncStorage.setItem('isSubscribed', 'false'))
        .then(() => {
          if(typeof fcmTokenToDelete === "string" && fcmTokenToDelete.length > 0) {
            let reqBody = {
              apiKey: this.#config.apiKey,
              fcmToken: fcmTokenToDelete
            };
            return this.sendRequest("https://push.setrowid.com/mobile/v1/delete.php", {}, reqBody,'DELETE')
          }else {
            return 'fcmToken not found in local storage when unsubscribing';
          }
        })
        .then((res) => {
          console.log(res);
          resolve();
        })
        .catch(err => reject(err));
    })
  }

  async checkIfSubscribed() {
    return await AsyncStorage.getItem('isSubscribed') === 'true';
  }

  async goToNotificationSettings() {
    if(Platform.OS === 'ios') {
      const appUrl = 'app-settings://notification/'+this.#config.bundleId;
      await Linking.openURL(appUrl);
    }
  }

  async subscribeToTopic(topicName='') {
    await firebase.messaging().subscribeToTopic(topicName);
  }

  async unsubscribeFromTopic(topicName='') {
    await firebase.messaging().unsubscribeFromTopic(topicName);
  }

  async sendLog(eventType, notification) {
    let sendId = (typeof notification._data.sendId !== 'undefined' ? notification._data.sendId : 0);
    let tag = (typeof notification.data.tag !== 'undefined' ? notification.data.tag : "");
    let localConfig = JSON.parse(await AsyncStorage.getItem('config'));
    let locaFcmToken = await AsyncStorage.getItem('fcmToken');
    let reqBody = {
      apiKey: localConfig.apiKey,
      fcmToken: locaFcmToken,
      event: eventType,
      sendId: sendId,
      tag: tag
    };
    if (eventType === 'display') {
      reqBody.displayedAt = Math.floor(Date.now() / 1000);
    }else if (eventType === 'tap') {
      reqBody.tappedAt = Math.floor(Date.now() / 1000);
    }
    console.log("Log body:", reqBody);
    this.sendRequest("https://push.setrowid.com/mobile/v1/log.php", {}, reqBody).then(res => console.log(res));
  }

  createListeners() {
    this.#notificationOpenedListener = this.onNotificationOpenedListener();
    this.#notificationDisplayedListener = this.onNotificationDisplayedListener();
    this.#notificationListener = this.onNotificationListener();
    this.#messageListener = this.onMessageListener();
    this.#tokenRefreshListener = this.onTokenRefreshListener();
  }
}

const wdcPush = new WDCPush();
export default wdcPush;

export let backgroundMessaging = async (message: RemoteMessage) => {
  // handle your message
  console.log(message);
  message._data = message.data;
  wdcPush.displayLocalNotification(message, true);
  return Promise.resolve();
};