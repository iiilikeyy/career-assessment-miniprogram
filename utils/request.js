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
          const e = new Error(data.message || '请求失败');
          e.code = data.code;
          e.data = data.data;
          reject(e);
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

/**
 * 流式请求（SSE），用于 AI 教练打字机效果
 * @param {Object} options - { url, data, onChunk, onComplete }
 *   onChunk(ArrayBuffer) 每次收到增量字节时回调
 *   onComplete(res)      请求结束时回调（用于兜底解析）
 * @returns {Promise}
 */
function streamRequest(options) {
  const token = wx.getStorageSync('token') || '';

  return new Promise((resolve, reject) => {
    const task = wx.request({
      url: app.globalData.baseUrl + options.url,
      method: 'POST',
      data: options.data || {},
      responseType: 'arraybuffer',
      enableChunked: true,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      success(res) {
        if (typeof options.onComplete === 'function') {
          options.onComplete(res);
        }
        resolve(res);
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });

    if (task && typeof task.onChunkReceived === 'function') {
      task.onChunkReceived((res) => {
        if (typeof options.onChunk === 'function') {
          options.onChunk(res.data);
        }
      });
    }
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  streamRequest,
};
