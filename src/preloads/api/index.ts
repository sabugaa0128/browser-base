import { ipcRenderer } from 'electron';
import { format } from 'url';

import { Manifest } from '~/interfaces/manifest';
import IpcEvent from './ipc-event';
import WebRequestEvent from './web-request-event';
import {
  API_STORAGE_OPERATION,
  API_RUNTIME_CONNECT,
  API_PORT_POSTMESSAGE,
  API_I18N_OPERATION,
} from '~/constants/api-ipc-messages';
import { makeId } from '~/utils';

class Event {
  private callbacks: Function[] = [];

  public emit(...args: any[]) {
    this.callbacks.forEach(callback => {
      callback(...args);
    });
  }

  public addListener(callback: Function) {
    this.callbacks.push(callback);
  }

  public removeListener(callback: Function) {
    this.callbacks = this.callbacks.filter(x => x !== callback);
  }
}

class Port {
  public sender: chrome.runtime.MessageSender;
  public name: string;
  public onMessage = new Event();
  public onDisconnect = new Event();

  private portId: string;

  constructor(
    portId: string,
    name: string = null,
    sender: chrome.runtime.MessageSender = null,
  ) {
    if (sender) {
      this.sender = sender;
    }

    if (name) {
      this.name = name;
    }

    this.portId = portId;

    ipcRenderer.on(API_PORT_POSTMESSAGE + portId, (e: any, msg: any) => {
      this.onMessage.emit(msg, this);
    });
  }

  public postMessage(msg: any) {
    ipcRenderer.send(API_PORT_POSTMESSAGE, { portId: this.portId, msg });
  }
}

function readProperty(obj: any, prop: string) {
  return obj[prop];
}

const sendStorageOperation = (
  extensionId: string,
  arg: any,
  area: string,
  type: string,
  callback: any,
) => {
  const id = makeId(32);
  ipcRenderer.send(API_STORAGE_OPERATION, {
    extensionId,
    id,
    arg,
    type,
    area,
  });

  if (callback) {
    ipcRenderer.once(API_STORAGE_OPERATION + id, (e: any, ...data: any[]) => {
      console.log(...data);
      callback(...data);
    });
  }
};

const sendi18nOperation = (
  extensionId: string,
  type: string,
  callback: any,
) => {
  const id = makeId(32);
  ipcRenderer.send(API_I18N_OPERATION, {
    extensionId,
    id,
    type,
  });

  if (callback) {
    ipcRenderer.once(API_I18N_OPERATION + id, (e: any, ...data: any[]) => {
      callback(...data);
    });
  }
};

