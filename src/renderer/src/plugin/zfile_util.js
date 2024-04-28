const path = require('path')
const fs = require('fs')
let filepathArr = []
function mapDir(dir, containSonDir) {
  let files = fs.readdirSync(dir)
  files.forEach((filename) => {
    let pathname = path.join(dir, filename)
    let stats = fs.statSync(pathname)
    if (stats.isDirectory()) {
      if (containSonDir) {
        mapDir(pathname, containSonDir)
      }
    } else if (stats.isFile()) {
      let index = filename.lastIndexOf('.')
      //获取后缀
      let ext = filename.substr(index + 1)
      if (ext === 'txt') {
        filepathArr.push(pathname)
      }
    }
  })
}

export function mapDirAll(dir, containSonDir) {
  filepathArr = []
  if (!containSonDir) {
    containSonDir = false
  }
  return new Promise((resolve, reject) => {
    try {
      mapDir(dir, containSonDir)
    } catch (e) {
      reject(e)
    }
    resolve(filepathArr)
  })
}


