let instance

import { ElNotification } from 'element-plus'
import { h } from 'vue'

const { shell } = require('electron')
const fs = require('fs')
const XLSX = require('xlsx')

class handleFile {
  constructor(mainPath, detailsPath) {
    if (instance) return instance
    instance = this

    this.mainPath = mainPath
    this.detailsPath = detailsPath
    this.mainFileList = []
    this.detailsFileList = []
    this.headData = []
    this.allHeader = []
    this.headMainList = []
    this.detailsHeadList = []
  }

  async getAllPath() {
    let filesMain = fs.readdirSync(this.mainPath)
    filesMain.forEach((item) => {
      item = this.mainPath + '\\' + item
      this.mainFileList = []
      this.mainFileList.push(item)
    })
    let filesDetails = fs.readdirSync(this.detailsPath)
    filesDetails.forEach((item) => {
      item = this.detailsPath + '\\' + item
      this.detailsFileList = []
      this.detailsFileList.push(item)
    })
  }
  getDetailsHeader() {
    this.detailsHeadList = []
    this.getAllPath()
    for (let i = 0; i < this.detailsFileList.length; i++) {
      let xdata = XLSX.readFile(this.detailsFileList[i])
      /* first worksheet */
      const first_sheet = xdata.Sheets[xdata.SheetNames[0]]
      const aoo = XLSX.utils.sheet_to_json(first_sheet, { header: 1 })
      /* generate array of arrays */
      for (let item of aoo) {
        if (item.length == 1) {
          continue
        }
        this.detailsHeadList.push(...item)
        break
      }
      // console.log(res)
      xdata = null
    }
    const strings = this.detailsHeadList.map((item) => JSON.stringify(item))
    const removeDupList = [...new Set(strings)]
    const result = removeDupList.map((item) => JSON.parse(item))
    let res = []
    // type 1：文本 2：数字 3：日期
    for (let i = 0; i < result.length; i++) {
      res.push({
        key: i,
        label: result[i],
        types: 1,
        option: {
          numStart: 0,
          numEnd: 0,
          date: 0,
          text: ``
        }
      })
    }
    this.allHeader = res
    return res
  }
  getMainHeader() {
    this.headMainList = []
    this.getAllPath()
    for (let i = 0; i < this.mainFileList.length; i++) {
      let xdata = XLSX.readFile(this.mainFileList[i])
      /* first worksheet */
      const first_sheet = xdata.Sheets[xdata.SheetNames[0]]
      const aoo = XLSX.utils.sheet_to_json(first_sheet, { header: 1 })
      /* generate array of arrays */
      for (let item of aoo) {
        if (item.length == 1) {
          continue
        }
        this.headMainList.push(...item)
        break
      }
      xdata = null
    }
    const strings = this.headMainList.map((item) => JSON.stringify(item))
    const removeDupList = [...new Set(strings)]
    const result = removeDupList.map((item) => JSON.parse(item))
    let res = []
    // type 1：文本 2：数字 3：日期
    for (let i = 0; i < result.length; i++) {
      res.push({
        key: i,
        label: result[i],
        types: 1,
        option: {
          numStart: 0,
          numEnd: 0,
          date: 0,
          text: ``
        }
      })
    }
    this.allHeader = res
    // console.log(res)
    return res
  }

  async outputFile(res, outPath, fileName) {
    const SHEET = XLSX.utils.aoa_to_sheet(res)
    let outputPath = `${outPath}\\${fileName}.xlsx`
    const BOOK = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(BOOK, SHEET, 'Data')
    // console.log(SHEET, outputPath)
    XLSX.writeFile(BOOK, outputPath, {
      bookType: 'xlsx'
    })
  }

