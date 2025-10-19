# 眼动追踪认知评估系统

基于眼动追踪技术的认知功能评估工具（重构版）

## 🎯 项目简介

本系统是对原有 Vibe 眼动追踪系统的模块化重构，保留了所有核心功能，并提供了更美观、更易用的界面。

### 主要特点

- ✅ **完整保留原有功能**：4个标准化任务、统计分析、可视化图表
- ✅ **模块化架构**：后端核心功能封装，前端独立开发
- ✅ **美观界面**：科技感设计、流畅动画、响应式布局
- ✅ **一键启动**：Windows 双击即可运行
- ✅ **本地运行**：所有数据在本地处理，保护隐私

## 📋 系统要求

- **操作系统**: Windows 10/11
- **Python**: 3.6 或更高版本
- **浏览器**: Chrome、Edge 或 Firefox（需支持摄像头）
- **摄像头**: 用于眼动追踪
- **环境**: 光线充足的室内环境

## 🚀 快速开始

### 方法1: 一键启动（推荐）

1. 双击 `run.bat` 文件
2. 系统会自动检查依赖并启动服务器
3. 浏览器会自动打开 `https://localhost:5000`
4. 按照页面提示进行测试

### 方法2: 手动启动

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 运行启动脚本：
```bash
python run.py
```

3. 在浏览器中访问：`https://localhost:5000`

## 📊 任务说明

系统包含4个标准化认知评估任务：

| 任务 | 时长 | 说明 |
|------|------|------|
| 基线校准 | 15秒 | 注视屏幕上的圆点，校准眼动追踪 |
| 图片识别 | 10秒 | 观察两张图片（公鸡和树） |
| 视频观看 | 20秒 | 观看黑白视频片段 |
| 文字阅读 | 30秒 | 朗读标准段落（祖父段落） |

**总时长**: 约 2 分钟

## 📁 项目结构

```
new_app/
├── backend/                    # 后端代码
│   ├── eye_tracking_core.py   # 核心分析引擎
│   ├── api.py                 # Flask API 服务
│   └── config.py              # 配置文件
├── frontend/                   # 前端代码
│   ├── index.html             # 主页面
│   ├── css/
│   │   └── style.css          # 样式文件
│   ├── js/
│   │   ├── eye_tracker.js     # WebGazer 封装
│   │   └── app.js             # 应用主逻辑
│   └── assets/                # 静态资源
│       ├── pictures/          # 图片素材
│       ├── videos/            # 视频素材
│       └── scripts/           # WebGazer.js
├── run.py                      # Python 启动脚本
├── run.bat                     # Windows 批处理启动
├── requirements.txt            # 依赖清单
└── README.md                   # 本文件
```

## 🔧 技术架构

### 后端
- **Flask**: Web 框架
- **NumPy**: 数值计算
- **Matplotlib**: 数据可视化
- **Flask-CORS**: 跨域支持

### 前端
- **HTML5 + CSS3**: 页面结构和样式
- **JavaScript (ES6+)**: 应用逻辑
- **WebGazer.js**: 眼动追踪（TFFacemesh）

### 数据流程

```
用户 → 前端页面 → WebGazer.js (眼动追踪)
                      ↓
                  收集坐标数据
                      ↓
              POST /api/task (提交数据)
                      ↓
           后端 (eye_tracking_core.py)
                      ↓
          计算统计 + 生成图表 + 对比分析
                      ↓
              返回 JSON 结果
                      ↓
              前端显示报告
```

## 📈 功能说明

### 核心功能

1. **眼动追踪**
   - 使用 WebGazer.js TFFacemesh 追踪器
   - 实时捕获眼睛注视点坐标
   - 每秒采集约 30-60 个数据点

2. **统计分析**
   - X/Y 坐标平均值
   - X/Y 坐标标准差
   - 与参考人群对比
   - 差异百分比计算

