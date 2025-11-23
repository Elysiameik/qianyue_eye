/**
 * 眼动追踪封装类
 * 封装 WebGazer.js 的调用逻辑
 */

class EyeTracker {
    constructor() {
        this.predictionData = [];
        this.isTracking = false;
        this.isInitialized = false;
        this.gazeDot = null;
        this.lastGazeDotUpdate = 0;

        // 原始预测（未映射）
        this.latestRawPrediction = { x: null, y: null };

        // 标定后的线性映射参数（默认单位映射）
        this.calibrationMapping = {
            ax: 1, bx: 0,
            ay: 1, by: 0
        };

        // 红点平滑位置
        this.smoothX = null;
        this.smoothY = null;
        this.lastRenderedX = null;
        this.lastRenderedY = null;
    }

    /**
     * 初始化 WebGazer
     */
    async init() {
        if (this.isInitialized) {
            console.log('WebGazer 已初始化');
            return;
        }

        try {
            console.log('正在初始化 WebGazer...');
            
            // 移除鼠标事件监听（避免干扰）
            webgazer.removeMouseEventListeners();
            
            // 设置追踪器为 TFFacemesh（更准确）
            webgazer.setTracker('TFFacemesh');
            
            // 设置注视监听器（记录数据 + 提供给映射/红点使用）
            webgazer.setGazeListener((data, elapsedTime) => {
                if (data == null) {
                    return;
                }
                
                const x = data.x;
                const y = data.y;

                // 记录最新原始预测（用于标定）
                this.latestRawPrediction = { x, y };

                // 应用标定映射
                const { x: mx, y: my } = this.applyMapping(x, y);

                // 只在追踪状态下记录数据（使用映射后的坐标）
                if (this.isTracking) {
                    this.predictionData.push([mx, my]);
                }

                // 使用映射后的坐标更新自定义红点
                this.updateGazeDot(mx, my);
            });
            
            // 开始 WebGazer
            await webgazer.begin();

            // 关闭 WebGazer 自带 gaze dot（改用自定义红点）
            try {
                if (webgazer.showGazeDot) {
                    webgazer.showGazeDot(false);
                }
                const defaultDot = document.getElementById('webgazerGazeDot');
                if (defaultDot) {
                    defaultDot.style.display = 'none';
                }
            } catch (e) {
                console.warn('隐藏默认 gaze dot 失败:', e);
            }
            
            // 立即暂停，等待任务开始
            webgazer.pause();
            
            this.isInitialized = true;
            console.log('WebGazer 初始化完成');
            
            // 隐藏 WebGazer 的视频预览
            this.setupVideoPreview();
            
        } catch (error) {
            console.error('WebGazer 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取最新原始预测（未映射）
     */
    getLatestRawPrediction() {
        return this.latestRawPrediction;
    }

    /**
     * 设置标定映射参数
     */
    setCalibrationMapping(mapping) {
        if (!mapping) {
            this.calibrationMapping = { ax: 1, bx: 0, ay: 1, by: 0 };
            console.log('使用默认标定映射（单位映射）');
            return;
        }

        const { ax, bx, ay, by } = mapping;
        const isValid = [ax, bx, ay, by].every(v => typeof v === 'number' && isFinite(v));
        if (!isValid) {
            this.calibrationMapping = { ax: 1, bx: 0, ay: 1, by: 0 };
            console.warn('标定映射无效，回退为单位映射:', mapping);
            return;
        }

        this.calibrationMapping = { ax, bx, ay, by };
        console.log('应用标定映射:', this.calibrationMapping);
    }

    /**
     * 对原始坐标应用标定映射
     */
    applyMapping(x, y) {
        if (x == null || y == null) {
            return { x: null, y: null };
        }

        const { ax, bx, ay, by } = this.calibrationMapping || {};
        if (
            typeof ax !== 'number' || typeof bx !== 'number' ||
            typeof ay !== 'number' || typeof by !== 'number'
        ) {
            return { x, y };
        }

        return {
            x: ax * x + bx,
            y: ay * y + by
        };
    }

    /**
     * 更新全局视线红点位置（包含平滑与抖动抑制）
     */
    updateGazeDot(x, y) {
        if (!this.gazeDot) {
            this.gazeDot = document.getElementById('gaze-dot');
        }

        const dot = this.gazeDot;
        if (!dot) {
            return;
        }

        if (x == null || y == null) {
            dot.style.display = 'none';
            this.smoothX = null;
            this.smoothY = null;
            return;
        }

        // 指数滑动平均参数
        const alpha = 0.35;

        if (this.smoothX == null || this.smoothY == null) {
            this.smoothX = x;
            this.smoothY = y;
        } else {
            this.smoothX = alpha * x + (1 - alpha) * this.smoothX;
            this.smoothY = alpha * y + (1 - alpha) * this.smoothY;
        }

        const now = Date.now();
        // 300ms 节流，避免频繁 DOM 更新
        if (this.lastGazeDotUpdate && now - this.lastGazeDotUpdate < 300) {
            return;
        }

        const renderX = this.smoothX;
        const renderY = this.smoothY;

        // 小范围抖动抑制（例如 < 8 像素）
        if (this.lastRenderedX != null && this.lastRenderedY != null) {
            const dx = renderX - this.lastRenderedX;
            const dy = renderY - this.lastRenderedY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 8) {
                // 抖动太小，不更新 DOM
                return;
            }
        }

        this.lastGazeDotUpdate = now;
        this.lastRenderedX = renderX;
        this.lastRenderedY = renderY;

        dot.style.display = 'block';
        dot.style.left = `${renderX}px`;
        dot.style.top = `${renderY}px`;
    }

    /**
     * 设置摄像头预览窗口并定位覆盖层
     */
    setupVideoPreview() {
        this.moveVideoFeedToPreview();
        this.positionFaceOverlay();
        this.hideFeedbackBox();
    }

    /**
     * 将 WebGazer 摄像头画面移到自定义预览容器
     */
    moveVideoFeedToPreview() {
        const previewContainer = document.getElementById('webgazer-preview');
        const videoFeed = document.getElementById('webgazerVideoFeed');
        if (!previewContainer || !videoFeed) {
            return;
        }

        if (!previewContainer.contains(videoFeed)) {
            previewContainer.appendChild(videoFeed);
        }

        previewContainer.classList.add('visible');

        videoFeed.style.width = '100%';
        videoFeed.style.height = '100%';
        videoFeed.style.objectFit = 'cover';
        videoFeed.style.pointerEvents = 'none';
        videoFeed.style.position = 'absolute';
        videoFeed.style.top = '0';
        videoFeed.style.left = '0';
    }

    /**
     * 将面部关键点覆盖层移到预览容器
     */
    positionFaceOverlay() {
        const previewContainer = document.getElementById('webgazer-preview');
        const faceOverlay = document.getElementById('webgazerFaceOverlay');
        if (!previewContainer || !faceOverlay) {
            return;
        }

        if (!previewContainer.contains(faceOverlay)) {
            previewContainer.appendChild(faceOverlay);
        }

        Object.assign(faceOverlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        });

        faceOverlay.style.display = 'block';
        faceOverlay.style.opacity = '1';
    }

    /**
     * 隐藏 WebGazer 的反馈框
     */
    hideFeedbackBox() {
        const feedbackBox = document.getElementById('webgazerFaceFeedbackBox');
        if (feedbackBox) {
            feedbackBox.style.display = 'none';
        }
    }

    /**
     * 开始追踪
     */
    startTracking() {
        if (!this.isInitialized) {
            console.error('WebGazer 未初始化');
            return;
        }

        console.log('开始眼动追踪');
        this.predictionData = [];  // 清空之前的数据
        this.isTracking = true;
        webgazer.resume();
    }

    /**
     * 停止追踪
     */
    stopTracking() {
        console.log('停止眼动追踪');
        this.isTracking = false;
        webgazer.pause();

        // 停止时隐藏视线红点
        this.updateGazeDot(null, null);
    }

    /**
     * 获取收集到的数据
     */
    getData() {
        return this.predictionData;
    }

    /**
     * 获取数据点数量
     */
    getDataCount() {
        return this.predictionData.length;
    }

    /**
     * 清空数据
     */
    clearData() {
        this.predictionData = [];
    }

    /**
     * 执行一个完整的追踪任务
     * @param {number} duration - 持续时间（秒）
     * @param {Function} onTick - 每秒回调
     * @returns {Promise<Array>} - 返回收集到的数据
     */
    async runTask(duration, onTick = null) {
        return new Promise((resolve) => {
            this.startTracking();
            
            let remaining = duration;
            
            const timer = setInterval(() => {
                remaining--;
                
                if (onTick) {
                    onTick(remaining);
                }
                
                if (remaining <= 0) {
                    clearInterval(timer);
                    this.stopTracking();
                    resolve(this.getData());
                }
            }, 1000);
        });
    }

    /**
     * 销毁 WebGazer
     */
    destroy() {
        if (this.isInitialized) {
            webgazer.end();
            this.isInitialized = false;
            this.isTracking = false;
            this.predictionData = [];

            // 销毁时隐藏视线红点
            this.updateGazeDot(null, null);
        }
    }
}

// 创建全局实例
const eyeTracker = new EyeTracker();

