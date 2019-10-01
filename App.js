import React from 'react';
import { Alert, StyleSheet, Platform, Image, Text, View, Button, ScrollView } from 'react-native';
import WDCPush from "./wdc-push";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {};
    this.pushService = new WDCPush();
    this.pushService.init('<APIKEY>', this.dummyCallbackFunction)
      .then(res => {
        console.log('Everything is up and running!');
        this.pushService.setEmail("test@test.com");
      })
      .catch(err => console.log('Can\'t initiate the push service.', err))
  }

  dummyCallbackFunction (data) {
    console.log('Callback executed.', data);
  }

  componentDidMount() {
    this.pushService.requestPermissionAndGetToken().then(token => console.log(token)).catch(err => console.log(err));
    this.removeNotificationOpenedListener = this.pushService.onNotificationOpenedListener();
    this.removeNotificationDisplayedListener = this.pushService.onNotificationDisplayedListener();
    this.removeNotificationListener = this.pushService.onNotificationListener();
    this.removeMessageListener = this.pushService.onMessageListener();
    this.removeTokenRefreshListener = this.pushService.onTokenRefreshListener();
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
            this.pushService.requestPermissionAndGetToken().then((res) => {
              Alert.alert('Result', res);
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Check Permission'} onPress={() => {
            this.pushService.checkPermission().then((res) => {
              Alert.alert('Permission Status', res);
            }).catch((err) => {
              Alert.alert('Permission Status', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Request Permission'} onPress={() => {
            this.pushService.requestPermission().then((res) => {
              Alert.alert('Permission Request', res);
            }).catch((err) => {
              Alert.alert('Permission Request', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Get Token'} onPress={() => {
            this.pushService.getToken().then((token) => {
              console.log(token);
              Alert.alert('Token', token);
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'External Storage Access'} onPress={() => {
            this.pushService.checkExternalStoragePermission().then((res) => {
              Alert.alert('Permission Request', res);
            }).catch((err) => {
              Alert.alert('Permission Request', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Device Info'} onPress={() => {
            this.pushService.getDeviceInfo().then((res) => {
              Alert.alert('Device Info', JSON.stringify(res));
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Unsubscribe'} onPress={() => {
            this.pushService.unsubscribe().then((res) => {
              console.log("Unsubscribed")
            }).catch((err) => {
              console.log("Error when unsubscribing")
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Send Remote Push'} onPress={() => {
            this.pushService.requestFCMEndpoint('AAAAQ16OIbY:APA91bEg4Ee8OCeLVmx7BKhaKet1SjFyBvgGFvWl15MDykF_ezEbQifYtxamChytUdsqEi_maaz4GWt7LElPyTU2DERpj1AB1xtOycIoLw1-4DGk3ijSJI5BezrrsNDEB1Hi8w-eKM3U')
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