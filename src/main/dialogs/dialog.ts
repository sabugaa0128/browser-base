import { BrowserView, app, ipcMain } from 'electron';
import { join } from 'path';
import { AppWindow } from '../windows';

interface IOptions {
  name: string;
  devtools?: boolean;
  bounds?: IRectangle;
  hideTimeout?: number;
}

interface IRectangle {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export class Dialog extends BrowserView {
  public appWindow: AppWindow;

  public visible = false;

  public bounds: IRectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private timeout: any;
  private hideTimeout: number;

  public constructor(
    appWindow: AppWindow,
    { bounds, name, devtools, hideTimeout }: IOptions,
  ) {
    super({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this.appWindow = appWindow;
    this.bounds = { ...this.bounds, ...bounds };
    this.hideTimeout = hideTimeout;

    appWindow.addBrowserView(this);

    this._hide();

    ipcMain.on(`hide-${this.webContents.id}`, () => {
      this.hide();
    });

    if (process.env.ENV === 'dev') {
      this.webContents.loadURL(`http://localhost:4444/${name}.html`);
      if (devtools) {
        this.webContents.openDevTools({ mode: 'detach' });
      }
    } else {
      this.webContents.loadURL(
        join('file://', app.getAppPath(), `build/${name}.html`),
      );
    }
  }

  public rearrange(rect: IRectangle = {}) {
    this.bounds = {
      height: rect.height || this.bounds.height,
      width: rect.width || this.bounds.width,
      x: rect.x || this.bounds.x,
      y: rect.y || this.bounds.y,
    };

    if (this.visible) {
      this.setBounds(this.bounds as any);
    }
  }

  public toggle() {
    if (!this.visible) this.show(this.bounds);
    else this.hide();
  }

  public show(rect: IRectangle = {}) {
    this.visible = true;

    clearTimeout(this.timeout);

    this.rearrange(rect);

    this.appWindow.removeBrowserView(this);
    this.appWindow.addBrowserView(this);

    this.webContents.focus();
  }

  private _hide() {
    this.setBounds({
      height: this.bounds.height,
      width: 1,
      x: 0,
      y: -this.bounds.height + 1,
    });
  }

  public hide() {
    this.appWindow.removeBrowserView(this);
    this.appWindow.addBrowserView(this);

    clearTimeout(this.timeout);

    if (this.hideTimeout) {
      this.timeout = setTimeout(() => this._hide(), this.hideTimeout);
    } else {
      this._hide();
    }

    this.visible = false;
  }
}
