// pages/index/index.js
const { get } = require('../../utils/request');

Page({
  data: {
    assessments: [],
    loading: true,
    faqList: [
      {
        id: 1,
        question: '霍兰德职业兴趣测试是什么？',
        answer: '霍兰德职业兴趣测试（Self-Directed Search）是由美国职业指导专家约翰·霍兰德编制的职业兴趣测评工具。它将人的职业兴趣分为六种类型：现实型（R）、研究型（I）、艺术型（A）、社会型（S）、企业型（E）、常规型（C），帮助你发现自己的职业兴趣方向。',
        open: false,
      },
      {
        id: 2,
        question: '测试结果准确吗？',
        answer: '霍兰德职业兴趣理论经过数十年的学术研究和实践验证，是目前全球应用最广泛的职业兴趣测评工具之一。但测评结果仅供参考，每个人的职业选择还受到能力、价值观、机遇等多种因素影响。',
        open: false,
      },
      {
        id: 3,
        question: '测试需要多长时间？',
        answer: '测试共60道题，大约需要5分钟。请根据第一直觉作答，不要过多思考，这样结果会更准确。',
        open: false,
      },
      {
        id: 4,
        question: '完整报告需要付费吗？',
        answer: '不需要。完整报告可以通过分享给好友免费解锁。我们希望好的测评工具能够帮助更多人了解自己。',
        open: false,
      },
      {
        id: 5,
        question: '测试结果会被保存吗？',
        answer: '如果你登录了微信，测试结果会保存在你的账号中，可以在「我的」页面随时查看。未登录用户的结果只保存在本地，清除缓存后会丢失。',
        open: false,
      },
    ],
  },

  onLoad() {
    this.loadAssessments();
  },

  onShow() {
    // 页面显示时刷新一下
  },

  onPullDownRefresh() {
    this.loadAssessments().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载测评列表
   */
  async loadAssessments() {
    try {
      this.setData({ loading: true });
      const list = await get('/assessments');
      this.setData({
        assessments: list,
        loading: false,
      });
    } catch (err) {
      console.error('加载测评列表失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 开始测评
   */
  startAssessment(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/quiz/quiz?id=${id}`,
    });
  },

  /**
   * FAQ 展开/收起
   */
  toggleFaq(e) {
    const id = e.currentTarget.dataset.id;
    const faqList = this.data.faqList.map((item) => ({
      ...item,
      open: item.id === id ? !item.open : item.open,
    }));
    this.setData({ faqList });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '测测你最适合什么职业？',
      path: '/pages/index/index',
    };
  },

  onShareTimeline() {
    return {
      title: '测测你最适合什么职业？',
    };
  },
});
