import * as XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
import * as events from 'events';
import { NetworkingEventListener, NetworkingOptions } from '../types';

/**
 * Don't include the response bodies for images by default.
 */
const DEFAULT_CONTENT_TYPES_RX = /^(image)\/.*$/i;

const DEFAULTS: NetworkingOptions = {};

export default function createNetworkingEventListener(pluginConfig: NetworkingOptions = {}): NetworkingEventListener {
  const networkingEvent = new events.EventEmitter();

  const options = Object.assign({}, DEFAULTS, pluginConfig);

  // a RegExp to suppess adding the body cuz it costs a lot to serialize
  const blackListContentTypes = options.blackListContentTypes || DEFAULT_CONTENT_TYPES_RX;

  // a XHR call tracker
  let counter = 1000;

  // a temporary cache to hold requests so we can match up the data
  const requestCache: any = {};

  /**
   * Fires when we talk to the server.
   *
   * @param {*} data - The data sent to the server.
   * @param {*} instance - The XMLHTTPRequest instance.
   */
  function onSend(data: any, xhr: any) {
    if (options.blackListUrls && options.blackListUrls.test(xhr._url)) {
      xhr._skip = true;
      return;
    }
    if (options.whiteListUrls && !options.whiteListUrls.test(xhr._url)) {
      xhr._skip = true;
      return;
    }

    // bump the counter
    counter++;

    // tag
    xhr._trackingName = counter;

    // cache
    requestCache[counter] = {
      data: data,
      xhr,
    };
    networkingEvent.emit('onSend', requestCache[counter]);
  }

  /**
   * Fires when the server gives us a response.
   *
   * @param {number} status - The HTTP response status.
   * @param {boolean} timeout - Did we timeout?
   * @param {*} response - The response data.
   * @param {string} url - The URL we talked to.
   * @param {*} type - Not sure.
   * @param {*} xhr - The XMLHttpRequest instance.
   */
  function onResponse(status: number, timeout: boolean, response: any, url: string, type: any, xhr: any) {
    if (xhr._skip) {
      return;
    }

    // fetch and clear the request data from the cache
    const rid = xhr._trackingName;
    const cachedRequest = requestCache[rid] || {};
    requestCache[rid] = null;

    // assemble the request object
    const { data } = cachedRequest;
    const tronRequest = {
      url: url || cachedRequest.xhr._url,
      method: xhr._method || null,
      data,
      headers: xhr._headers || null,
    };

    // what type of content is this?
    const contentType =
      (xhr.responseHeaders && xhr.responseHeaders['content-type']) ||
      (xhr.responseHeaders && xhr.responseHeaders['Content-Type']) ||
      '';

    const sendResponse = responseBodyText => {
      let body = `~~~ skipped ~~~`;
      if (responseBodyText) {
        try {
          // all i am saying, is give JSON a chance...
          body = JSON.parse(responseBodyText);
        } catch (boom) {
          body = response;
        }
      }
      const tronResponse = {
        body,
        status,
        headers: xhr.responseHeaders || null,
      };

      // send this off to Reactotron
      networkingEvent.emit('onResponse', tronRequest, tronResponse);
    };

    // can we use the real response?
    const useRealResponse =
      (typeof response === 'string' || typeof response === 'object') && !blackListContentTypes.test(contentType || '');

    // prepare the right body to send
    if (useRealResponse) {
      if (type === 'blob' && typeof FileReader !== 'undefined') {
        // Disable reason: FileReader should be in global scope since RN 0.54
        // eslint-disable-next-line no-undef
        const bReader = new FileReader();
        const brListener = () => {
          sendResponse(bReader.result);
          bReader.removeEventListener('loadend', brListener);
        };
        bReader.addEventListener('loadend', brListener);
        bReader.readAsText(response);
      } else {
        sendResponse(response);
      }
    } else {
      sendResponse('');
    }
  }

  // register our monkey-patch
  XHRInterceptor.setSendCallback(onSend);
  XHRInterceptor.setResponseCallback(onResponse);
  XHRInterceptor.enableInterception();

  // nothing of use to offer to the plugin
  return networkingEvent;
}
