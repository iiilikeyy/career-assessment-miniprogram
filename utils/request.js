// utils/request.js 网络请求封装

const app = getApp();

/**
 * 发起网络请求
 * @param {Object} options - 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token') || '';

    wx.request({
      url: app.globalData.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.header || {}),
      },
      success(res) {
        const data = res.data;
        if (data.code === 0) {
          resolve(data.data);
        } else if (data.code === 401) {
          // token过期，清除本地数据
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = '';
          app.globalData.userInfo = null;
          reject(new Error('登录已过期，请重新登录'));
        } else {
          reject(new Error(data.message || '请求失败'));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

/**
 * GET请求
 */
function get(url, data) {
  return request({ url, method: 'GET', data });
}

/**
 * POST请求
 */
function post(url, data) {
  return request({ url, method: 'POST', data });
}

/**
 * PUT请求
 */
function put(url, data) {
  return request({ url, method: 'PUT', data });
}

module.exports = {
  request,
  get,
  post,
  put,
};
