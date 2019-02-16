import { BrowserView, ipcMain, app } from 'electron';
import { TOOLBAR_HEIGHT } from '~/renderer/app/constants/design';
import { appWindow } from '.';
import BrowserViewWrapper from './browser-view-wrapper';

declare const global: any;

global.viewsMap = {};

export class BrowserViewManager {
  public views: { [key: number]: BrowserViewWrapper } = {};
  public selectedId = 0;

  constructor() {
    ipcMain.on(
      'browserview-create',
      (e: Electron.IpcMessageEvent, tabId: number) => {
        this.create(tabId);

        appWindow.window.webContents.send(`browserview-created-${tabId}`);
      },
    );

    ipcMain.on(
      'browserview-select',
      (e: Electron.IpcMessageEvent, id: number) => {
        const view = this.views[id];
        this.select(id);
        view.updateNavigationState();
      },
    );

    ipcMain.on(
      'browserview-remove',
      (e: Electron.IpcMessageEvent, id: number) => {
        this.remove(id);
      },
    );

    ipcMain.on('browserview-call', (e: any, data: any) => {
      const view = this.views[data.tabId];
      const result = (view.webContents as any)[data.method].apply(
        view.webContents,
        data.args,
      );

      if (data.callId) {
        appWindow.window.webContents.send(
          `browserview-call-result-${data.callId}`,
          result,
        );
      }
    });

    ipcMain.on('browserview-hide', () => {
      this.hideView();
    });

    ipcMain.on('browserview-show', () => {
      this.showView();
    });

    setInterval(() => {
      for (const key in this.views) {
        const view = this.views[key];
        const title = view.webContents.getTitle();

        if (title !== view.title) {
          appWindow.window.webContents.send(
            `browserview-title-updated-${key}`,
            title,
          );
          view.title = title;
        }
      }
    }, 200);

    ipcMain.on('browserview-clear', () => {
      this.clear();
    });
  }

  public get selected() {
    return this.views[this.selectedId];
  }

  public create(tabId: number) {
    const view = new BrowserViewWrapper(tabId);
    this.views[tabId] = view;
    global.viewsMap[view.id] = tabId;
  }

  public clear() {
    appWindow.window.setBrowserView(null);
    for (const key in this.views) {
      this.remove(parseInt(key, 10));
    }
  }

  public select(tabId: number) {
    const view = this.views[tabId];
    this.selectedId = tabId;

    if (!view || view.isDestroyed()) {
      this.remove(tabId);
      appWindow.window.setBrowserView(null);
      return;
    }

    appWindow.window.setBrowserView(view);

    const { width, height } = appWindow.window.getContentBounds();
    view.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT + 1,
      width,
      height: height - TOOLBAR_HEIGHT,
    });
    view.setAutoResize({ width: true, height: true });
  }

  public hideView() {
    appWindow.window.setBrowserView(null);
  }

  public showView() {
    this.select(this.selectedId);
  }

  public remove(tabId: number) {
    const view = this.views[tabId];

    if (!view || view.isDestroyed()) {
      delete this.views[tabId];
      return;
    }

    if (appWindow.window.getBrowserView() === view) {
      appWindow.window.setBrowserView(null);
    }

    view.destroy();

    delete this.views[tabId];
  }
}
