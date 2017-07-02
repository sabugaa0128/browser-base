'use strict'
import '../../app.scss'
import './global'

import Component from '../../classes/Component'
import UI from '../../classes/UI'

import Tabs from '../../components/Tabs'
import Bar from '../../components/Bar'
import Menu from '../../components/Menu'

class App extends Component {
  constructor() {
    super()
  }

  beforeRender() {
    window.app = this

    this.cursor = {}
  }

  render() {
    return (
      <div>
        <Tabs ref='tabs' />
        <Bar ref='bar' />
        <div className='pages' ref='pages' />
        <Menu showNavigationIcons={true} ref='webviewMenu' />
        <Menu showNavigationIcons={true} ref='tabMenu' />
        <Menu ref='menu' />
      </div>
    )
  }

  afterRender() {
    const self = this
    this.elements.tabs.addTab()

    window.addEventListener('mousedown', (e) => {
      self.elements.webviewMenu.hide()
      self.elements.menu.hide()
      self.elements.tabMenu.hide()
    })

    this.elements.tabs.elements.tabbar.addEventListener('context-menu', (e) => {
      if (e.target === self.elements.tabs.elements.addButton) return

      const tabMenu = self.elements.tabMenu

      let newItems = webviewMenu.menuItems

      newItems[10].enabled = (self.lastClosedURL !== '' && self.lastClosedURL != null)

      tabMenu.updateItems(newItems)
      tabMenu.show()

      let left = e.pageX + 1
      let top = e.pageY + 1

      if (left + 300 > window.innerWidth) {
        left = e.pageX - 301
      }
      if (top + tabMenu.height > window.innerHeight) {
        top = e.pageY - tabMenu.height
      }
      if (top < 0) {
        top = 96
      }

      tabMenu.setPosition(left, top)

      self.hoveredTab = self.tabs.getTabFromMousePoint(null, e.pageX, e.pageY)
    })

    this.elements.tabMenu.updateItems(
      [
        {
          title: 'Add new tab'
        },
        {
          title: 'Separator'
        },
        {
          title: 'Pin tab'
        },
        {
          title: 'Mute tab'
        },
        {
          title: 'Duplicate'
        },
        {
          title: 'Separator'
        },
        {
          title: 'Close tab'
        },
        {
          title: 'Close other tabs'
        },
        {
          title: 'Close tabs from left'
        },
        {
          title: 'Close tabs from right'
        },
        {
          title: 'Revert closed tab',
          enabled: false
        }
      ]
    )

    this.elements.menu.updateItems(
      [
        {
          title: 'New tab'
        },
        {
          title: 'New incognito window'
        },
        {
          title: 'Separator'
        },
        {
          title: 'History'
        },
        {
          title: 'Bookmarks'
        },
        {
          title: 'Downloads'
        },
        {
          title: 'Separator'
        },
        {
          title: 'Settings'
        },
        {
          title: 'Extensions'
        },
        {
          title: 'Developer tools'
        }
      ]
    )

    this.elements.webviewMenu.updateItems(
      [
        {
          title: 'Open link in new tab',
          show: false,
          onClick: (e) => {
            let data = self.WCMData
            self.elements.tabs.addTab({select: false, url: data.linkURL})
          }
        },
        {
          title: 'Separator',
          show: false
        },
        {
          title: 'Copy link address',
          show: false,
          onClick: (e) => {
            let data = self.WCMData
            clipboard.clear()
            clipboard.writeText(data.linkURL)
          }
        },
        {
          title: 'Save link as',
          show: false,
          onClick: (e) => {
            let data = self.WCMData

            dialog.showSaveDialog(
              {
                defaultPath: 'link.html',
                filters: [
                  {
                    name: '*.html',
                    extensions: ['html']
                  }
                ]
              },
              function (path1) {
                var request = new XMLHttpRequest()
                request.open('GET', data.linkURL, true)
                request.send(null)
                request.onreadystatechange = function () {
                  if (request.readyState === 4) {
                    fs.writeFile(path1, request.responseText, (err) => {
                      if (err) console.error(err)
                    })
                  }
                }
              }
            )
          }
        },
        {
          title: 'Separator',
          show: false
        },
        {
          title: 'Open image in new tab',
          show: false,
          onClick: (e) => {
            let data = self.WCMData
            self.elements.tabs.addTab({select: false, url: data.srcURL})
          }
        },
        {
          title: 'Save image as',
          show: false,
          onClick: (e) => {
            let data = self.WCMData
            let name = path.basename(data.srcURL)
            let extension = path.extname(name)

            var request = require('request').defaults({ encoding: null })
            request.get(data.srcURL, function (err, res, body) {
                dialog.showSaveDialog(
                  {
                    defaultPath: 'image.' + extension,
                    filters: [
                      {
                        name: '',
                        extensions: [extension]
                      }
                    ]
                  },
                  function (path1) {
                    fs.writeFile(path1, body, (err) => {
                      if (err) console.error(err)
                    })
                  }
                )
            })
          }
        },
        {
          title: 'Copy image',
          show: false,
          onClick: (e) => {
            let data = self.WCMData
            clipboard.clear()
            let img = nativeImage.createFromDataURL(data.srcURL)
            clipboard.writeImage(img)
          }
        },
        {
          title: 'Copy image address',
          show: false,
          onClick: (e) => {
            let data = self.WCMData
            clipboard.clear()
            clipboard.writeText(data.srcURL)
          }
        },
        {
          title: 'Separator',
          show: false
        },
        {
          title: 'Print',
          show: false,
          onClick: (e) => {
            self.getSelectedPage().elements.webview.print()
          }
        },
        {
          title: 'Save as',
          show: false,
          onClick: (e) => {
            dialog.showSaveDialog(
              {
                defaultPath: self.getSelectedPage().elements.webview.getTitle() + '.html',
                filters: [
                  {
                    name: 'Webpage, complete',
                    extensions: ['html']
                  }
                ]
              },
              function (path1) {
                self.getSelectedPage().elements.webview.getWebContents().savePage(path1, 'HTMLComplete', (error) => {
                  if (error) console.error(error)
                })
              }
            )
          }
        },
        {
          title: 'Separator',
          show: false
        },
        {
          title: 'View source',
          show: false,
          onClick: (e) => {
            const url = self.getSelectedPage().elements.webview.getURL()
            self.elements.tabs.addTab({select: true, url: 'view-source:' + url})
          }
        },
        {
          title: 'Inspect element',
          onClick: (e) => {
            let data = self.WCMData
            self.getSelectedPage().elements.webview.inspectElement(data.x, data.y)
          }
        }
      ]
    )
  }

  getSelectedTab() {
    return this.elements.tabs.selectedTab
  }

  getSelectedPage() {
    return this.getSelectedTab().page
  }
}

// Wait for sass load.
setTimeout(function () {
  UI.render(<App />, document.getElementById('app'))
}, 1)
