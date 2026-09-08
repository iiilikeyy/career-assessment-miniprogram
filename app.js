// app.js
App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:3000/api', // 开发环境，上线后改成正式域名
  },

  onLaunch() {
    // 读取本地存储的token
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }

    // 读取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },
});
