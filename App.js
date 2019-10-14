import React, { useEffect , useState} from 'react';
import {Alert, StyleSheet, Platform, Image, Text, View, Button, Switch, AsyncStorage} from 'react-native';
import PushService from "./wdc-push";

export default App = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    PushService.init({
      apiKey: 'zx5v6DMOJSsR711HSmqsWmnWBteZ1a2pwXLvrn906rI3jAA1MR',
      userEmail: '',
      bundleId: 'com.rnpush',
      callbackAfterTap: function (data) {
        console.log('Callback executed.', data);
      }
    })
      .then(async (res) => {
        console.log('Everything is up and running!');
        setIsSubscribed(await PushService.checkIfSubscribed());
        // PushService.requestPermissionAndGetToken().then(token => console.log(token)).catch(err => console.log(err));
        // PushService.setEmail("test@test.com");
        // PushService.setCallback(this.dummyCallbackFunction)
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
    mainText: {
      fontSize: 20,
      textAlign: 'center',
      margin: 10,
    },
    modules: {
      margin: 5
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.mainText}>WDC Push{'\n'} React Native w/ Firebase</Text>
      <View style={styles.modules}>
        <Switch onValueChange = {(newValue) => {
          if(newValue) {
            PushService.requestPermissionAndGetToken().then((res) => {
              Alert.alert('Result', res);
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }else {
            PushService.unsubscribe().then((res) => {
              console.log("Unsubscribed")
            }).catch((err) => {
              console.log("Error when unsubscribing")
            })
          }
          setIsSubscribed(newValue);
        }} value = {isSubscribed}/>
      </View>
      {/*<View style={styles.modules}>
        <Button title={'Request Perm. and Get Token'} onPress={() => {
          PushService.requestPermissionAndGetToken().then((res) => {
            setIsSubscribed(true);
            Alert.alert('Result', res);
          }).catch((err) => {
            Alert.alert('Error', err)
          })
        }}/>
      </View>*/}
      <View style={styles.modules}>
        <Button title={'Check Permission'} onPress={() => {
          PushService.checkPermission().then((res) => {
            Alert.alert('Permission Status', res);
          }).catch((err) => {
            Alert.alert('Permission Status', err)
          })
        }}/>
      </View>
      <View style={styles.modules}>
        <Button title={'Request Permission'} onPress={() => {
          PushService.requestPermission().then((res) => {
            Alert.alert('Permission Request', res);
          }).catch((err) => {
            Alert.alert('Permission Request', err)
          })
        }}/>
      </View>
      <View style={styles.modules}>
        <Button title={'Get Token'} onPress={() => {
          PushService.getToken().then((token) => {
            setIsSubscribed(true);
            console.log(token);
            Alert.alert('Token', token);
          }).catch((err) => {
            Alert.alert('Error', err)
          })
        }}/>
      </View>
      <View style={styles.modules}>
        <Button title={'Device Info'} onPress={() => {
          PushService.getDeviceInfo().then((res) => {
            console.log(res);
            Alert.alert('Device Info', JSON.stringify(res));
          }).catch((err) => {
            Alert.alert('Error', err)
          })
        }}/>
      </View>
      {/*<View style={styles.modules}>
        <Button title={'Unsubscribe'} onPress={() => {
          PushService.unsubscribe().then((res) => {
            setIsSubscribed(false);
            console.log("Unsubscribed")
          }).catch((err) => {
            console.log("Error when unsubscribing")
          })
        }}/>
      </View>*/}
      <View style={styles.modules}>
        <Button title={'Send Remote Push'} onPress={() => {
          PushService.requestFCMEndpoint('AAAAQ16OIbY:APA91bEg4Ee8OCeLVmx7BKhaKet1SjFyBvgGFvWl15MDykF_ezEbQifYtxamChytUdsqEi_maaz4GWt7LElPyTU2DERpj1AB1xtOycIoLw1-4DGk3ijSJI5BezrrsNDEB1Hi8w-eKM3U')
            .then((res) => {
              setIsSubscribed(true);
              console.log('Fetch result: ', res);
            })
            .catch((err) => {
              console.log(err);
            })
        }}/>
      </View>
      <View style={styles.modules}>
        <Button title={'Check local storage'} onPress={async () => {
          let fcmToken = await AsyncStorage.getItem('fcmToken');
          alert(fcmToken);
        }}/>
      </View>
      <View style={styles.modules}>
        <Button title={'Delete local storage'} onPress={async () => {
          AsyncStorage.removeItem('fcmToken')
            .then((res) => {
            Alert.alert('Deleted');
          })
            .catch((err) => {
              Alert.alert('Error', err);
            })
        }}/>
      </View>
      <View style={styles.modules}>
        <Button title={'Open Settings (IOS)'} onPress={async () => {
          await PushService.goToNotificationSettings();
        }}/>
      </View>
    </View>
  );
}