3. **数据可视化**
   - 眼动轨迹图（X-Y 散点图）
   - 实时进度显示
   - 对比分析图表

4. **报告生成**
   - 完整的评估报告
   - 每个任务的详细统计
   - 可视化图表展示
   - 支持打印

### 参考值说明

系统内置的参考值（normative measures）来源于原始 Vibe 系统的示例数据。在实际临床应用中，应使用经过验证的人群数据。

## ⚠️ 注意事项

1. **HTTPS 要求**
   - WebGazer.js 需要摄像头权限
   - 浏览器要求 HTTPS 连接
   - 系统自动使用 SSL（自签名证书）
   - 首次访问时需要信任证书

2. **摄像头权限**
   - 首次运行时浏览器会请求摄像头权限
   - 必须允许才能进行眼动追踪
   - 建议在光线充足的环境中使用

3. **浏览器兼容性**
   - 推荐使用 Chrome 或 Edge
   - Firefox 也支持但可能性能稍差
   - Safari 可能存在兼容性问题

4. **数据隐私**
   - 所有数据在本地处理
   - 不会上传到外部服务器
   - 摄像头仅用于眼动追踪
   - 会话数据存储在内存中

## 🐛 常见问题

### 1. 启动失败

**问题**: 运行 `run.bat` 后提示错误

**解决**:
```bash
# 检查 Python 版本
python --version

# 手动安装依赖
pip install -r requirements.txt

# 查看详细错误信息
python run.py
```

### 2. 摄像头无法访问

**问题**: 页面提示摄像头权限被拒绝

**解决**:
- 检查浏览器设置中的摄像头权限
- 确保没有其他程序占用摄像头
- 尝试在浏览器地址栏输入 `chrome://settings/content/camera`

### 3. HTTPS 证书警告

**问题**: 浏览器显示"不安全"或证书错误

**解决**:
- 这是正常的，因为使用了自签名证书
- 点击"高级" → "继续访问"
- 数据仍然是安全的（本地运行）

### 4. 图片或视频不显示

**问题**: 任务页面中资源加载失败

**解决**:
- 检查 `frontend/assets/` 目录是否完整
- 确保从项目根目录启动服务器
- 查看浏览器控制台的错误信息

## 📚 API 文档

### POST /api/task

提交单个任务的眼动数据

**请求**:
```json
{
    "task": "baseline",
    "data": [[x1, y1], [x2, y2], ...],
    "sessionId": "uuid",
    "age": "25",
    "gender": "male"
}
```

**响应**:
```json
{
    "success": true,
    "result": {
        "task": "baseline",
        "statistics": {...},
        "comparison": {...},
        "visualization": "data:image/png;base64,...",
        "data_points": 450
    }
}
```

### GET /api/report/{sessionId}

获取完整报告

**响应**:
```json
{
    "success": true,
    "report": {
        "summary": "眼动追踪分析报告",
        "tasks": {...},
        "user_info": {...}
    }
}
```

## 🔄 与原系统的区别

| 特性 | 原系统 | 新系统 |
|------|--------|--------|
| 架构 | 单体 Flask 应用 | 模块化（前后端分离）|
| 界面 | 基础样式 | 现代科技感设计 |
| 启动方式 | 命令行 | 一键启动（run.bat）|
| 代码组织 | app.py (240行) | 分离为多个模块 |
| 数据存储 | 文件系统 | 内存 + 可选文件 |
| 文档 | 英文 README | 中文文档 + 详细说明 |

## 📄 许可证

本项目继承原 Vibe 系统的 GPL v3 许可证（因为使用了 WebGazer.js）。

## 🙏 致谢

- 原始项目: [nostalgia-cnt/vibe](https://github.com/nostalgia-cnt/vibe)
- WebGazer.js: [Brown HCI](https://webgazer.cs.brown.edu/)
- UW Center for Neurotechnology

## 📞 支持

如有问题或建议，请参考原项目的 Issues 页面。

---

**祝使用愉快！** 🎉

