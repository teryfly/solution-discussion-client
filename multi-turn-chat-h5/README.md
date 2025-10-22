# AI辅助研发平台 - 移动端H5应用

基于 React + Vite + TypeScript 构建的移动端 PWA 应用，提供AI辅助研发、知识库管理、项目管理等功能。

## 功能特性

- 💬 **会话管理**: 创建、查看、管理AI对话会话
- 🏗️ **项目管理**: 项目配置、环境管理、AI工作目录设置
- 📚 **知识库**: 文档管理、引用管理（开发中）
- 📝 **执行日志**: 代码写入日志查看与筛选
- 🌓 **主题切换**: 支持浅色/深色主题
- 📱 **PWA支持**: 可安装到主屏幕，离线访问

## 技术栈

- React 18
- TypeScript
- Vite 5
- React Router 6
- Zustand (状态管理)
- React Markdown
- Event Source Polyfill (SSE支持)

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:5174 启动

### 生产构建

```bash
npm run build
```

### 预览构建

```bash
npm run preview
```

## 项目结构

```
src/
├── api/              # API接口封装
├── components/       # React组件
│   ├── common/      # 通用组件
│   ├── chat/        # 对话相关组件
│   ├── knowledge/   # 知识库组件（待开发）
│   ├── project/     # 项目管理组件
│   └── log/         # 日志组件
├── hooks/           # 自定义Hooks
├── pages/           # 页面组件
├── router/          # 路由配置
├── stores/          # 状态管理
├── styles/          # 样式文件
├── types/           # TypeScript类型定义
└── utils/           # 工具函数
```

## 环境变量

创建 `.env` 文件并配置:

```
VITE_API_BASE_URL=http://localhost:8000
```

## API文档

详见后端API契约文档

## 浏览器支持

- Chrome (推荐)
- Safari
- Firefox
- Edge

## License

MIT
