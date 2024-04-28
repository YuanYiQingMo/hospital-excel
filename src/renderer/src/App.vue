<script setup lang="ts">
import { onMounted, inject, ref } from 'vue'
import handleFile from './plugin/handleFile.js'
import { h } from 'vue'
import { ElNotification } from 'element-plus'

let homeDir = ''
let mainPath = ''
let detailPath = ''
let outputPath = ''

const headerList = ref([])
const updateComplete = ref(false)
const selectedHead = ref([])
const selectedHeadIndex = ref([])

const shell = inject('$shell')
const path = inject('$path')
const app = inject('$app')
const fs = inject('$fs')

// const ipcHandle = () => window.electron.ipcRenderer.send('ping')
const init = () => {
  // console.log(inject('$shell'))
  homeDir = path.dirname(app.getPath('exe'))
  mainPath = path.join(homeDir, 'data', 'main')
  detailPath = path.join(homeDir, 'data', 'detail')
  outputPath = path.join(homeDir, 'data', 'out')
  try {
    if (!fs.existsSync(mainPath)) {
      fs.mkdirSync(mainPath, { recursive: true })
    }
  } catch (e) {
    console.log(e)
  }
  try {
    if (!fs.existsSync(detailPath)) {
      fs.mkdirSync(detailPath, { recursive: true })
    }
  } catch (e) {
    console.log(e)
  }
  try {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true })
    }
  } catch (e) {
    console.log(e)
  }
}
const openMainFolder = () => {
  shell.openPath(mainPath)
}
const openDetailFolder = () => {
  shell.openPath(detailPath)
}

const analysis = () => {
  let mainFileList = []
  let detailFileList = []
  // unclosedFile =
  fs.readdir(mainPath, (err, files) => {
    if (err) {
      console.log('mainPath加载失败')
    }
    files.forEach((file) => {
      mainFileList.push(`${mainPath}\\${file}`)
      if (file.match(/\~\$/)) {
        ElNotification({
          title: '请关闭打开的文件',
          message: h('i', { style: 'color: red' }, '检测到总表文件夹有未关闭的表格'),
          type: 'error',
          duration: 3000
        })
        return
      }
    })
  })
  fs.readdir(detailPath, (err, files) => {
    if (err) {
      console.log('detailPath加载失败')
    }
    files.forEach((file) => {
      detailFileList.push(`${detailPath}\\${file}`)
      if (file.match(/\~\$/)) {
        ElNotification({
          title: '请关闭打开的文件',
          message: h('i', { style: 'color: red' }, '检测到患者个人文件夹有未关闭的表格'),
          type: 'error',
          duration: 3000
        })
        return
      }
    })
  })
  const FileHandler = new handleFile(mainPath, detailPath)
  // console.log(data)
  headerList.value = FileHandler.getMainHeader()
  updateComplete.value = true
  // console.log(selectedHead)
}
const output = () => {
  const FileHandler = new handleFile()
  FileHandler.output([...selectedHead.value], outputPath)
}

const selectedHeadChange = (
  value: number[] | string[],
  direction: 'left' | 'right',
  movedKeys: string[] | number[]
) => {
  console.log(value, direction, movedKeys)
  let res = []
  for (let item of selectedHeadIndex.value) {
    res.push(headerList.value[item])
  }
  selectedHead.value = res
  // console.log(selectedHead)
}
onMounted(() => {
  init()
})
</script>

<template>
  <!-- <img alt="logo" class="logo" src="./assets/electron.svg" /> -->
  <!-- <div class="creator">Powered by electron-vite</div> -->
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
  </div>
  <!-- <p class="tip">Please try pressing <code>F12</code> to open the devTool</p> -->
  <div class="actions">
    <div class="action">
      <el-tooltip content="将包含复数患者的数据的文件放入该文件夹中" placement="top">
        <a @click="openMainFolder">打开总表文件夹</a>
      </el-tooltip>
    </div>
    <div class="action">
      <el-tooltip content="将只包含单独患者数据的文件放入该文件夹中" placement="top">
        <a @click="openDetailFolder">打开患者个人表文件夹</a>
      </el-tooltip>
    </div>
    <div class="action submit-file">
      <el-tooltip content="确保全部文件都已放入对应文件夹开始分析文件" placement="top">
        <a id="submit-file" @click="analysis">分析文件</a>
      </el-tooltip>
    </div>
  </div>
  <!-- <el-row type="flex" justify="space-around" style="width: 80vw;margin-top: 24px;">
    <el-col :span="4" v-for="item in headerList">
      {{ item }}
    </el-col>
  </el-row> -->
  <el-tabs :stretch="true" style="margin-top: 24px; width: 80vw" type="border-card">
    <el-tab-pane label="选择需导出表头">
      <el-text class="mx-1" type="warning" v-show="!updateComplete">暂无数据</el-text>
      <el-transfer
        @change="selectedHeadChange"
        v-show="updateComplete"
        v-model="selectedHeadIndex"
        :data="headerList"
        :titles="['待选表头', '已选表头']"
        :right-default-checked="[0]"
      />
    </el-tab-pane>
    <el-tab-pane label="高级设置">
      <el-scrollbar height="300px">
        <el-text class="mx-1" type="warning" v-show="!selectedHead.length">暂无数据</el-text>
        <el-row v-show="selectedHead.length" class="output-opts">
          <el-col :span="22">
            <el-row
              :gutter="6"
              type="flex"
              align="middle"
              style="margin-top: 8px"
              v-for="item in selectedHead"
            >
              <el-col :span="8">
                {{ item.label }}
              </el-col>
              <el-col :span="8">
                <el-select v-model="item.types">
                  <el-option :label="`文本`" :value="1"></el-option>
                  <el-option :label="`数字`" :value="2"></el-option>
                  <el-option :label="`日期`" :value="3"></el-option>
                </el-select>
              </el-col>
              <el-col v-show="selectedHead.length && item.types == 1" :span="8">
                <el-input v-model="item.option.text" style="width: 90%" placeholder="输入关键字" />
              </el-col>
              <el-col v-show="selectedHead.length && item.type == 2" :span="8">
                <el-input
                  v-model="item.option.numStart"
                  style="width: 45%"
                  placeholder="起始数值"
                />
                <el-input v-model="item.option.numEnd" style="width: 45%" placeholder="结束数值" />
              </el-col>
              <el-col v-show="selectedHead.length && item.type == 3" :span="8">
                <el-input v-model="item.option.num" style="width: 45%" placeholder="Please input" />
              </el-col>
            </el-row>
          </el-col>
        </el-row>
      </el-scrollbar>
    </el-tab-pane>
  </el-tabs>
  <div style="margin-top: 24px" class="action">
    <el-tooltip placement="top">
      <template #content>
        <el-text type="danger">确保全部文件都已放入对应文件夹开始分析文件</el-text><br />
        <el-text type="warning">未设置高级选项将会合并表格</el-text>
      </template>
      <a @click="output">导出总表</a>
    </el-tooltip>
  </div>
</template>
