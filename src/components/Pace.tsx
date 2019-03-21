import * as React from 'react';
import { PaceProps, PaceState, NetworkingEventListener } from '../types';
import createNetworkingEventListener from '../utils/networking';

const STATUS_IDLE = 'IDLE';
const STATUS_START = 'START';
const STATUS_DONE = 'DONE';

export default class PaceProvider extends React.Component<PaceProps, PaceState> {
  public static defaultProps: PaceProps = {
    tick: 100,
    resetDelay: 1000,
    config: {},
  };

  public state: PaceState = {
    progress: 0,
    status: STATUS_IDLE,
  };

  private event?: NetworkingEventListener = undefined;
  private interval?: number = undefined;
  private counter: number = 0;

  constructor(props) {
    super(props);
    this.event = createNetworkingEventListener(props.config);
  }

  public componentDidMount() {
    if (this.event) {
      this.event.addListener('onSend', this.handleOnSend);
      this.event.addListener('onResponse', this.handleOnResponse);
    }
  }

  public componentWillUnmount() {
    if (this.event) {
      this.event.removeListener('onSend', this.handleOnSend);
      this.event.removeListener('onResponse', this.handleOnResponse);
    }
  }

  public render() {
    return this.isChildrenAFunction() ? this.props.children(this.state) : this.props.children;
  }

  private isChildrenAFunction = (): boolean => {
    return typeof this.props.children === 'function';
  };

  private handleOnSend = (): void => {
    if (this.counter === 0) {
      this.setState({
        progress: 0,
        status: STATUS_START,
      });
    }
    this.counter++;
    this.startInterval();
  };

  private handleOnResponse = (): void => {
    this.counter--;
    if (this.counter === 0) {
      this.stopInterval();
    }
  };

  private getDiff = (progress): number => {
    let amount = 0;
    if (progress >= 0 && progress < 20) {
      amount = 10;
    } else if (progress >= 20 && progress < 50) {
      amount = 4;
    } else if (progress >= 50 && progress < 80) {
      amount = 2;
    } else if (progress >= 80 && progress < 99) {
      amount = 0.5;
    }
    return amount;
  };

  private startInterval = (): void => {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.setState(({ progress }) => {
        const diff = this.getDiff(progress);
        const newProgress = Math.min(Math.round(progress + diff), 94);
        return {
          progress: newProgress,
        };
      });
    }, Math.max(7 * this.props.tick * Math.random(), this.props.tick));
  };

  private stopInterval = (): void => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.setState({
      progress: 100,
      status: STATUS_DONE,
    });
    setTimeout(() => {
      this.setState({
        progress: 0,
        status: STATUS_IDLE,
      });
    }, this.props.resetDelay);
  };
}
