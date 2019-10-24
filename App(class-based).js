import React from 'react';
import { Alert, StyleSheet, Platform, Image, Text, View, Button, ScrollView } from 'react-native';
import PushService from "./setrow-rn-push";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {};
    PushService.init('zx5v6DMOJSsR711HSmqsWmnWBteZ1a2pwXLvrn906rI3jAA1MR', '', this.dummyCallbackFunction)
      .then(res => {
        console.log('Everything is up and running!');
        // PushService.setEmail("test@test.com");
        // PushService.setCallback(this.dummyCallbackFunction)
      })
      .catch(err => console.log('Can\'t initiate the push service.', err))
  }

  dummyCallbackFunction (data) {
    console.log('Callback executed.', data);
  }

  componentDidMount() {
    PushService.requestPermissionAndGetToken().then(token => console.log(token)).catch(err => console.log(err));
    this.removeNotificationOpenedListener = PushService.onNotificationOpenedListener();
    this.removeNotificationDisplayedListener = PushService.onNotificationDisplayedListener();
    this.removeNotificationListener = PushService.onNotificationListener();
    this.removeMessageListener = PushService.onMessageListener();
    this.removeTokenRefreshListener = PushService.onTokenRefreshListener();
  }

  componentWillUnmount() {
    this.removeNotificationDisplayedListener();
    this.removeNotificationListener();
    this.removeNotificationOpenedListener();
    this.removeMessageListener();
    this.removeTokenRefreshListener();
  }

  render() {
    return (
      <View style={styles.container}>
        <Image source={require('./assets/wdc.png')}/>
        <Text style={styles.welcome}>
          WDC Push{'\n'} React Native w/ Firebase
        </Text>
        <View style={styles.modules}>
          <Button title={'Init'} onPress={() => {
            PushService.requestPermissionAndGetToken().then((res) => {
              Alert.alert('Result', res);
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
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
              console.log(token);
              Alert.alert('Token', token);
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'External Storage Access'} onPress={() => {
            PushService.checkExternalStoragePermission().then((res) => {
              Alert.alert('Permission Request', res);
            }).catch((err) => {
              Alert.alert('Permission Request', err)
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
        <View style={styles.modules}>
          <Button title={'Unsubscribe'} onPress={() => {
            PushService.unsubscribe().then((res) => {
              console.log("Unsubscribed")
            }).catch((err) => {
              console.log("Error when unsubscribing")
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Send Remote Push'} onPress={() => {
            PushService.requestFCMEndpoint('AAAAQ16OIbY:APA91bEg4Ee8OCeLVmx7BKhaKet1SjFyBvgGFvWl15MDykF_ezEbQifYtxamChytUdsqEi_maaz4GWt7LElPyTU2DERpj1AB1xtOycIoLw1-4DGk3ijSJI5BezrrsNDEB1Hi8w-eKM3U')
              .then((res) => {
                console.log('Fetch result: ', res);
              })
              .catch((err) => {
                console.log(err);
              })
          }}/>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  modules: {
    margin: 10,
  },
  modulesHeader: {
    fontSize: 16,
    marginBottom: 8,
  },
  module: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  }
});