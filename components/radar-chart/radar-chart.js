// components/radar-chart/radar-chart.js
/**
 * 雷达图组件 - Canvas 2D 绘制
 * 支持 3-8 个维度的雷达图展示
 *
 * @example
 * <radar-chart data="{{radarData}}" max="{{50}}"></radar-chart>
 *
 * radarData 格式:
 * [{ name: '现实型', value: 35 }, { name: '研究型', value: 42 }, ...]
 */
Component({
  properties: {
    // 数据数组：[{ name, value }]
    data: {
      type: Array,
      value: [],
    },
    // 每个维度的最大值
    max: {
      type: Number,
      value: 50,
    },
    // 雷达图大小（px，会自动转 rpx）
    size: {
      type: Number,
      value: 500, // rpx
    },
    // 线条颜色
    lineColor: {
      type: String,
      value: '#e8eaf0',
    },
    // 数据区域填充颜色
    fillColor: {
      type: String,
      value: 'rgba(102, 126, 234, 0.3)',
    },
    // 数据描边颜色
    strokeColor: {
      type: String,
      value: '#667eea',
    },
    // 文字颜色
    textColor: {
      type: String,
      value: '#666',
    },
    // 文字大小 (rpx)
    fontSize: {
      type: Number,
      value: 24,
    },
    // 雷达网层数
    levels: {
      type: Number,
      value: 4,
    },
  },

  observers: {
    'data, max, size': function () {
      this.drawRadar();
    },
  },

  lifetimes: {
    ready() {
      // 等待 canvas 节点准备好
      wx.nextTick(() => {
        this.drawRadar();
      });
    },
  },

  methods: {
    /**
     * 绘制雷达图
     */
    drawRadar() {
      const data = this.properties.data;
      if (!data || data.length < 3) return;

      const query = this.createSelectorQuery();
      query
        .select('#radarCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return;

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          const sizeRpx = this.properties.size;
          // rpx 转 px：750rpx = 屏幕宽
          const screenWidth = wx.getSystemInfoSync().screenWidth;
          const sizePx = (sizeRpx / 750) * screenWidth;

          canvas.width = sizePx * dpr;
          canvas.height = sizePx * dpr;
          ctx.scale(dpr, dpr);

          this._draw(ctx, sizePx, data);
        });
    },

    /**
     * 核心绘制逻辑
     */
    _draw(ctx, size, data) {
      const {
        max,
        lineColor,
        fillColor,
        strokeColor,
        textColor,
        fontSize,
        levels,
      } = this.properties;

      const centerX = size / 2;
      const centerY = size / 2;
      // 雷达半径：留出 25% 空间放文字
      const radius = size * 0.32;
      const count = data.length;
      const angleStep = (Math.PI * 2) / count;
      // 起始角度：从正上方开始，顺时针
      const startAngle = -Math.PI / 2;

      // 计算每个顶点的位置
      const points = data.map((item, i) => {
        const angle = startAngle + i * angleStep;
        const ratio = Math.min(item.value / max, 1);
        return {
          x: centerX + Math.cos(angle) * radius * ratio,
          y: centerY + Math.sin(angle) * radius * ratio,
          labelX: centerX + Math.cos(angle) * (radius + size * 0.12),
          labelY: centerY + Math.sin(angle) * (radius + size * 0.12),
          name: item.name,
          value: item.value,
        };
      });

      // 1. 绘制雷达网（多层多边形）
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      for (let level = levels; level >= 1; level--) {
        const levelRatio = level / levels;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = startAngle + i * angleStep;
          const x = centerX + Math.cos(angle) * radius * levelRatio;
          const y = centerY + Math.sin(angle) * radius * levelRatio;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 2. 绘制轴线
      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = lineColor;
        ctx.stroke();
      }

      // 3. 绘制数据区域
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. 绘制数据点
      const dotRadius = 5;
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        // 内点（白色）
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });

      // 5. 绘制文字标签
      const fontSizePx = (fontSize / 750) * wx.getSystemInfoSync().screenWidth;
      ctx.font = `${fontSizePx}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      points.forEach((p) => {
        ctx.fillText(p.name, p.labelX, p.labelY);
      });
    },
  },
});
