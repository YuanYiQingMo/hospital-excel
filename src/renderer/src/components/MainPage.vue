<template>
    <div class="warper">
        <el-row type="flex" justify="space-between" class="head-bar">
            <el-col :span="6" class="header-item" style="color: red;"> <i class="el-icon-warning-outline"></i> 请确认已将所有文件放入指定文件夹 </el-col>
            <el-col :span="6" class="header-item">
                <el-tooltip content="请将患者申请单结果查询文件放入此文件夹" placement="top">
                    <el-button type="primary" @click="openMainFiles"> 打开数据文件夹 </el-button>
                </el-tooltip>
            </el-col>
            <el-col :span="6" class="header-item">
                <el-tooltip content="请将总表文件放入此文件夹" placement="top">
                    <el-button type="primary" @click="openDetailFiles"> 打开数据文件夹 </el-button>
                </el-tooltip>
            </el-col>
        </el-row>
        <el-row>
            <el-col v-for="item in header" :span="5" :key="item.住院号"></el-col>
        </el-row>
    </div>
</template>

<script>
import handleFile from "@/plugin/handleFile.js";
export default {
    data() {
        return {
            homeDir: "",
            mainPath: "",
            detailPath: "",
            header:[],
        };
    },
    name: "MainPage",
    methods: {
        init() {
            this.homeDir = this.$path.dirname(this.$app.getPath("exe"));
            this.mainPath = this.$path.join(this.homeDir, "data", "main");
            this.detailPath = this.$path.join(this.homeDir, "data", "detail");
            try {
                if (!this.$fs.existsSync(this.mainPath)) {
                    this.$fs.mkdirSync(this.mainPath, { recursive: true });
                }
            } catch (e) {
                console.log(e);
            }
            try {
                if (!this.$fs.existsSync(this.detailPath)) {
                    this.$fs.mkdirSync(this.detailPath, { recursive: true });
                }
            } catch (e) {
                console.log(e);
            }
        },
        openMainFiles() {
            inject('$shell').openPath(this.mainPath);
        },
        openDetailFiles() {
            inject('$shell').openPath(this.detailPath);
        },
        //上传所有文件获取表头
        submitData(){
            const dataHandler = new handleFile()
            this.header = dataHandler.getResult()
        },
    },
    mounted() {
        this.init();
    },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.warper {
    height: 100vh;
    width: 100vw;
    background-color: #cacaca;
}
.head-bar {
    padding-top: 24px;
}
.header-item {
    color: red;
    margin: 0 auto
}
</style>
