// utils/auth.js 登录封装

const app = getApp();
const { post, put } = require('./request');

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!wx.getStorageSync('token');
}

/**
 * 微信登录（静默登录，只拿openid，不需要用户授权）
 * @returns {Promise<Object>} { token, user }
 */
function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject(new Error('微信登录失败'));
          return;
        }
        try {
          const result = await post('/user/login', {
            code: res.code,
          });
          wx.setStorageSync('token', result.token);
          wx.setStorageSync('userInfo', result.user);
          app.globalData.token = result.token;
          app.globalData.userInfo = result.user;
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      fail: () => {
        reject(new Error('微信登录失败'));
      },
    });
  });
}

/**
 * 更新用户头像（使用微信头像昵称填写能力）
 * @param {Object} data - { avatarUrl, nickname }
 * @returns {Promise<Object>}
 */
async function updateUserInfo(data) {
  try {
    await ensureLogin();
    const userInfo = await put('/user/info', data);
    wx.setStorageSync('userInfo', userInfo);
    app.globalData.userInfo = userInfo;
    return userInfo;
  } catch (err) {
    throw err;
  }
}

/**
 * 确保已登录（未登录则自动静默登录）
 * @returns {Promise<string>} token
 */
async function ensureLogin() {
  if (isLoggedIn()) {
    return wx.getStorageSync('token');
  }
  const result = await login();
  return result.token;
}

module.exports = {
  isLoggedIn,
  login,
  updateUserInfo,
  ensureLogin,
};
