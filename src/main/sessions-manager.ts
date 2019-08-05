import { session, app, ipcMain } from 'electron';
import { ExtensibleSession } from 'electron-extensions';
import { getPath, makeId } from '~/utils';
import { promises } from 'fs';
import { resolve } from 'path';
import { WindowsManager } from './windows-manager';
import { runAdblockService } from './services';
import storage from './services/storage';

export class SessionsManager {
  public view = session.fromPartition('persist:view');
  public viewIncognito = session.fromPartition('view_incognito');

  public extensions = new ExtensibleSession(this.view);
  public extensionsIncognito = new ExtensibleSession(this.viewIncognito);

  constructor(public windowsManager: WindowsManager) {
    this.loadExtensions();

    this.clearCache('incognito');

    this.view.setPermissionRequestHandler(
      async (webContents, permission, callback, details) => {
        if (permission === 'fullscreen') {
          callback(true);
        } else {
          try {
            const window = windowsManager.findWindowByBrowserView(
              webContents.id,
            );
            const response = await window.permissionWindow.requestPermission(
              permission,
              webContents.getURL(),
              details,
            );
            callback(response);
          } catch (e) {
            callback(false);
          }
        }
      },
    );

    this.view.on('will-download', (event, item, webContents) => {
      const fileName = item.getFilename();
      const savePath = resolve(app.getPath('downloads'), fileName);
      const id = makeId(32);
      const window = windowsManager.findWindowByBrowserView(webContents.id);

      item.setSavePath(savePath);

      window.webContents.send('download-started', {
        fileName,
        receivedBytes: 0,
        totalBytes: item.getTotalBytes(),
        savePath,
        id,
      });

      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          console.log('Download is interrupted but can be resumed');
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            console.log('Download is paused');
          } else {
            window.webContents.send('download-progress', {
              id,
              receivedBytes: item.getReceivedBytes(),
            });
          }
        }
      });
      item.once('done', (event, state) => {
        if (state === 'completed') {
          window.webContents.send('download-completed', id);
        } else {
          console.log(`Download failed: ${state}`);
        }
      });
    });

    ipcMain.on('clear-browsing-data', () => {
      this.clearCache('normal');
      this.clearCache('incognito');
    });

    runAdblockService(this.view);
    runAdblockService(this.viewIncognito);
    storage.run();
  }

  clearCache(session: 'normal' | 'incognito') {
    const ses = session === 'incognito' ? this.viewIncognito : this.view;

    ses.clearCache().catch(err => {
      console.error(err);
    });

    ses.clearStorageData({
      storages: [
        'appcache',
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'websql',
        'serviceworkers',
        'cachestorage',
      ],
    });
  }

  public async loadExtensions() {
    const extensionsPath = getPath('extensions');
    const dirs = await promises.readdir(extensionsPath);

    for (const dir of dirs) {
      this.extensions.loadExtension(resolve(extensionsPath, dir));
      this.extensionsIncognito.loadExtension(resolve(extensionsPath, dir));
    }

    const extension = await this.extensions.loadExtension(
      resolve(__dirname, 'extensions/wexond-darkreader'),
    );

    extension.backgroundPage.webContents.openDevTools();
  }
}
