import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View, Easing, Animated, StyleSheet, Dimensions, ViewPropTypes } from 'react-native';

const styles = StyleSheet.create({
  background: {
    height: 5,
    overflow: 'hidden'
  },
  fill: {
    height: 5
  }
});

export default class ProgressBar extends PureComponent {
  static propTypes = {
    width: PropTypes.number,
    style: PropTypes.object,
    progress: PropTypes.number,
    fillStyle: ViewPropTypes.style,
    easingDuration: PropTypes.number
  };

  static defaultProps = {
    progress: 0,
    style: styles,
    easingDuration: 500,
    fillStyle: undefined,
    easing: Easing.inOut(Easing.ease),
    width: Dimensions.get('window').width
  };

  state = {
    progress: new Animated.Value(this.props.progress)
  };

  componentWillReceiveProps(prevProps) {
    if (prevProps.progress <= 1 && this.props.progress !== prevProps.progress) {
      this.update(prevProps.progress);
    }
  }

  update(progress) {
    Animated.timing(this.state.progress, {
      easing: this.props.easing,
      duration: this.props.easingDuration,
      toValue: progress > 1 ? 1 : progress
    }).start();
  }

  value() {
    return this.state.progress._value;
  }

  render() {
    const fillWidth = this.state.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        0 * (this.props.style.width || this.props.width),
        1 * Number(this.props.style.width || this.props.width)
      ]
    });

    return (
      <View
        style={[{ backgroundColor: '#FFF' }, styles.background, this.props.style]}
      >
        <Animated.View
          style={[
            { backgroundColor: '#393' },
            styles.fill,
            this.props.fillStyle,
            { width: fillWidth }
          ]}
        />
      </View>
    );
  }
}