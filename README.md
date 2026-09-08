# 鱼鱼测 - 职业测评微信小程序

基于原生微信小程序开发的职业兴趣测评工具。

## 功能

- 霍兰德职业兴趣测评
- 六维雷达图展示
- 维度详情解析
- 职业推荐与发展建议
- 分享解锁完整报告
- 个人测评记录

## 技术栈

- 原生微信小程序
- Canvas 雷达图组件
- 无第三方依赖

## 快速开始

1. 安装微信开发者工具
2. 导入 `miniprogram` 目录
3. 配置 AppID
4. 修改 `utils/config.js` 中的 API 地址

## 项目结构

```
miniprogram/
├── components/      # 自定义组件
│   └── radar-chart/ # 雷达图组件
├── images/          # 图片资源
├── pages/           # 页面
│   ├── index/       # 首页
│   ├── quiz/        # 测评页
│   ├── result/      # 结果页
│   ├── profile/     # 我的页面
│   └── record/      # 记录详情
├── utils/           # 工具函数
│   ├── request.js   # 请求封装
│   ├── auth.js      # 登录封装
│   └── config.js    # 配置
├── app.js           # 入口
├── app.json         # 全局配置
└── app.wxss         # 全局样式
```
