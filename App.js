import React from 'react';
import { Alert, StyleSheet, Platform, Image, Text, View, Button, ScrollView } from 'react-native';
import SetrowPush from "./SetrowPush";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  async componentDidMount() {
    await SetrowPush.init();
    this.removeNotificationOpenedListener = SetrowPush.onNotificationOpenedListener();
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
        <Image source={require('./assets/wdc.png')} style={[styles.logo]}/>
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
              Alert.alert('Device Info', res);
            }).catch((err) => {
              Alert.alert('Error', err)
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
  logo: {
    height: 60,
    marginBottom: 16,
    marginTop: 64,
    padding: 10,
    width: 67.5,
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