# Introduction
In this module, it's intended to make it possible for Setrow customers who use React Native to send push notifications to their users.

# Pre-Install
## 1) Create Firebase Project
First of all, you have to create a Google Firebase Project [here](https://console.firebase.google.com/) (It's free)

![](https://thefinnternet.com/static/5c9a91c7e6e006e80935cf165d34f952/782f4/create_project.png)

## 2) Add Apps
Add iOS and Android apps as per your requirement

![](https://thefinnternet.com/static/7c51faa74315345e378c5c29c165e7d0/3bb78/add_app.png)

## 3) Register Android
The Android Package Name can be found in /android/app/build.grade as applicationId. Defaults to com.project_name

![](https://thefinnternet.com/static/6be90f0d5c41813bd048830e351f6cbe/b9e4f/register_android.png)

#### Download google-services.json
A google-services.json file contains all of the information required by the Firebase Android SDK to connect to your Firebase project. 

After creating your Android app, you'll be prompted to download the google-services.json file. Once downloaded, place this file in the root of your project at <b>android/app/google-services.json.</b>

![](https://thefinnternet.com/static/b965d3dc9e57bfe4ab250388ff125eb8/0783d/android_dir.png)

(For more details, check the official Firebase docs [here](https://firebase.google.com/docs/android/setup#console).)

## 4) Register iOS
Essentially the same as Android but grab the bundle id from the project in XCode.

#### Download GoogleService-Info.plist
A GoogleService-Info.plist file contains all of the information required by the Firebase iOS SDK to connect to your Firebase project.

Once downloaded, add the file to your iOS app using 'File > Add Files to "[YOUR APP NAME]"…' in XCode.

(For more details, check the official Firebase docs [here](https://firebase.google.com/docs/ios/setup#add_firebase_to_your_app))

#### Upload APNS Keys
In Firebase console, you have to include either APNs Authentication Key or APNs Certificate in Project Settings > Cloud Messaging in order to receive push notifications.

![](https://i.ibb.co/stLBbJN/apns-auth-key.png)

(For more details, check the official Firebase docs [here](https://firebase.google.com/docs/cloud-messaging/ios/certs) to see how you can create these keys.)

# Installation
    $ npm install @setrow/setrow-rn-push --save
    
# Post-Install
After installation, run the following command:

    $ react-native link react-native-firebase
    
### Android specific steps
1- Your <b>android/app/build.gradle</b> file should look like the following:

    dependencies {
        implementation project(':react-native-device-info')
        implementation project(':react-native-firebase')
        //...
        implementation "com.google.firebase:firebase-analytics:17.2.0"
        implementation "com.google.firebase:firebase-messaging:20.0.0"
        //...
      
      // Add the following to the VERY BOTTOM of the file
      apply plugin: 'com.google.gms.google-services'

2- In <b>android/gradle/wrapper/gradle-wrapper.properties</b>, make sure your Gradle version is at least v4.4 or above. If not, update the gradle URL to gradle-5.4.1-all.zip

3- Your <b>android/build.gradle</b> should look like the following:

    buildscript {
        repositories {
            google()  // <-- Check this line exists and is above jcenter
            jcenter()
            // ...
        }
        dependencies {
            classpath("com.android.tools.build:gradle:3.4.1")
            classpath 'com.google.gms:google-services:4.2.0'
            // ...
        }
    }
    allprojects {
        repositories {
            mavenLocal()
            google() // <-- Add this line above jcenter
            jcenter()
            maven {
                // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
                url "$rootDir/../node_modules/react-native/android"
            }
            maven {
                // Android JSC is installed from npm
                url("$rootDir/../node_modules/jsc-android/dist")
            }
        }
    }

4- Your <b>MainApplication.java</b> should like following:

    //...
    import com.learnium.RNDeviceInfo.RNDeviceInfo;
    import io.invertase.firebase.RNFirebasePackage;
    import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
    import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
    
    //...
    
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
        //...
        packages.add(new RNFirebaseMessagingPackage());
        packages.add(new RNFirebaseNotificationsPackage());
      return packages;
    }


5- Your <b>AndroidManifest.xml</b> should include following lines:

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <application
    android:launchMode="singleTop">
    
    <service android:name="io.invertase.firebase.messaging.RNFirebaseMessagingService">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
    <service android:name="io.invertase.firebase.messaging.RNFirebaseInstanceIdService">
        <intent-filter>
            <action android:name="com.google.firebase.INSTANCE_ID_EVENT" />
        </intent-filter>
    </service>
    <service android:name="io.invertase.firebase.messaging.RNFirebaseBackgroundMessagingService" />

6- Your <b>/app/settings.gradle</b> file should look like this:

    //...
    include ':react-native-device-info'
    project(':react-native-device-info').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-device-info/android')
    include ':react-native-firebase'
    project(':react-native-firebase').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-firebase/android')
    apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
    include ':app'


### iOS specific steps
Turn on following two capabilities in Xcode:

a) Push Notifications

b) Background Modes - Check only Remote Notifications

![](https://miro.medium.com/max/701/1*7_iXN53EFpp1GcKSvqgqXg.jpeg)

Make sure your Podfile includes the lines below and then run `pod install`

    # Uncomment the line below to define a global platform for your project
    platform :ios, '9.0'
    
    target 'ReactPushNotifications' do
      # Uncomment the next line if you're using Swift or would like to use dynamic frameworks
      # use_frameworks!
      
      #pod 'RNFirebase', :path => '../node_modules/react-native-firebase'
      pod 'Firebase/Analytics'
      pod 'Firebase/Messaging'
      pod 'RNDeviceInfo', :path => '../node_modules/react-native-device-info'
    end

Your AppDelegate should look like the following:

    // ios/Notifications/AppDelegate.m
    
    #import <Firebase.h>
    #import "RNFirebaseNotifications.h"
    #import "RNFirebaseMessaging.h"
    
    //...
    
    @implementation AppDelegate
    
    - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
    {
      //...
      [FIRApp configure];
      [RNFirebaseNotifications configure];
      //...
    }
    
    //...
    
    - (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification {
      [[RNFirebaseNotifications instance] didReceiveLocalNotification:notification];
    }
    
    - (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo
    fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
      [[RNFirebaseNotifications instance] didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
    }
    
    - (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
      [[RNFirebaseMessaging instance] didRegisterUserNotificationSettings:notificationSettings];
    }
    
    -(void) userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
        [[RNFirebaseMessaging instance] didReceiveRemoteNotification:response.notification.request.content.userInfo];
        completionHandler();
    }
    
    //...
    
    @end

# Import
    import PushService from "@setrow/setrow-rn-push";

# Usage
You should first call the <b>init</b> function and pass the required parameters in an object like below:

    PushService.init({
              apiKey: '<YOUR_SETROW_API_KEY>',  // Required
              bundleId: '<YOUR_BUNDLE_ID>',     // Optional
              userEmail: '',                    // Optional
              callbackAfterTap: function (data) {
                // Optional
                // Here, you can process the data you set when creating the notification
                // For example, you can do stuff like navigation accroding to data object
              }
            })
              .then((res) => {
                // Everything is up and running! You can now proceed to subscribe your users like below:
                PushService.requestPermissionAndGetToken().then(token => console.log(token)).catch(err => console.log(err));
              })
              .catch(err => console.log('Can\'t initiate the push service.', err))

# Example
    import React, { useEffect , useState} from 'react';
    import {Alert, StyleSheet, View, Switch} from 'react-native';
    import PushService from '@setrow/setrow-rn-push';
    
    export default App = () => {
      const [isSubscribed, setIsSubscribed] = useState(false);
    
      useEffect(() => {
        PushService.init({
          apiKey: '<YOUR_SETROW_API_KEY>'
        })
          .then(async (res) => {
            setIsSubscribed(await PushService.checkIfSubscribed());
          })
          .catch(err => console.log('Can\'t initiate the push service.', err))
      }, []);
    
      const styles = StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5FCFF'
        },
        modules: {
          margin: 5
        }
      });
    
      return (
        <View style={styles.container}>
          <View style={styles.modules}>
            <Switch onValueChange = {(newValue) => {
              if(newValue) {
                PushService.requestPermissionAndGetToken()
                .then(res => Alert.alert('Result', res))
                .catch(err => Alert.alert('Error', err))
              }else {
                PushService.unsubscribe()
                  .then(res => console.log("Unsubscribed"))
                  .catch(err => console.log("Error when unsubscribing"))
              }
              setIsSubscribed(newValue);
            }} value = {isSubscribed}/>
          </View>
        </View>
      );
    }

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [SetrowRNPush](#setrowrnpush)
    -   [init](#init)
        -   [Parameters](#parameters)
    -   [setEmail](#setemail)
        -   [Parameters](#parameters-1)
    -   [setCallback](#setcallback)
        -   [Parameters](#parameters-2)
    -   [validateEmail](#validateemail)
        -   [Parameters](#parameters-3)
    -   [requestPermissionAndGetToken](#requestpermissionandgettoken)
    -   [checkPermission](#checkpermission)
    -   [requestPermission](#requestpermission)
    -   [getToken](#gettoken)
    -   [checkExternalStoragePermission](#checkexternalstoragepermission)
    -   [sendRequest](#sendrequest)
        -   [Parameters](#parameters-4)
    -   [requestFCMEndpoint](#requestfcmendpoint)
        -   [Parameters](#parameters-5)
    -   [getDeviceInfo](#getdeviceinfo)
    -   [displayLocalNotification](#displaylocalnotification)
        -   [Parameters](#parameters-6)
    -   [unsubscribe](#unsubscribe)
    -   [checkIfSubscribed](#checkifsubscribed)
    -   [goToNotificationSettings](#gotonotificationsettings)
    -   [createListeners](#createlisteners)
-   [backgroundMessaging](#backgroundmessaging)
    -   [Parameters](#parameters-7)

## SetrowRNPush

React Native Push Notification Service for Setrow Customers

### init

Initiate Push Notification Service

#### Parameters

-   `config`  {object} Config object
    -   `config.apiKey`  {String} Your Setrow API Key
    -   `config.userEmail`  {String} Device user's email (optional, default `''`)
    -   `config.bundleId`  {String} Your iOS Bundle ID (optional, default `''`)
    -   `config.callbackAfterTap`  {function} The callback to run after notification tap (optional, default `function(){}`)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** 

### setEmail

Set email for current user

#### Parameters

-   `email`  {string} Email

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** 

### setCallback

Set callback to run after notification tappings

#### Parameters

-   `callback`  {function}

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** 

### validateEmail

Validate email

#### Parameters

-   `email`  {string} Email

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### requestPermissionAndGetToken

Subscribe the user. Request permission for notifications and get FCM Token as promise resolves.

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** Resolves with FCM Token

### checkPermission

Check whether the user has permission for notifications or not.

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 

### requestPermission

Request permission for notifications

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 

### getToken

Retrieve FCM token for current subscription. Note that this function should be called after permission request

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** Resolves with FCM Token on success

### checkExternalStoragePermission

Check the permission for external storage access

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** 

### sendRequest

Make request to a URL specified

#### Parameters

-   `url`  {string}
-   `headers`  {Object}
-   `body`  {Object}
-   `method`  {string} (optional, default `'POST'`)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** 

### requestFCMEndpoint

Send notification to user.

#### Parameters

-   `appServerKey`  {string} Firebase Server Key
-   `data`  {Object} Check <https://firebase.google.com/docs/cloud-messaging/http-server-ref> for more.

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** 

### getDeviceInfo

Get device information

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** Resolves with device info object

### displayLocalNotification

Display notification. For Android, dataOnly value must be set to true.

#### Parameters

-   `notification` **[Notification](https://developer.mozilla.org/docs/Web/API/Notification/Using_Web_Notifications)** {Notification}
-   `dataOnly`  {boolean} (optional, default `false`)

### unsubscribe

Unsubscribe the user

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;R>** 

### checkIfSubscribed

Check if the user is subscribed or not

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### goToNotificationSettings

iOS Only! - Open notification settings for the app. BundleID should be set first.

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;void>** 

### createListeners

Create the event-listeners to handle notification displays/taps

## backgroundMessaging

Background Messaging Task

### Parameters

-   `message` **RemoteMessage** {RemoteMessage} FCM message

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;resolve>** 
