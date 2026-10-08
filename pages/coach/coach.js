// pages/coach/coach.js
const { post, streamRequest } = require('../../utils/request');
const { ensureLogin } = require('../../utils/auth');

const QUICK_QUESTIONS = [
  '我的报告里职业方向怎么选',
  '我适合走技术还是管理路线',
  '我的短板维度怎么补',
  '帮我做一个 90 天职业计划',
];

/**
 * UTF-8 字节数组解码（不依赖 TextDecoder，处理多字节/emoji）
 */
function decodeUtf8(bytes) {
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      str += String.fromCharCode(b1);
    } else if (b1 < 0xe0) {
      str += String.fromCharCode(((b1 & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (b1 < 0xf0) {
      str += String.fromCharCode(
        ((b1 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      );
    } else {
      const cp =
        ((b1 & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      if (cp > 0xffff) {
        const c = cp - 0x10000;
        str += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 0x3ff));
      } else {
        str += String.fromCharCode(cp);
      }
    }
  }
  return str;
}

Page({
  data: {
    recordId: '',
    messages: [],
    inputValue: '',
    loading: false,
    needUnlock: false,
    scrollIntoView: '',
    quickQuestions: QUICK_QUESTIONS,
  },

  async onLoad(options) {
    const recordId = options.recordId || '';
    if (!recordId) {
      wx.showToast({ title: '缺少测评记录', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }
    this.setData({ recordId });

    try {
      await ensureLogin();
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    this.setData({
      messages: [
        {
          role: 'assistant',
          content: '你好，我是你的 AI 生涯教练。我已经看过你的测评报告了，关于职业方向、发展建议或任何困惑，都可以直接问我～',
        },
      ],
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onQuickTap(e) {
    const q = e.currentTarget.dataset.q;
    if (q) this.sendMessage(q);
  },

  async sendMessage(text) {
    const message = (text || this.data.inputValue).trim();
    if (!message || this.data.loading) return;

    const prev = this.data.messages;
    const messages = prev.concat({ role: 'user', content: message });
    // 预置一个空的助手消息占位，流式增量往里填
    const withPlaceholder = messages.concat({ role: 'assistant', content: '' });
    const streamIndex = withPlaceholder.length - 1;
    this.setData({ messages: withPlaceholder, inputValue: '', loading: true, scrollIntoView: `msg-${streamIndex}` });

    const history = prev
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    let buffer = [];        // 字节缓冲，只处理以 \n 结尾的完整行
    let accText = '';       // 累计的回复文本
    let done = false;

    const flushLine = (line) => {
      const l = line.replace(/\r$/, '');
      if (!l.startsWith('data:')) return;
      const payload = l.slice(5).trim();
      if (payload === '[DONE]') {
        done = true;
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch (e) {
        return;
      }
      if (parsed && typeof parsed === 'object' && parsed.error) {
        done = true;
        if (parsed.error === 3001) {
          this.setData({ needUnlock: true, loading: false });
        } else {
          wx.showToast({ title: parsed.message || '发送失败', icon: 'none' });
          this.setData({ loading: false });
        }
        return;
      }
      if (typeof parsed === 'string') {
        accText += parsed;
        this.setData({ [`messages[${streamIndex}].content`]: accText });
      }
    };

    const handleBytes = (bytes) => {
      for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
      let nl;
      while ((nl = buffer.indexOf(0x0a)) !== -1) {
        const lineBytes = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        flushLine(decodeUtf8(lineBytes));
      }
    };

    try {
      await streamRequest({
        url: '/ai-coach/chat/stream',
        data: { recordId: this.data.recordId, message, history },
        onChunk(arrayBuffer) {
          handleBytes(new Uint8Array(arrayBuffer));
        },
        onComplete(res) {
          // 兜底：若流式回调没收到内容，用完整响应体解析一次
          if (accText === '' && !done && res.data instanceof ArrayBuffer) {
            handleBytes(new Uint8Array(res.data));
          }
        },
      });

      // 处理残余字节
      if (buffer.length > 0) flushLine(decodeUtf8(buffer));
      if (!this.data.needUnlock) {
        this.setData({ loading: false, scrollIntoView: `msg-${streamIndex}` });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '发送失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onUnlock() {
    try {
      await ensureLogin();
      await post(`/assessments/${this.data.recordId}/unlock`, { type: 'share' });
      this.setData({ needUnlock: false });
      wx.showToast({ title: '解锁成功！', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '解锁失败，请重试', icon: 'none' });
    }
  },
});
