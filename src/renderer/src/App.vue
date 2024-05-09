<script setup lang="ts">
import { onMounted, inject, ref, handleError } from 'vue'
import handleFile from './plugin/handleFile.js'
import { h } from 'vue'
import { ElNotification } from 'element-plus'
// import { filterFields } from 'element-plus/es/components/form/src/utils.mjs'

let homeDir = ''
let mainPath = ''
let detailPath = ''
let outputPath = ''

const headerList = ref([])
const updateComplete = ref(false)
const selectedHead = ref([])
const selectedHeadIndex = ref([])
const detailList = ref([])
const opts = ref([
  {
    key: 0,
    label: '手术信息提取',
    description: '提取含有关键词的手术信息（请确保勾选手术日期、手术方式、麻醉方式三项）',
    value: '',
    enable: false
  },
  {
    key: 1,
    label: '导出病人表单数据',
    description: '选择需要导出的项(导出最近一次检查结果)',
    value: [],
    enable: false
  },
  {
    key: 2,
    label: '填充总表',
    description: '根据总表中存在的表头,寻找患者个人表中存在该表头文字的行,并将所选列的值填充在导出的总表中(取时间最近的一次) (精准匹配,需要较长时间)',
    value: '',
    enable: false
  }
])

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
  detailList.value = FileHandler.getDetailsHeader()
  updateComplete.value = true
  // console.log(selectedHead)
}

const output = () => {
  const FileHandler = new handleFile()
  FileHandler.output([...selectedHead.value], outputPath, [...opts.value])
}

const selectedHeadChange = (
  value: number[] | string[],
  direction: 'left' | 'right',
  movedKeys: string[] | number[]
) => {
  // console.log(value, direction, movedKeys)
  let res = []
  for (let item of selectedHeadIndex.value) {
    res.push(headerList.value[item])
  }
  selectedHead.value = res
  // console.log(selectedHead)
}

const updateDetailsList = () => {
  const FileHandler = new handleFile();
  // console.log()
  FileHandler.updateDetails(opts.value[2])
}
onMounted(() => {
  init()
})
</script>

<template>
  <!-- <img alt="logo" class="logo" src="./assets/electron.svg" /> -->
  <!-- <div class="creator">Powered by electron-vite</div> -->
  <div class="text">
    <span class="vue">excel</span>
    数据处理
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
        <a id="submit-file" @click="analysis">加载文件</a>
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
      <el-scrollbar height="320px">
        <el-text class="mx-1" type="warning" v-show="!updateComplete"
          >暂无数据,请先使用加载文件按钮加载文件夹中的文件</el-text
        >
        <el-transfer
          filterable
          @change="selectedHeadChange"
          v-show="updateComplete"
          v-model="selectedHeadIndex"
          :data="headerList"
          :titles="['待选表头', '已选表头']"
          :right-default-checked="[0]"
        />
      </el-scrollbar>
    </el-tab-pane>
    <el-tab-pane label="高级设置">
      <el-scrollbar height="320px">
        <el-row class="output-opts">
          <el-col :span="22">
            <el-row
              :gutter="6"
              type="flex"
              align="middle"
              style="margin-top: 8px"
              v-for="item in opts"
            >
              <el-col :span="2">
                <el-switch v-model="item.enable" />
              </el-col>
              <el-col style="font-weight: bolder" :span="4">
                {{ item.label }}
              </el-col>
              <el-col style="font-size: 12px; display: flex; justify-content: center; color: yellow;" :span="10">
                {{ item.description }}
              </el-col>
              <el-col :span="8">
                <!-- 手术信息提取 -->
                <el-input
                  v-show="item.key == 0"
                  v-model="item.value"
                  style="width: 100%"
                  placeholder="输入要匹配的文字"
                />
                <!-- TODO提取病人信息 -->
                <el-select
                  @change="updateDetailsList"
                  v-show="item.key == 2"
                  v-model="item.value"
                  placeholder="选取要提取的信息"
                  style="width: 100%"
                >
                  <el-option
                    v-for="detail in detailList"
                    :key="detail.value"
                    :label="detail.label"
                    :value="detail.value"
                  />
                </el-select>
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
      <a style="color: red" @click="output">导出总表</a>
    </el-tooltip>
  </div>
</template>
