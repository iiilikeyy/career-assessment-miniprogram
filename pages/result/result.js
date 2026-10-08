// pages/result/result.js
const { get, post } = require('../../utils/request');
const { isLoggedIn, ensureLogin } = require('../../utils/auth');

Page({
  data: {
    recordId: '',
    assessmentId: '',
    result: null,
    loading: true,
    showFullReport: false,
    showShareCard: false,
    radarData: [],
    dimensionNames: {},
    dimensionDetails: [],
    // 结构化报告数据
    intro: '',
    personalityTraits: [],
    workEnvironment: [],
    strengths: [],
    careerDirections: [],
    developmentAdvice: '',
  },

  onLoad(options) {
    const { recordId, assessmentId } = options;
    this.setData({
      recordId: recordId || '',
      assessmentId: assessmentId || '',
    });
    this.loadResult();
  },

  /**
   * 加载结果
   */
  async loadResult() {
    try {
      this.setData({ loading: true });

      // 有 recordId：从服务器加载历史记录
      if (this.data.recordId) {
        if (!isLoggedIn()) {
          wx.showToast({ title: '请先登录后查看', icon: 'none' });
          this.setData({ loading: false });
          return;
        }
        const detail = await get(`/assessments/records/${this.data.recordId}`);
        this.processResult(detail);
        this.setData({ loading: false });
        return;
      }

      // 无 recordId：从 storage 取刚提交的结果
      const lastResult = wx.getStorageSync('lastResult');
      if (lastResult) {
        this.processResult(lastResult);
      } else {
        wx.showToast({ title: '结果数据不存在', icon: 'none' });
      }

      this.setData({ loading: false });
    } catch (err) {
      console.error('加载结果失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 处理结果数据
   */
  processResult(result) {
    // 准备雷达图数据
    const scores = result.scores || {};
    const dimensionNames = result.dimensionNames || {};
    const radarData = Object.keys(scores).map((key) => ({
      name: dimensionNames[key] || key,
      value: scores[key],
      max: 50, // 每个维度最高分50（10题 * 5分）
    }));

    this.setData({
      result,
      radarData,
      dimensionNames,
      dimensionDetails: result.dimensionDetails || [],
      showFullReport: result.isUnlocked || false,
      intro: result.intro || '',
      personalityTraits: result.personalityTraits || [],
      workEnvironment: result.workEnvironment || [],
      strengths: result.strengths || [],
      careerDirections: result.careerDirections || [],
      developmentAdvice: result.developmentAdvice || '',
    });
  },

  /**
   * 分享解锁完整报告
   * 用户点击分享按钮后触发，分享成功后解锁
   */
  async onShareUnlock() {
    try {
      // 确保已登录
      if (!isLoggedIn()) {
        try {
          await ensureLogin();
        } catch (err) {
          wx.showToast({
            title: '请先登录',
            icon: 'none',
          });
          return;
        }
      }

      // 调用后端分享解锁接口
      if (this.data.recordId) {
        try {
          const unlockRes = await post(`/assessments/${this.data.recordId}/unlock`, { type: 'share' });
          // 更新解锁后的结构化数据
          if (unlockRes) {
            this.setData({
              strengths: unlockRes.strengths || [],
              careerDirections: unlockRes.careerDirections || [],
              developmentAdvice: unlockRes.developmentAdvice || '',
              intro: unlockRes.intro || this.data.intro,
              personalityTraits: unlockRes.personalityTraits || this.data.personalityTraits,
              workEnvironment: unlockRes.workEnvironment || this.data.workEnvironment,
            });
          }
        } catch (err) {
          console.warn('解锁接口调用失败:', err);
        }
      }

      // 显示完整报告
      this.setData({ showFullReport: true });
      const result = { ...this.data.result, isUnlocked: true };
      this.setData({ result });
      wx.setStorageSync('lastResult', result);

      wx.showToast({
        title: '解锁成功！',
        icon: 'success',
      });
    } catch (err) {
      console.error('解锁失败:', err);
      wx.showToast({
        title: '解锁失败，请重试',
        icon: 'none',
      });
    }
  },

  /**
   * 再测一次
   */
  retake() {
    wx.redirectTo({
      url: `/pages/quiz/quiz?id=${this.data.assessmentId}`,
    });
  },

  /**
   * 进入 AI 生涯教练
   */
  goCoach() {
    if (!this.data.recordId) {
      wx.showModal({
        title: '提示',
        content: 'AI 教练需要登录后使用，登录后请重新测评生成报告',
        confirmText: '去登录',
        success: async (res) => {
          if (res.confirm) {
            try {
              await ensureLogin();
            } catch (e) { /* 忽略 */ }
            wx.showToast({ title: '登录成功，请重新测评', icon: 'none' });
          }
        },
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/coach/coach?recordId=${this.data.recordId}`,
    });
  },

  /**
   * 生成分享卡片（保存图片）
   */
  saveShareImage() {
    if (!this.data.result) return;
    this.setData({ showShareCard: true });
  },

  /**
   * 关闭分享卡片
   */
  onShareCardClose() {
    this.setData({ showShareCard: false });
  },

  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    const result = this.data.result;
    return {
      title: `我测出来是${result?.resultTitle || ''}，你也来测测吧！`,
      path: '/pages/index/index',
    };
  },

  onShareTimeline() {
    const result = this.data.result;
    return {
      title: `我的职业兴趣类型是${result?.resultTitle || ''}，你也来测测！`,
    };
  },

  /**
   * 返回首页
   */
  goHome() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },
});
