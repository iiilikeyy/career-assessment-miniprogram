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
    canvasWidth: 320,
    canvasHeight: 560,
    saving: false,
  },

  observers: {
    visible(val) {
      if (val) {
        setTimeout(() => this.drawCard(), 50);
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

        // 1. 背景（浅色）
        this.paintBackground(ctx, w, h);

        // 2. 顶部渐变标题区
        this.paintHeader(ctx, w, result);

        // 3. 雷达图
        this.paintRadar(ctx, w, 180, radarData);

        // 4. 维度排行
        this.paintDimensions(ctx, w, 320, radarData);

        // 5. 职业标签
        this.paintCareers(ctx, w, 450, result);

        // 6. 底部品牌区
        this.paintFooter(ctx, w, h);
      });
    },

    /**
     * 绘制背景
     */
    paintBackground(ctx, w, h) {
      // 整体浅色背景
      ctx.fillStyle = '#f5f7fa';
      ctx.fillRect(0, 0, w, h);

      // 白色内容卡片
      ctx.fillStyle = '#ffffff';
      this.roundRect(ctx, 16, 16, w - 32, h - 32, 16);
      ctx.fill();
    },

    /**
     * 绘制顶部标题区域
     */
    paintHeader(ctx, w, result) {
      // 渐变头部背景
      const grad = ctx.createLinearGradient(16, 16, w - 16, 130);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
      this.roundRect(ctx, 16, 16, w - 32, 130, { tl: 16, tr: 16, br: 0, bl: 0 });
      ctx.fill();

      // 装饰圆圈
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(w - 40, 50, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.arc(60, 110, 25, 0, Math.PI * 2);
      ctx.fill();

      // 副标题
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.font = '12px sans-serif';
      ctx.fillText('霍兰德职业兴趣测评', w / 2, 45);

      // 主标题
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(result.resultTitle || '', w / 2, 78);

      // 类型代码标签
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      const codeText = result.resultCode || '';
      const codeWidth = codeText.length * 14 + 20;
      this.roundRect(ctx, (w - codeWidth) / 2, 95, codeWidth, 24, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('类型 ' + codeText, w / 2, 112);
    },

    /**
     * 绘制雷达图
     */
    paintRadar(ctx, w, centerY, data) {
      if (!data || data.length < 3) return;

      const cx = w / 2;
      const cy = centerY;
      const radius = 80;
      const sides = data.length;
      const angleStep = (Math.PI * 2) / sides;
      const startAngle = -Math.PI / 2;

      // 背景网格（4层）
      for (let level = 4; level >= 1; level--) {
        const r = (radius * level) / 4;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = startAngle + i * angleStep;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = level % 2 === 0 ? '#f8f9fc' : '#f0f2f7';
        ctx.fill();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 轴线
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i < sides; i++) {
        const angle = startAngle + i * angleStep;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
        ctx.stroke();
      }

      // 数据填充区域
      const maxVal = data[0]?.max || 50;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = startAngle + i * angleStep;
        const ratio = data[i].value / maxVal;
        const r = radius * ratio;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const dataGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      dataGrad.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
      dataGrad.addColorStop(1, 'rgba(118, 75, 162, 0.2)');
      ctx.fillStyle = dataGrad;
      ctx.fill();
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 数据点
      for (let i = 0; i < sides; i++) {
        const angle = startAngle + i * angleStep;
        const ratio = data[i].value / maxVal;
        const r = radius * ratio;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 维度标签
      ctx.fillStyle = '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < sides; i++) {
        const angle = startAngle + i * angleStep;
        const labelRadius = radius + 18;
        const x = cx + labelRadius * Math.cos(angle);
        const y = cy + labelRadius * Math.sin(angle);
        ctx.fillText(data[i].name, x, y + 4);
      }
    },

    /**
     * 绘制维度排行（取前3名）
     */
    paintDimensions(ctx, w, startY, data) {
      if (!data || data.length === 0) return;

      // 标题
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📊 你的TOP3维度', 36, startY);

      // 按分数排序（radarData 不一定是排序好的）
      const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 3);
      const maxVal = data[0]?.max || 50;

      sorted.forEach((item, i) => {
        const y = startY + 28 + i * 32;

        // 排名徽章
        const badgeColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
        ctx.fillStyle = badgeColors[i] || '#e5e7eb';
        ctx.beginPath();
        ctx.arc(46, y + 6, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), 46, y + 10);

        // 维度名称
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, 64, y + 10);

        // 进度条背景
        const barX = 130;
        const barWidth = w - 180;
        ctx.fillStyle = '#f0f2f5';
        this.roundRect(ctx, barX, y, barWidth, 12, 6);
        ctx.fill();

        // 进度条填充
        const ratio = item.value / maxVal;
        const fillGrad = ctx.createLinearGradient(barX, y, barX + barWidth * ratio, y);
        fillGrad.addColorStop(0, '#667eea');
        fillGrad.addColorStop(1, '#764ba2');
        ctx.fillStyle = fillGrad;
        this.roundRect(ctx, barX, y, barWidth * ratio, 12, 6);
        ctx.fill();

        // 分数
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(item.value), w - 36, y + 10);
      });
    },

    /**
     * 绘制职业标签
     */
    paintCareers(ctx, w, startY, result) {
      const careers = result.careers || [];
      if (careers.length === 0) return;

      // 标题
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💼 适合职业方向', 36, startY);

      // 标签
      let tagX = 36;
      let tagY = startY + 24;
      const tagPadding = 10;
      const tagHeight = 24;

      ctx.font = '11px sans-serif';

      careers.slice(0, 6).forEach((career) => {
        const textWidth = ctx.measureText(career).width;
        const tagWidth = textWidth + tagPadding * 2;

        if (tagX + tagWidth > w - 36) {
          tagX = 36;
          tagY += tagHeight + 8;
        }

        // 标签背景
        const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagWidth, tagY + tagHeight);
        tagGrad.addColorStop(0, '#f5f7ff');
        tagGrad.addColorStop(1, '#fff0f6');
        ctx.fillStyle = tagGrad;
        this.roundRect(ctx, tagX, tagY, tagWidth, tagHeight, 12);
        ctx.fill();

        // 标签文字
        ctx.fillStyle = '#667eea';
        ctx.textAlign = 'center';
        ctx.fillText(career, tagX + tagWidth / 2, tagY + 16);

        tagX += tagWidth + 8;
      });
    },

    /**
     * 绘制底部品牌区
     */
    paintFooter(ctx, w, h) {
      const footerY = h - 70;

      // 分割线
      ctx.strokeStyle = '#f0f2f5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, footerY);
      ctx.lineTo(w - 36, footerY);
      ctx.stroke();

      // 左侧文字
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('鱼鱼测', 36, footerY + 24);

      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.fillText('霍兰德职业兴趣测评', 36, footerY + 40);

      // 右侧二维码占位（小程序码）
      const qrSize = 40;
      const qrX = w - 36 - qrSize;
      const qrY = footerY + 6;

      // 二维码白底
      ctx.fillStyle = '#ffffff';
      this.roundRect(ctx, qrX, qrY, qrSize, qrSize, 4);
      ctx.fill();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      this.strokeRoundRect(ctx, qrX, qrY, qrSize, qrSize, 4);

      // 简易二维码图案（装饰性）
      ctx.fillStyle = '#1a1a2e';
      const cellSize = 3;
      const cols = Math.floor(qrSize / cellSize);
      const rows = Math.floor(qrSize / cellSize);
      const offsetX = qrX + (qrSize - cols * cellSize) / 2;
      const offsetY = qrY + (qrSize - rows * cellSize) / 2;

      // 伪随机生成二维码样式
      const seed = 12345;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // 角落定位方块
          const isCorner = (r < 7 && c < 7) || (r < 7 && c >= cols - 7) || (r >= rows - 7 && c < 7);
          if (isCorner) {
            if (r === 0 || r === 6 || c === 0 || c === 6 ||
                (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              if (r < 7 && c < 7) {
                ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
              } else if (r < 7 && c >= cols - 7) {
                const cc = c - (cols - 7);
                if (r === 0 || r === 6 || cc === 0 || cc === 6 ||
                    (r >= 2 && r <= 4 && cc >= 2 && cc <= 4)) {
                  ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
                }
              } else if (r >= rows - 7 && c < 7) {
                const rr = r - (rows - 7);
                if (rr === 0 || rr === 6 || c === 0 || c === 6 ||
                    (rr >= 2 && rr <= 4 && c >= 2 && c <= 4)) {
                  ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
                }
              }
            }
          } else {
            // 伪随机填充
            const hash = ((seed * (r + 1) * (c + 1)) % 100);
            if (hash < 45) {
              ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      // 扫码提示
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('长按识别小程序', w - 36 - qrSize - 10, footerY + 32);
    },

    /**
     * 绘制圆角矩形路径
     * @param {CanvasRenderingContext2D} ctx
     */
    roundRect(ctx, x, y, w, h, r) {
      let radius = r;
      if (typeof r === 'object') {
        radius = { tl: 0, tr: 0, br: 0, bl: 0, ...r };
      } else {
        radius = { tl: r, tr: r, br: r, bl: r };
      }
      ctx.beginPath();
      ctx.moveTo(x + radius.tl, y);
      ctx.lineTo(x + w - radius.tr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
      ctx.lineTo(x + w, y + h - radius.br);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
      ctx.lineTo(x + radius.bl, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
      ctx.lineTo(x, y + radius.tl);
      ctx.quadraticCurveTo(x, y, x + radius.tl, y);
      ctx.closePath();
    },

    /**
     * 描边圆角矩形
     */
    strokeRoundRect(ctx, x, y, w, h, r) {
      this.roundRect(ctx, x, y, w, h, r);
      ctx.stroke();
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
