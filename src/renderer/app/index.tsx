import React from 'react';
import { ipcRenderer, remote } from 'electron';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { injectGlobal } from 'styled-components';

import { Style } from '../styles';
import { runServices } from '@/services/app';
import App from './components/App';
import store from '@app/store';

injectGlobal`${Style}`;

const render = (AppComponent: any) => {
  ReactDOM.render(
    <AppContainer>
      <AppComponent />
    </AppContainer>,
    document.getElementById('app'),
  );
};
(async function setup() {
  runServices();
  render(App);

  if (store.extensionsStore.defaultBrowserActions.length === 0) {
    await store.extensionsStore.load();
  }

  if (store.tabsStore.groups.length === 0) {
    const argv = remote.process.argv;

    store.tabsStore.addGroup();

    if (argv.length > 1 && argv[1] !== '.') {
      store.tabsStore.getSelectedTab().url = argv[1];
      store.pagesStore.getSelected().url = argv[1];
    }
  }

  ipcRenderer.send('renderer-load');
})();

// react-hot-loader
if ((module as any).hot) {
  (module as any).hot.accept();
}
