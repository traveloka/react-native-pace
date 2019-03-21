/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { Component } from 'react';
import { SafeAreaView, FlatList, Button, Platform, StyleSheet, Text, View } from 'react-native';
import { Pace } from '@traveloka/react-native-pace';
import ProgressBar from './ProgressBar';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu',
});

export default class App extends Component {
  state = {
    fetches: [],
    fetchById: {},
  };

  handleFetch = () => {
    const id = Math.random();
    this.setState(({ fetches, fetchById }) => {
      const newFetches = [id].concat(fetches);
      fetch('http://slowwly.robertomurray.co.uk/delay/2000/url/http://www.google.co.uk').then(() => {
        this.setState(({ fetchById }) => ({
          fetchById: {
            ...fetchById,
            [id]: 'DONE',
          },
        }));
      });
      return {
        fetches: newFetches,
        fetchById: {
          ...fetchById,
          [id]: 'LOADING',
        },
      };
    });
  };

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Pace>
          {state => (
            <View style={styles.container}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: '100%', paddingVertical: 30 }}>
                  <ProgressBar progress={state.progress / 100} />
                </View>
                <Text style={styles.welcome}>{JSON.stringify(state)}</Text>
                <Button onPress={this.handleFetch} title="Fetch" />
              </View>
              <View style={{ flex: 1, padding: 6 }}>
                <FlatList
                  style={{ flex: 1 }}
                  keyExtractor={(_, idx) => String(idx)}
                  data={this.state.fetches}
                  extraData={this.state}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#AAA' }} />}
                  renderItem={({ item }) => <Text style={{ padding: 6 }}>{this.state.fetchById[item]}</Text>}
                />
              </View>
            </View>
          )}
        </Pace>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
});
