// pages/mine/mine.js
const { isLoggedIn, updateUserInfo, ensureLogin, login } = require('../../utils/auth');
const { get } = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    records: [],
    loading: false,
  },

  onShow() {
    this.loadUserInfo();
    if (isLoggedIn()) {
      this.loadRecords();
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.nickname) {
      this.setData({ userInfo });
    }
  },

  /**
   * 加载测评记录
   */
  async loadRecords() {
    try {
      this.setData({ loading: true });
      const records = await get('/user/records');
      this.setData({
        records,
        loading: false,
      });
    } catch (err) {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
    }
  },

  /**
   * 选择头像（微信头像昵称填写能力）
   */
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
    });
    // 上传到服务器
    updateUserInfo({ avatarUrl }).catch((err) => {
      console.error('更新头像失败:', err);
    });
  },

  /**
   * 昵称输入（微信头像昵称填写能力）
   */
  onNicknameInput(e) {
    const nickname = e.detail.value;
    if (nickname && nickname.trim()) {
      this.setData({
        'userInfo.nickname': nickname,
      });
      // 防抖更新，避免频繁请求
      if (this.nicknameTimer) {
        clearTimeout(this.nicknameTimer);
      }
      this.nicknameTimer = setTimeout(() => {
        updateUserInfo({ nickname: nickname.trim() }).catch((err) => {
          console.error('更新昵称失败:', err);
        });
      }, 800);
    }
  },

  /**
   * 点击用户卡片 - 静默登录
   */
  async onUserTap() {
    if (isLoggedIn()) {
      return;
    }
    try {
      wx.showLoading({ title: '登录中...', mask: true });
      const result = await login();
      this.setData({ userInfo: result.user });
      this.loadRecords();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      });
    }
  },

  /**
   * 查看测评记录详情
   */
  viewRecord(e) {
    const id = e.currentTarget.dataset.id;
    const assessmentId = e.currentTarget.dataset.assessmentId;
    wx.navigateTo({
      url: `/pages/result/result?recordId=${id}&assessmentId=${assessmentId}`,
    });
  },

  /**
   * 去测评
   */
  goAssessment() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  /**
   * 隐私政策
   */
  showPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },

  /**
   * 用户协议
   */
  showAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' });
  },
});
