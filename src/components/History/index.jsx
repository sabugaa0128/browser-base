import React from 'react'

import HistoryParser from '../../utils/history'

import ToolBar from '../HistoryToolBar'
import HistoryCards from '../HistoryCards'
import HistorySection from '../HistorySection'

export default class History extends React.Component {
  constructor () {
    super()

    this.state = {
      cards: [],
      sections: [],
      selectedUrls: [],
      selectingMode: false
    }

    this.selectedCheckboxes = []
  }

  componentDidMount () {
    this.loadData()
  }

  async loadData () {
    const history = await window.historyAPI.get()

    this.setState({
      cards: HistoryParser.getCards(history),
      sections: HistoryParser.getSections(history)
    })
  }

  render () {
    return (
      <div className='history'>
        <ToolBar selectingMode={this.state.selectingMode} selectedUrls={this.state.selectedUrls} onExitIconClick={this.onToolbarExitIconClick} />
        <div className='content'>
          <HistoryCards items={this.state.cards} />
          {
            this.state.sections.map((data, key) => {
              return <HistorySection data={data} key={key} onItemSelect={this.onItemSelect} />
            })
          }
        </div>
      </div>
    )
  }
}