  output(selectedHead, outPath, opts) {
    if (selectedHead[0].label != '住院号') {
      ElNotification({
        title: '请勾选住院号',
        message: h('i', { style: 'color: red' }, '住院号是必须的'),
        type: 'error',
        duration: 3000
      })
      return
    }
    let res = []
    let ProcessedSheet
    //总表处理
    for (let fileIndex = 0; fileIndex < this.mainFileList.length; fileIndex++) {
      let fileHeads = []
      let xdata = XLSX.readFile(this.mainFileList[fileIndex])
      /* first worksheet */
      const first_sheet = xdata.Sheets[xdata.SheetNames[0]]
      // console.log(first_sheet)
      const aoo = XLSX.utils.sheet_to_json(first_sheet, { header: 1,raw:false })
      // console.log(aoo)
      /* generate array of arrays */
      for (let item of aoo) {
        if (item.length == 1) {
          continue
        }
        fileHeads.push(...item)
        break
      }
      for (let i = 0; i < selectedHead.length; i++) {
        if (fileHeads.indexOf(selectedHead[i].label) != -1) {
          let tempCol = []
          for (let item of aoo) {
            tempCol.push(item[fileHeads.indexOf(selectedHead[i].label)])
          }
          res.push(tempCol)
        }
      }
      res = res[0].map((col, i) => {
        return res.map((row) => {
          return row[i]
        })
      })
      //他在一点一点变成屎山
      ProcessedSheet = [res[0]]
      let maxOperation = 0
      let count = 0
      for (let i = 1; i < res.length - 1; i++) {
        ProcessedSheet.push(res[i])
        count = 0
        if (
          res[i][res[0].indexOf('手术名称')] != -1 ||
          res[i][res[0].indexOf('手术日期')] != -1 ||
          res[i][res[0].indexOf('麻醉方式')] != -1
        ) {
          while (res[i][res[0].indexOf('住院号')] == res[i + 1][res[0].indexOf('住院号')]) {
            count++
            if (count > maxOperation) {
              maxOperation = count
              res[0].push(
                ...[`手术日期${count + 1}`, `手术名称${count + 1}`, `麻醉方式${count + 1}`]
              )
            }
            try {
              ProcessedSheet[ProcessedSheet.length - 1].push(
                res[i + 1][res[0].indexOf('手术日期')] || ''
              )
              ProcessedSheet[ProcessedSheet.length - 1].push(
                res[i + 1][res[0].indexOf('手术名称')] || ''
              )
              ProcessedSheet[ProcessedSheet.length - 1].push(
                res[i + 1][res[0].indexOf('麻醉方式')] || ''
              )
            } catch (e) {
              console.log(e)
              ElNotification({
                title:
                  '请同时勾选手术名称、手术日期、麻醉方式三项,如不需导出手术数据要请无视此报错',
                message: h('i', { style: 'color: red' }, `${e}`),
                type: 'error',
                duration: 3000
              })
            }
            i++
            if (i > res.length - 1) {
              break
            }
          }
        }
      }
      // console.log(aoo)
      if (opts[0].enable) {
        let filterList = []
        let searchItemIndex = []
        searchItemIndex = aoo[0].filter((item) => item.match(/手术名称|手术日期|麻醉方式/))
        let reg = new RegExp(opts[0].value)
        for (let item of searchItemIndex) {
          for (let i = 1; i < aoo.length; i++) {
            // console.log(ProcessedSheet[i],[ProcessedSheet[0].indexOf(item)])
            if (`${aoo[i][aoo[0].indexOf(item)]}`.match(reg)) {
              filterList.push([])
              for (let selectItem of selectedHead) {
                filterList[filterList.length - 1].push(aoo[i][aoo[0].indexOf(selectItem.label)])
              }
            }
          }
        }
        this.outputFile(filterList, outPath, '总表数据(筛选手术)')
      }
      xdata = null
    }
    this.outputFile(ProcessedSheet, outPath, '总表数据')
    //个人表单处理
    return
    for (let fileIndex = 0; fileIndex < this.detailsFileList.length; fileIndex++) {
      let xdata = XLSX.readFile(this.detailsFileList[fileIndex])
      /* first worksheet */
      const first_sheet = xdata.Sheets[xdata.SheetNames[0]]
      const aoo = XLSX.utils.sheet_to_json(first_sheet, { header: 1 })
      /* generate array of arrays */
      for (let item of aoo) {
        if (item.length == 1) {
          continue
        }
        this.headList.push(...item)
        break
      }
    }
  }
}

export default handleFile
