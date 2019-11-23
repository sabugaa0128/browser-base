import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { platform } from 'os';

import { Bubble } from '../Bubble';
import {
  Actions,
  Line,
  MenuItem,
  MenuItems,
  Background,
  Content,
  Icon,
  MenuItemTitle,
  Shortcut,
} from './style';
import { icons } from '~/renderer/constants';
import store from '../../store';
import { ipcRenderer } from 'electron';
import { NEWTAB_URL } from '~/constants/tabs';

const changeContent = () => () => {
  // store.overlay.currentContent = content;
};

const onFindClick = () => {
  /*store.overlay.visible = false;

  ipcRenderer.send(
    `find-show-${store.windowId}`,
    store.tabs.selectedTab.id,
    store.tabs.selectedTab.findInfo,
  );*/
};

const onDarkClick = () => {
  store.settings.darkContents = !store.settings.darkContents;
  store.save();
};

const onShieldClick = () => {
  store.settings.shield = !store.settings.shield;
  store.save();
};

const onAlwaysClick = () => {
  // store.isAlwaysOnTop = !store.isAlwaysOnTop;
  // getCurrentWindow().setAlwaysOnTop(store.isAlwaysOnTop);
};

const onNewWindowClick = () => {
  ipcRenderer.send('create-window');
};

const onIncognitoClick = () => {
  ipcRenderer.send('create-window', true);
};

const addTab = (url: string) => () => {
  ipcRenderer.send(`add-tab-${store.windowId}`, { url, active: true });
  store.hide();
};

export const QuickMenu = observer(() => {
  const invert = true;

  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'column',
      }}
    >
      <Background></Background>
      <Content>
        <Actions>
          <Bubble
            // toggled={store.isAlwaysOnTop}
            toggled={false}
            onClick={onAlwaysClick}
            invert={invert}
            icon={icons.window}
          >
            Top Most
          </Bubble>
          <Bubble
            toggled={store.settings.darkContents}
            onClick={onDarkClick}
            invert={invert}
            icon={icons.night}
          >
            Dark
          </Bubble>
          <Bubble
            invert={invert}
            toggled={store.settings.shield}
            icon={icons.shield}
            onClick={onShieldClick}
          >
            Shield
          </Bubble>
        </Actions>
        <MenuItems>
          <MenuItem onClick={addTab(NEWTAB_URL)}>
            <Icon icon={icons.tab} />
            <MenuItemTitle>New tab</MenuItemTitle>
            <Shortcut>Ctrl+T</Shortcut>
          </MenuItem>
          <MenuItem onClick={onNewWindowClick}>
            <Icon icon={icons.window} />
            <MenuItemTitle>New window</MenuItemTitle>
            <Shortcut>Ctrl+N</Shortcut>
          </MenuItem>
          <MenuItem onClick={onIncognitoClick}>
            <Icon icon={icons.incognito} />
            <MenuItemTitle>New incognito window</MenuItemTitle>
            <Shortcut>Ctrl+Shift+N</Shortcut>
          </MenuItem>
          <Line />
          <MenuItem onClick={addTab('wexond://history')} arrow>
            <Icon icon={icons.history} />
            <MenuItemTitle>History</MenuItemTitle>
          </MenuItem>
          <MenuItem onClick={addTab('wexond://bookmarks')} arrow>
            <Icon icon={icons.bookmarks} />
            <MenuItemTitle>Bookmarks</MenuItemTitle>
          </MenuItem>
          <MenuItem onClick={addTab('wexond://downloads')}>
            <Icon icon={icons.download} />
            <MenuItemTitle>Downloads</MenuItemTitle>
          </MenuItem>
          <Line />
          <MenuItem onClick={addTab('wexond://settings')}>
            <Icon icon={icons.settings} />
            <MenuItemTitle>Settings</MenuItemTitle>
          </MenuItem>
          <MenuItem onClick={addTab('wexond://extensions')}>
            <Icon icon={icons.extensions} />
            <MenuItemTitle>Extensions</MenuItemTitle>
          </MenuItem>
          <Line />
          <MenuItem>
            <Icon icon={icons.find} />
            <MenuItemTitle>Find in page</MenuItemTitle>
            <Shortcut>Ctrl+F</Shortcut>
          </MenuItem>
          <MenuItem>
            <Icon icon={icons.print} />
            <MenuItemTitle>Print</MenuItemTitle>
            <Shortcut>Ctrl+P</Shortcut>
          </MenuItem>
        </MenuItems>
      </Content>
    </div>
  );
});
