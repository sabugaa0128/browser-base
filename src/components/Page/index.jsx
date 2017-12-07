import Component from 'inferno-component'

import { connect } from 'inferno-mobx'
import Store from '../../store'

@connect
export default class Page extends Component {
  componentDidMount () {
    const tab = this.props.tab
    const page = this.props.page

    page.page = this

    const updateInfo = (e) => {
      Store.app.bar.refreshIconsState()

      if (e.url != null) {
        if (e.isMainFrame != null && !e.isMainFrame) return
        tab.url = e.url
        Store.url = e.url
        Store.app.bar.addressBar.setInfo(e.url)
      }
    }

    this.webview.addEventListener('did-stop-loading', updateInfo)
    this.webview.addEventListener('did-navigate', updateInfo)
    this.webview.addEventListener('did-navigate-in-page', updateInfo)
    this.webview.addEventListener('will-navigate', updateInfo)

    this.webview.addEventListener('page-favicon-updated', (e) => {
      tab.favicon = e.favicons[0]
    })

    this.webview.addEventListener('page-title-updated', (e) => {
      tab.title = e.title
    })

    // When webcontents of a webview are not available,
    // we can't use them, so we need to check if 
    // these webcontents are not null, 
    // and then use them.
    let checkWebcontentsInterval = setInterval(() => {
      // We need to use webcontents,
      // to add an event listener `context-menu`.
      if (this.webview.getWebContents() != null) {
        this.webview.getWebContents().on('context-menu', onContextMenu)

        // When these webcontents are finally not null,
        // just remove the interval.
        clearInterval(checkWebcontentsInterval)
      }
    }, 1)

    const onContextMenu = (e, params) => {
      Store.app.pageMenu.setState((previousState) => {
        /**
         * 0  : Open link in new tab
         * 1  : -----------------------
         * 2  : Copy link address
         * 3  : Save link as
         * 4  : -----------------------
         * 5  : Open image in new tab
         * 6  : Save image as
         * 7  : Copy image
         * 8  : Copy image address
         * 9  : -----------------------
         * 10 : Save as
         * 11 : Print
         * 12 : -----------------------
         * 13 : View source
         * 14 : Inspect element
         */
        let menuItems = previousState.items
        // Hide or show first 5 items.
        for (var i = 0; i < 5; i++) {
          menuItems[i].visible = params.linkURL !== ''
        }

        // Next 5 items.
        for (i = 5; i < 10; i++) {
          menuItems[i].visible = params.hasImageContents
        }

        // Next 4 items.
        for (i = 10; i < 14; i++) {
          menuItems[i].visible = !params.hasImageContents && params.linkURL === ''
        }

        return {
          items: menuItems
        }
      })

      Store.app.showPageMenu()
      Store.pageMenuData = params

      // Calculate new menu position
      // using cursor x, y and 
      // width, height of the menu.
      let x = Store.cursor.x
      let y = Store.cursor.y

      // By default it opens menu from upper left corner.
      let left = x + 1
      let top = y + 1

      // Open menu from right corner.
      if (left + 300 > window.innerWidth) {
        left = x - 301
      }

      // Open menu from bottom corner.
      if (top + Store.app.pageMenu.newHeight > window.innerHeight) {
        top = y - Store.app.pageMenu.newHeight
      }

      if (top < 0) {
        top = 96
      }

      // Set the new position.
      Store.app.pageMenu.setState({left: left, top: top})
    }
  }

  goBack () {
    this.webview.goBack()
    Store.app.bar.refreshIconsState()
  }

  goForward () {
    this.webview.goForward()
    Store.app.bar.refreshIconsState()
  }

  refresh () {
    this.webview.reload()
    Store.app.bar.refreshIconsState()
  }

  render () {
    const tab = this.props.tab
    const page = this.props.page
    const isSelected = Store.selectedTab === tab.id

    const {
      url
    } = this.props.page

    const pageClass = (isSelected) ? '' : 'hide'

    return (
      <div className={'page ' + pageClass}>
        <webview ref={(r) => { this.webview = r }} className={'webview ' + pageClass} src={url}></webview>
      </div>
    )
  }
}
