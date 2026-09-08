// utils/ad.js 广告封装

const app = getApp();

let rewardedVideoAd = null;
let closeCallback = null;

/**
 * 初始化激励视频广告
 */
function initRewardedVideoAd() {
  if (rewardedVideoAd) {
    return rewardedVideoAd;
  }

  // 开发环境如果没有广告位ID，返回mock对象
  if (!app.globalData.adUnitId || app.globalData.adUnitId.includes('xxxx')) {
    console.warn('[AD] 广告位ID未配置，使用mock模式');
    rewardedVideoAd = {
      show() {
        return new Promise((resolve) => {
          wx.showModal({
            title: '模拟广告',
            content: '这是模拟的激励视频广告，点击确定模拟观看完成',
            success(res) {
              resolve({ isEnded: res.confirm });
              // mock模式下直接触发close回调
              if (closeCallback) {
                closeCallback({ isEnded: res.confirm });
              }
            },
          });
        });
      },
      load() {
        return Promise.resolve();
      },
      onClose(cb) {
        closeCallback = cb;
      },
    };
    return rewardedVideoAd;
  }

  rewardedVideoAd = wx.createRewardedVideoAd({
    adUnitId: app.globalData.adUnitId,
  });

  // 只绑定一次close事件
  rewardedVideoAd.onClose((res) => {
    if (closeCallback) {
      closeCallback(res);
      closeCallback = null;
    }
  });

  // 错误处理
  rewardedVideoAd.onError((err) => {
    console.error('[AD] 激励视频广告错误:', err);
  });

  return rewardedVideoAd;
}

/**
 * 展示激励视频广告
 * @returns {Promise<boolean>} 是否完整观看
 */
function showRewardedVideoAd() {
  return new Promise((resolve) => {
    const ad = initRewardedVideoAd();

    closeCallback = (res) => {
      if (res && res.isEnded) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    ad.load().then(() => {
      return ad.show();
    }).catch((err) => {
      console.error('[AD] 广告展示失败:', err);
      closeCallback = null;
      resolve(false);
    });
  });
}

module.exports = {
  initRewardedVideoAd,
  showRewardedVideoAd,
};
