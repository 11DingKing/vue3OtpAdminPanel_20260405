# Vue3 + Element Plus OTP登录系统

## How to Run

### 方式一：使用 Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 停止服务
docker-compose down
```

访问地址：http://localhost:8081

### 方式二：本地开发

```bash
# 进入前端目录
cd frontend-admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## Services

| 服务名称 | 端口 | 描述 |
|---------|------|------|
| frontend-admin | 8081 | Vue3 前端管理系统 |

## 测试账号

| 用户名 | OTP 验证码 | 说明 |
|--------|------------|------|
| admin | 123456 | 系统管理员账号 |
| user | 123456 | 普通用户账号 |

**注意**：本项目为演示项目，OTP 验证码固定为 `123456`。出于界面美观考虑，登录页不再直接展示测试账号信息。

## 题目内容

### 项目需求
- Vue3 + TypeScript + Element Plus 前端框架
- OTP 动态密码登录功能
- 登录状态持久化
- 左侧菜单布局的后台管理系统

### 技术栈
- **框架**：Vue 3.4 + TypeScript
- **UI组件库**：Element Plus
- **路由**：Vue Router 4
- **状态管理**：Pinia
- **构建工具**：Vite
- **容器化**：Docker + Nginx

### 功能特性
1. ✅ OTP 动态密码登录
2. ✅ 登录状态持久化（localStorage）
3. ✅ 响应式侧边栏菜单
4. ✅ 路由守卫保护
5. ✅ 统一的视觉设计风格
6. ✅ 交互反馈（Loading、Toast提示）
7. ✅ Docker 容器化部署

### 项目结构
```
├── README.md                 # 项目说明文档
├── docker-compose.yml        # Docker Compose 配置
├── .gitignore               # Git 忽略配置
└── frontend-admin/          # 前端项目目录
    ├── Dockerfile           # Docker 构建文件
    ├── nginx.conf           # Nginx 配置
    ├── package.json         # 项目依赖
    ├── vite.config.ts       # Vite 配置
    ├── tsconfig.json        # TypeScript 配置
    └── src/
        ├── main.ts          # 入口文件
        ├── App.vue          # 根组件
        ├── api/             # API 接口
        ├── assets/          # 静态资源
        ├── components/      # 公共组件
        ├── layouts/         # 布局组件
        ├── router/          # 路由配置
        ├── stores/          # Pinia 状态管理
        ├── styles/          # 全局样式
        ├── types/           # TypeScript 类型
        ├── utils/           # 工具函数
        └── views/           # 页面组件
```
