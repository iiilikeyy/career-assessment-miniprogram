/**
 * 分享卡片组件
 * 使用 Canvas 2D 绘制结果分享图，可保存到相册
 * @example
 * <share-card result="{{result}}" radar-data="{{radarData}}" visible="{{showShareCard}}" bind:close="onShareClose" />
 */
Component({
  properties: {
    visible: { type: Boolean, value: false },
    result: { type: Object, value: null },
    radarData: { type: Array, value: [] },
  },

  data: {
    canvasWidth: 300,
    canvasHeight: 480,
    saving: false,
  },

  observers: {
    visible(val) {
      if (val) {
        this.drawCard();
      }
    },
  },

  methods: {
    /**
     * 绘制分享卡片到 Canvas
     */
    drawCard() {
      const result = this.data.result;
      const radarData = this.data.radarData;
      if (!result) return;

      const query = this.createSelectorQuery();
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio || 2;
        const w = this.data.canvasWidth;
        const h = this.data.canvasHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        this.paintBackground(ctx, w, h);
        this.paintHeader(ctx, w, result);
        this.paintScores(ctx, w, radarData);
        this.paintDescription(ctx, w, h, result);
        this.paintFooter(ctx, w, h);
      });
    },

    /**
     * 绘制渐变背景
     */
    paintBackground(ctx, w, h) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },

    /**
     * 绘制标题区域
     */
    paintHeader(ctx, w, result) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '14px sans-serif';
      ctx.fillText('霍兰德职业兴趣测试', w / 2, 40);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(result.resultTitle || '', w / 2, 75);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('类型代码: ' + (result.resultCode || ''), w / 2, 100);
    },

    /**
     * 绘制圆角矩形（兼容旧版 Canvas）
     */
    roundRect(ctx, x, y, w, h, r) {
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        return;
      }
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    /**
     * 绘制维度得分条形图
     */
    paintScores(ctx, w, radarData) {
      const startY = 130;
      const barH = 24;
      const gap = 8;
      const barWidth = w - 80;
      const startX = 40;

      radarData.forEach((item, i) => {
        const y = startY + i * (barH + gap);
        const ratio = item.max > 0 ? item.value / item.max : 0;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.roundRect(ctx, startX, y, barWidth, barH, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, startX, y, barWidth * ratio, barH, 12);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, startX + 8, y + 16);

        ctx.textAlign = 'right';
        ctx.fillText(String(item.value), startX + barWidth - 8, y + 16);
      });

      ctx.textAlign = 'center';
    },

    /**
     * 绘制简要描述
     */
    paintDescription(ctx, w, h, result) {
      const descY = 130 + this.data.radarData.length * 32 + 20;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      const desc = result.shortDesc || '';
      const maxChars = 16;
      const lines = [];
      let current = '';
      for (const ch of desc) {
        if (current.length >= maxChars) {
          lines.push(current);
          current = '';
        }
        current += ch;
      }
      if (current) lines.push(current);

      const maxLines = 4;
      lines.slice(0, maxLines).forEach((line, i) => {
        ctx.fillText(line, w / 2, descY + i * 20);
      });
    },

    /**
     * 绘制底部品牌
     */
    paintFooter(ctx, w, h) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('长按识别小程序码 · 来测测你的职业兴趣', w / 2, h - 20);
    },

    /**
     * 保存图片到相册
     */
    saveImage() {
      if (this.data.saving) return;
      this.setData({ saving: true });

      const query = this.createSelectorQuery();
      query.select('#shareCanvas').fields({ node: true }).exec((res) => {
        if (!res[0]) {
          this.setData({ saving: false });
          return;
        }
        const canvas = res[0].node;
        wx.canvasToTempFilePath({
          canvas,
          success: (data) => {
            this.doSaveImage(data.tempFilePath);
          },
          fail: () => {
            this.showToast('图片生成失败');
            this.setData({ saving: false });
          },
        });
      });
    },

    /**
     * 执行保存（带权限处理）
     */
    doSaveImage(filePath) {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          this.showToast('已保存到相册');
          this.triggerEvent('close');
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要相册权限才能保存图片，请在设置中开启',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) wx.openSetting();
              },
            });
          } else {
            this.showToast('保存失败，请重试');
          }
        },
        complete: () => {
          this.setData({ saving: false });
        },
      });
    },

    close() {
      this.triggerEvent('close');
    },

    showToast(msg) {
      wx.showToast({ title: msg, icon: 'none' });
    },
  },
});
