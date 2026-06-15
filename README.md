# 血库全流程管理平台

一个基于 Vue 3 + Node.js + MySQL 的血液管理系统，覆盖血液从采集到使用的全流程管理。

## 功能特性

### 1. 献血者管理
- 献血者信息登记与维护
- 献血历史记录查询
- 献血者状态管理（正常/暂缓/永久淘汰）

### 2. 血液采集
- 采血登记（支持搜索已有献血者或新增）
- 采集地点、时间、血量、成分类型记录
- 自动更新献血者累计献血量和次数

### 3. 实验室检测
- 血型鉴定（ABO/RH）
- 转氨酶（ALT）检测
- 传染病筛查（乙肝、丙肝、艾滋、梅毒）
- 检测结果录入与不合格血液自动报废

### 4. 库存管理
- 合格血液入库冷藏
- 多维度库存查询（血型、成分、状态）
- 存储位置与温度管理
- 血液报废处理

### 5. 临期提醒
- 不同成分不同有效期（全血35天、血小板5天、血浆365天）
- 7天/3天临期预警
- 临期血液优先使用提示

### 6. 用血申请
- 医院提交用血申请
- 申请审核流程
- 血型配型匹配
- 发血出库管理

### 7. 血液追踪
- 每袋血全生命周期追踪
- 从采集→检测→入库→出库→医院→输血完整链路
- 时间线可视化展示

### 8. 仪表盘
- 核心数据统计展示
- 血型库存分布图表
- 采集趋势图表
- 待办事项提醒

## 技术栈

### 前端
- Vue 3 (Composition API)
- Vue Router 4
- Element Plus
- ECharts
- Axios
- Vite

### 后端
- Node.js
- Express
- MySQL (mysql2)
- CORS
- dotenv

## 项目结构

```
label-064/
├── database/              # 数据库脚本
│   └── init.sql          # 数据库初始化脚本
├── server/                # 后端服务
│   ├── config/
│   │   └── db.js         # 数据库连接配置
│   ├── routes/           # API 路由
│   │   ├── donorRoutes.js
│   │   ├── bloodRoutes.js
│   │   ├── testRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── requestRoutes.js
│   │   └── dashboardRoutes.js
│   ├── app.js            # 服务入口
│   ├── package.json
│   └── .env.example
└── client/                # 前端应用
    ├── src/
    │   ├── api/          # API 接口
    │   ├── router/       # 路由配置
    │   ├── views/        # 页面组件
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- MySQL >= 5.7
- npm 或 yarn

### 1. 数据库初始化

```bash
# 创建数据库并导入初始数据
mysql -u root -p < database/init.sql
```

### 2. 后端配置与启动

```bash
cd server

# 复制配置文件
cp .env.example .env

# 修改 .env 中的数据库配置
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=blood_bank

# 安装依赖
npm install

# 启动服务
npm run dev
# 或生产环境
npm start
```

后端服务运行在 http://localhost:3000

### 3. 前端启动

```bash
cd client

# 安装依赖
npm install

# 启动开发服务
npm run dev

# 构建生产版本
npm run build
```

前端服务运行在 http://localhost:5173

## 数据库表说明

| 表名 | 说明 |
|------|------|
| donors | 献血者表 |
| blood_units | 血液单位表（每袋血） |
| blood_tests | 血液检测表 |
| inventory | 库存表 |
| hospitals | 医院表 |
| blood_requests | 用血申请表 |
| blood_issues | 血液出库/发血表 |
| blood_issue_items | 出库明细表 |
| blood_tracking | 血液追踪表 |
| blood_discards | 血液报废表 |
| sys_users | 系统用户表 |

## 血液成分有效期

| 成分类型 | 有效期 |
|----------|--------|
| 全血 | 35天 |
| 红细胞 | 35天 |
| 血小板 | 5天 |
| 血浆 | 365天 |
| 冷沉淀 | 365天 |

## 血液状态流转

```
已采集 → 待检测 → 检测中 → 合格 → 已入库 → 已出库 → 已发往医院 → 已接收 → 已输血
                        ↓
                     不合格 → 已报废
```

## 演示账号

- 用户名：admin
- 密码：admin123

## API 接口

### 献血者相关
- GET /api/donors - 获取献血者列表
- GET /api/donors/:id - 获取献血者详情
- POST /api/donors - 新增献血者
- PUT /api/donors/:id - 更新献血者
- DELETE /api/donors/:id - 删除献血者

### 血液采集相关
- GET /api/blood - 获取血液列表
- GET /api/blood/:id - 获取血液详情
- POST /api/blood - 新增采集记录
- GET /api/blood/search/donor - 搜索献血者

### 检测相关
- GET /api/tests - 获取检测记录
- GET /api/tests/pending/list - 获取待检测列表
- POST /api/tests - 提交检测结果

### 库存相关
- GET /api/inventory - 获取库存列表
- GET /api/inventory/stats/summary - 库存统计
- GET /api/inventory/expiring-soon - 临期血液
- GET /api/inventory/pending-stock/list - 待入库列表
- POST /api/inventory/stock-in - 血液入库
- POST /api/inventory/discard - 血液报废

### 用血申请相关
- GET /api/requests - 获取申请列表
- GET /api/requests/:id - 获取申请详情
- POST /api/requests - 提交申请
- POST /api/requests/:id/audit - 审核申请
- GET /api/requests/:id/match-blood - 配血查询
- POST /api/requests/:id/issue - 发血
- POST /api/requests/issue/:issueId/receive - 确认接收
- POST /api/requests/issue/:issueId/complete - 完成输血
- GET /api/requests/hospitals/list - 获取医院列表

### 仪表盘/追踪
- GET /api/dashboard/stats - 仪表盘统计
- GET /api/dashboard/track/:bloodNo - 血液追踪
