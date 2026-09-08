// pages/quiz/quiz.js
const { get, post } = require('../../utils/request');
const { ensureLogin } = require('../../utils/auth');

Page({
  data: {
    assessmentId: '',
    assessment: null,
    questions: [],
    currentIndex: 0,
    answers: {}, // { questionId: optionIndex }
    loading: true,
    submitting: false,
    progressPercent: 0,
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ assessmentId: id });
    this.loadAssessment(id);
  },

  /**
   * 加载测评详情
   */
  async loadAssessment(id) {
    try {
      this.setData({ loading: true });
      const detail = await get(`/assessments/${id}`);
      this.setData({
        assessment: detail,
        questions: detail.questions,
        loading: false,
        progressPercent: 0,
      });
      wx.setNavigationBarTitle({
        title: detail.title,
      });
    } catch (err) {
      console.error('加载测评失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 选择选项
   */
  selectOption(e) {
    const optionIndex = e.currentTarget.dataset.index;
    const currentIndex = this.data.currentIndex;
    const question = this.data.questions[currentIndex];
    const answers = { ...this.data.answers };

    answers[question.id] = optionIndex;

    // 计算进度
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / this.data.questions.length) * 100);

    this.setData({
      answers,
      progressPercent,
    });

    // 自动跳转下一题（延迟300ms，让用户看到选中效果）
    setTimeout(() => {
      this.nextQuestion();
    }, 300);
  },

  /**
   * 上一题
   */
  prevQuestion() {
    if (this.data.currentIndex > 0) {
      this.setData({
        currentIndex: this.data.currentIndex - 1,
      });
    }
  },

  /**
   * 下一题
   */
  nextQuestion() {
    const { currentIndex, questions } = this.data;
    if (currentIndex < questions.length - 1) {
      this.setData({
        currentIndex: currentIndex + 1,
      });
    }
  },

  /**
   * 提交测评
   */
  async submitAssessment() {
    const { answers, questions, assessmentId } = this.data;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < questions.length * 0.8) {
      wx.showModal({
        title: '提示',
        content: `你只完成了${answeredCount}道题，建议完成至少${Math.floor(questions.length * 0.8)}道题再提交，否则结果可能不准确。`,
        confirmText: '继续提交',
        cancelText: '继续答题',
        success: (res) => {
          if (res.confirm) {
            this.doSubmit();
          }
        },
      });
      return;
    }

    wx.showModal({
      title: '确认提交',
      content: `已完成${answeredCount}/${questions.length}道题，确定提交吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmit();
        }
      },
    });
  },

  /**
   * 执行提交
   */
  async doSubmit() {
    if (this.data.submitting) return;

    try {
      this.setData({ submitting: true });
      wx.showLoading({ title: '计算结果中...', mask: true });

      // 确保已登录（保存记录需要用户身份）
      try {
        await ensureLogin();
      } catch (err) {
        // 登录失败也没关系，游客也能看结果，只是不保存记录
        console.warn('登录失败，以游客身份继续');
      }

      const result = await post(`/assessments/${this.data.assessmentId}/submit`, {
        answers: this.data.answers,
      });

      wx.hideLoading();

      // 跳转到结果页
      wx.redirectTo({
        url: `/pages/result/result?recordId=${result.recordId || ''}&assessmentId=${this.data.assessmentId}`,
      });

      // 把结果暂存到storage，结果页可以从storage取（避免刷新丢失）
      wx.setStorageSync('lastResult', result);

    } catch (err) {
      console.error('提交失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '提交失败',
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 退出确认
   */
  onBackPress() {
    const answeredCount = Object.keys(this.data.answers).length;
    if (answeredCount > 0) {
      wx.showModal({
        title: '提示',
        content: '测评还未完成，确定退出吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        },
      });
    } else {
      wx.navigateBack();
    }
  },
});
