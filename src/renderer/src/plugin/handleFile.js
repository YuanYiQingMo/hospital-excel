let instance

import { ElNotification } from 'element-plus'
// import { fi } from 'element-plus/es/locales.mjs'
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
    this.allDetails = []
    this.headMainList = []
    this.detailsHeadList = []
    this.processedResult = []
    this.detailsFilterList = []
  }

  async getAllPath() {
    let filesMain = fs.readdirSync(this.mainPath)
    this.mainFileList = []
    filesMain.forEach((item) => {
      item = this.mainPath + '\\' + item
      this.mainFileList.push(item)
    })
    let filesDetails = fs.readdirSync(this.detailsPath)
    this.detailsFileList = []
    filesDetails.forEach((item) => {
      let path = this.detailsPath + '\\' + item
      this.detailsFileList.push({ path: path, name: item })
    })
  }
  getDetailsHeader() {
    this.detailsHeadList = []
    this.getAllPath()
    for (let i = 0; i < this.detailsFileList.length; i++) {
      let xdata = XLSX.readFile(this.detailsFileList[i].path)
      const first_sheet = xdata.Sheets[xdata.SheetNames[0]]
      const aoo = XLSX.utils.sheet_to_json(first_sheet, { header: 1 })
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
        key: result[i],
        label: result[i],
        value: result[i]
      })
    }
    this.allDetails = res
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
    let date = new Date()
    date = date.toLocaleString().replace(/[\s\/\:]/g, '-')
    // console.log(date)
    let outputPath = `${outPath}\\${date}_${fileName}.xlsx`
    const BOOK = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(BOOK, SHEET, 'Data')
    XLSX.writeFile(BOOK, outputPath, {
      bookType: 'xlsx'
    })
    ElNotification({
      title: '导出成功',
      message: h('i', { style: 'color: red' }, `打开输出文件夹查看`),
      type: 'success',
      duration: 3000
    })
    shell.openPath(outPath)
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
    let filterList = []
    //总表处理
    for (let file of this.mainFileList) {
      let fileHeads = []
      let xdata = XLSX.readFile(file)
      const first_sheet = xdata.Sheets[xdata.SheetNames[0]]
      const aoo = XLSX.utils.sheet_to_json(first_sheet, { header: 1, raw: false })
      for (let item of aoo) {
        if (item.indexOf('住院号') == -1) {
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
      for (let i = 1; i < res.length; i++) {
        ProcessedSheet.push(res[i])
        count = 0
        if (
          res[0].indexOf('手术名称') != -1 ||
          res[0].indexOf('手术日期') != -1 ||
          res[0].indexOf('麻醉方式') != -1
        ) {
          while (
            i + 1 < res.length &&
            res[i][res[0].indexOf('住院号')] == res[i + 1][res[0].indexOf('住院号')]
          ) {
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
          }
        }
      }
      ProcessedSheet = this.fillList(ProcessedSheet)
      // console.log(ProcessedSheet)
      //高级选项输出
      if (opts[0].enable) {
        filterList = [[]]
        let searchItemIndex = []
        for (let selectItem of selectedHead) {
          filterList[0].push(selectItem.label)
        }
        searchItemIndex = aoo[0].filter((item) => item.match(/手术名称|手术日期|麻醉方式/))
        let reg = new RegExp(opts[0].value)
        for (let item of searchItemIndex) {
          for (let i = 1; i < aoo.length; i++) {
            if (`${aoo[i][aoo[0].indexOf(item)]}`.match(reg)) {
              filterList.push([])
              for (let selectItem of selectedHead) {
                filterList[filterList.length - 1].push(aoo[i][aoo[0].indexOf(selectItem.label)])
              }
            }
          }
        }
      } else {
        filterList = aoo
      }
      // console.log(ProcessedSheet)
      // console.log(filterList)
      if (opts[1].enable) {
        let idIndex = filterList[0].indexOf('住院号')
        for (let filterItem of filterList) {
          let filterId = filterItem[idIndex]
          let dateIndex = 0
          if (filterId) {
            let reg = new RegExp(filterId)
            let matchList = this.detailsFileList.filter((item) => {
              return item.name.match(reg)
            })
            if (matchList.length == 0) {
              continue
            }
            let xdata = XLSX.readFile(matchList[0].path)
            const first_sheetD = xdata.Sheets[xdata.SheetNames[0]]
            const aooD = XLSX.utils.sheet_to_json(first_sheetD, { header: 1, raw: false })
            let startIndex = 0
            for (let detailsFileIndex = 0; detailsFileIndex < aooD.length; detailsFileIndex++) {
              if (aooD[detailsFileIndex].indexOf('住院号') != -1) {
                startIndex = detailsFileIndex + 1
                dateIndex = aooD[detailsFileIndex].indexOf('检查日期')
                filterList[0].push(...aooD[detailsFileIndex])
                break
              }
            }
            for (let i = 0; i < startIndex; i++) {
              aooD.shift()
            }
            let TimeSortList = this.sortDetailsList(aooD, dateIndex)
            for (let item of TimeSortList) {
              if (item[dateIndex]) {
                filterItem.push(...item)
                break
              }
            }
          }
        }
      }

      if (opts[2].enable) {
        let idIndex = ProcessedSheet[0].indexOf('住院号')
        for (let row of ProcessedSheet) {
          let filterId = row[idIndex]
          let dateIndex = 0
          if (filterId) {
            let reg = new RegExp(filterId)
            let matchList = this.detailsFileList.filter((item) => {
              return item.name.match(reg)
            })
            if (matchList.length == 0) {
              continue
            }
            let fillDetailsHeadList = []
            let xdata = XLSX.readFile(matchList[0].path)
            const first_sheetF = xdata.Sheets[xdata.SheetNames[0]]
            const aooF = XLSX.utils.sheet_to_json(first_sheetF, { header: 1, raw: false })
            let startIndex = 0
            for (let detailsFileIndex = 0; detailsFileIndex < aooF.length; detailsFileIndex++) {
              if (aooF[detailsFileIndex].indexOf('住院号') != -1) {
                startIndex = detailsFileIndex + 1
                dateIndex = aooF[detailsFileIndex].indexOf('检查日期')
                fillDetailsHeadList.push(...aooF[detailsFileIndex])
                break
              }
            }
            for (let i = 0; i < startIndex; i++) {
              aooF.shift()
            }
            let TimeSortList = this.sortDetailsList(aooF, dateIndex)
            for (let item of ProcessedSheet[0]) {
              let SearchRow = this.searchItemInList(TimeSortList, item)
              if(!SearchRow.length){
                continue;
              }
              // console.log(ProcessedSheet)
              row[ProcessedSheet[0].indexOf(item)] = SearchRow[fillDetailsHeadList.indexOf(this.detailsSearchHead)]
              
            }
          }
        }
      }
      xdata = null
    }
    if (opts[0].enable || opts[1].enable) {
      this.outputFile(filterList, outPath, '总表数据(高级筛选)')
    }
    this.outputFile(ProcessedSheet, outPath, '总表数据')
    return
  }
  updateDetails(opts) {
    this.detailsSearchHead = opts.value
  }

  searchItemInList(list, head) {
    // console.log(list, head)
    for (let row of list) {
      for (let item of row) {
        if (item == head) {
          return row
        }
      }
    }
    return []
  }

  fillList(list) {
    let maxLength = 0
    // console.log(list)
    for (let item of list) {
      if (item.length > maxLength) {
        maxLength = item.length
      }
    }
    for (let item of list) {
      if (item.length < maxLength) {
        for (let i = item.length; i < maxLength; i++) {
          item.push(undefined)
        }
      }
    }
    return list
  }
  sortDetailsList(list, dateIndex) {
    list.sort((a, b) => {
      let aDate, bDate
      if (a[dateIndex]) {
        aDate = Date.parse(a[dateIndex])
      } else {
        aDate = new Date()
      }
      if (b[dateIndex]) {
        bDate = Date.parse(b[dateIndex])
      } else {
        bDate = new Date()
      }
      return bDate - aDate
    })
    return list
  }
}

export default handleFile