export const getAPI = (manifest: Manifest) => {
  // https://developer.chrome.com/extensions
  const api = {
    // https://developer.chrome.com/extensions/webNavigation
    webNavigation: {
      onBeforeNavigate: new IpcEvent('webNavigation', 'onBeforeNavigate'),
      onCommitted: new IpcEvent('webNavigation', 'onCommitted'),
      onDOMContentLoaded: new IpcEvent('webNavigation', 'onDOMContentLoaded'),
      onCompleted: new IpcEvent('webNavigation', 'onCompleted'),
      onCreatedNavigationTarget: new IpcEvent(
        'webNavigation',
        'onCreatedNavigationTarget',
      ),
      onReferenceFragmentUpdated: new IpcEvent(
        'webNavigation',
        'onReferenceFragmentUpdated',
      ), // TODO
      onTabReplaced: new IpcEvent('webNavigation', 'onTabReplaced'), // TODO
      onHistoryStateUpdated: new IpcEvent(
        'webNavigation',
        'onHistoryStateUpdated',
      ), // TODO
    },

    // https://developer.chrome.com/extensions/extension
    extension: {
      inIncognitoContext: false, // TODO
    },

    // https://developer.chrome.com/extensions/alarms
    alarms: {
      onAlarm: new IpcEvent('alarms', 'onAlarm'), // TODO
    },

    // https://developer.chrome.com/extensions/runtime
    runtime: {
      id: manifest.extensionId,
      lastError: undefined as string,

      onConnect: new Event(),

      connect: (extensionId: string = null, connectInfo: any = null) => {
        const sender: any = {
          id: manifest.extensionId,
        };
        const portId = makeId(32);

        let name: string = null;

        if (connectInfo) {
          if (connectInfo.includeTlsChannelId) {
            sender.tlsChannelId = portId;
          }
          name = connectInfo.name;
        }

        ipcRenderer.send(API_RUNTIME_CONNECT, {
          extensionId: manifest.extensionId,
          portId,
          sender,
          name,
        });

        return new Port(portId, name);
      },

      reload: () => {
        ipcRenderer.send('api-runtime-reload', manifest.extensionId);
      },
      getManifest: () => manifest,
      getURL: (path: string) =>
        format({
          protocol: 'wexond-extension',
          slashes: true,
          hostname: api.runtime.id,
          pathname: path,
        }),
    },

    // https://developer.chrome.com/extensions/webRequest
    webRequest: {
      onBeforeRequest: new WebRequestEvent('webRequest', 'onBeforeRequest'),
      onBeforeSendHeaders: new WebRequestEvent(
        'webRequest',
        'onBeforeSendHeaders',
      ),
      onHeadersReceived: new WebRequestEvent('webRequest', 'onHeadersReceived'),
      onSendHeaders: new WebRequestEvent('webRequest', 'onSendHeaders'),
      onResponseStarted: new WebRequestEvent('webRequest', 'onResponseStarted'),
      onBeforeRedirect: new WebRequestEvent('webRequest', 'onBeforeRedirect'),
      onCompleted: new WebRequestEvent('webRequest', 'onCompleted'),
      onErrorOccurred: new WebRequestEvent('webRequest', 'onErrorOccurred'),
    },

    // https://developer.chrome.com/extensions/tabs
    tabs: {
      get: (tabId: number, callback: (tab: chrome.tabs.Tab) => void) => {
        api.tabs.query({}, tabs => {
          callback(tabs.find(x => x.id === tabId));
        });
      },
      getCurrent: (callback: (tab: chrome.tabs.Tab) => void) => {
        ipcRenderer.sendToHost('api-tabs-getCurrent');

        ipcRenderer.once(
          'api-tabs-getCurrent',
          (e: Electron.IpcMessageEvent, data: chrome.tabs.Tab) => {
            callback(data);
          },
        );
      },
      query: (
        queryInfo: chrome.tabs.QueryInfo,
        callback: (tabs: chrome.tabs.Tab[]) => void,
      ) => {
        ipcRenderer.send('api-tabs-query');

        ipcRenderer.once(
          'api-tabs-query',
          (e: Electron.IpcMessageEvent, data: chrome.tabs.Tab[]) => {
            callback(
              data.filter(tab => {
                for (const key in queryInfo) {
                  const tabProp = readProperty(tab, key);
                  const queryInfoProp = readProperty(queryInfo, key);

                  if (tabProp == null || queryInfoProp !== tabProp) {
                    return false;
                  }
                }

                return true;
              }),
            );
          },
        );
      },
      create: (
        createProperties: chrome.tabs.CreateProperties,
        callback: (tab: chrome.tabs.Tab) => void = null,
      ) => {
        ipcRenderer.send('api-tabs-create', createProperties);

        if (callback) {
          ipcRenderer.once(
            'api-tabs-create',
            (e: Electron.IpcMessageEvent, data: chrome.tabs.Tab) => {
              callback(data);
            },
          );
        }
      },
      insertCSS: (
        tabId: number,
        details: chrome.tabs.InjectDetails,
        callback: () => void,
      ) => {
        ipcRenderer.send('api-tabs-insertCSS', tabId, details);

        ipcRenderer.on('api-tabs-insertCSS', () => {
          if (callback) {
            callback();
          }
        });
      },
      executeScript: (
        tabId: number,
        details: chrome.tabs.InjectDetails,
        callback: (result: any) => void,
      ) => {
        ipcRenderer.send('api-tabs-executeScript', tabId, details);

        ipcRenderer.on(
          'api-tabs-executeScript',
          (e: Electron.IpcMessageEvent, result: any) => {
            if (callback) {
              callback(result);
            }
          },
        );
      },
      setZoom: (tabId: number, zoomFactor: number, callback: () => void) => {
        ipcRenderer.send('api-tabs-setZoom', tabId, zoomFactor);

        ipcRenderer.on('api-tabs-setZoom', () => {
          if (callback) {
            callback();
          }
        });
      },
      getZoom: (tabId: number, callback: (zoomFactor: number) => void) => {
        ipcRenderer.send('api-tabs-getZoom', tabId);

        ipcRenderer.on(
          'api-tabs-getZoom',
          (e: Electron.IpcMessageEvent, zoomFactor: number) => {
            if (callback) {
              callback(zoomFactor);
            }
          },
        );
      },
      detectLanguage: (tabId: number, callback: (language: string) => void) => {
        ipcRenderer.send('api-tabs-detectLanguage', tabId);

        ipcRenderer.on(
          'api-tabs-detectLanguage',
          (e: Electron.IpcMessageEvent, language: string) => {
            if (callback) {
              callback(language);
            }
          },
        );
      },

      onCreated: new IpcEvent('tabs', 'onCreated'),
      onUpdated: new IpcEvent('tabs', 'onUpdated'),
      onActivated: new IpcEvent('tabs', 'onActivated'),
      onRemoved: new IpcEvent('tabs', 'onRemoved'),
    },

    // https://developer.chrome.com/extensions/storage
    storage: {
      local: {
        set: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'local', 'set', cb);
        },
        get: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'local', 'get', cb);
        },
        remove: (arg: any, cb: any) => {
          sendStorageOperation(
            manifest.extensionId,
            arg,
            'local',
            'remove',
            cb,
          );
        },
        clear: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'local', 'clear', cb);
        },
      },
      sync: {
        set: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'sync', 'set', cb);
        },
        get: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'sync', 'get', cb);
        },
        remove: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'sync', 'remove', cb);
        },
        clear: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'sync', 'clear', cb);
        },
      },
      managed: {
        get: (arg: any, cb: any) => {
          sendStorageOperation(manifest.extensionId, arg, 'managed', 'get', cb);
        },
      },
      onChanged: {},
    },

    // https://developer.chrome.com/extensions/i18n
    i18n: {
      getAcceptLanguages: (cb: any) => {
        sendi18nOperation(manifest.extensionId, 'get-accept-languages', cb);
      },
      getMessage: (messageName: string, substitutions: any) => {
        return ipcRenderer.sendSync(API_I18N_OPERATION, {
          extensionId: manifest.extensionId,
          messageName,
          substitutions,
          type: 'get-message',
        });
      },
      getUILanguage: () => {
        return ipcRenderer.sendSync(API_I18N_OPERATION, {
          extensionId: manifest.extensionId,
          type: 'get-ui-language',
        });
      },
    },

    browserAction: {
      onClicked: {
        addListener: () => {},
      },
      setBadgeText: (details: any, cb: any) => {
        console.log(details);
      },
    },
  };

  ipcRenderer.on(
    API_RUNTIME_CONNECT,
    (e: Electron.IpcMessageEvent, data: any) => {
      const { portId, sender, name } = data;
      const port = new Port(portId, name, sender);
      api.runtime.onConnect.emit(port);
    },
  );

  return api;
};
