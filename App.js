import React from 'react';
import { Alert, StyleSheet, Platform, Image, Text, View, Button, ScrollView } from 'react-native';
import SetrowPush from "./SetrowPush";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  async componentDidMount() {
    await SetrowPush.init('<APIKEY>', (data) => {
      console.log('Dummy callback executed.', data);
    });
    this.removeNotificationOpenedListener = SetrowPush.onNotificationOpenedListener((data) => {
      console.log('Dummy callback executed.', data);
    });
    this.removeNotificationDisplayedListener = SetrowPush.onNotificationDisplayedListener();
    this.removeNotificationListener = SetrowPush.onNotificationListener();
    this.removeMessageListener = SetrowPush.onMessageListener();
    this.removeTokenRefreshListener = SetrowPush.onTokenRefreshListener();
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
          <Button title={'Check Permission'} onPress={() => {
            SetrowPush.checkPermission().then((res) => {
              Alert.alert('Permission Status', res);
            }).catch((err) => {
              Alert.alert('Permission Status', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Request Permission'} onPress={() => {
            SetrowPush.requestPermission().then((res) => {
              Alert.alert('Permission Request', res);
            }).catch((err) => {
              Alert.alert('Permission Request', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Get Token'} onPress={() => {
            SetrowPush.getToken().then((token) => {
              console.log(token);
              Alert.alert('Token', token);
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'External Storage Access'} onPress={() => {
            SetrowPush.checkExternalStoragePermission().then((res) => {
              Alert.alert('Permission Request', res);
            }).catch((err) => {
              Alert.alert('Permission Request', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Device Info'} onPress={() => {
            SetrowPush.getDeviceInfo().then((res) => {
              Alert.alert('Device Info', JSON.stringify(res));
            }).catch((err) => {
              Alert.alert('Error', err)
            })
          }}/>
        </View>
        <View style={styles.modules}>
          <Button title={'Send Remote Push'} onPress={() => {
            SetrowPush.requestFCMEndpoint('AAAAQ16OIbY:APA91bEg4Ee8OCeLVmx7BKhaKet1SjFyBvgGFvWl15MDykF_ezEbQifYtxamChytUdsqEi_maaz4GWt7LElPyTU2DERpj1AB1xtOycIoLw1-4DGk3ijSJI5BezrrsNDEB1Hi8w-eKM3U')
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
    margin: 20,
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