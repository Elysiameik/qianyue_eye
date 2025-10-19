/**
 * 眼动追踪封装类
 * 封装 WebGazer.js 的调用逻辑
 */

class EyeTracker {
    constructor() {
        this.predictionData = [];
        this.isTracking = false;
        this.isInitialized = false;
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
            
            // 设置注视监听器
            webgazer.setGazeListener((data, elapsedTime) => {
                if (data == null) {
                    return;
                }
                
                // 只在追踪状态下记录数据
                if (this.isTracking) {
                    const x = data.x;
                    const y = data.y;
                    this.predictionData.push([x, y]);
                }
            });
            
            // 开始 WebGazer
            await webgazer.begin();
            
            // 立即暂停，等待任务开始
            webgazer.pause();
            
            this.isInitialized = true;
            console.log('WebGazer 初始化完成');
            
            // 隐藏 WebGazer 的视频预览
            this.hideVideoPreview();
            
        } catch (error) {
            console.error('WebGazer 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 隐藏 WebGazer 的视频预览
     */
    hideVideoPreview() {
        // WebGazer 默认会创建视频预览，我们将其隐藏
        const webgazerVideoFeed = document.getElementById('webgazerVideoFeed');
        if (webgazerVideoFeed) {
            webgazerVideoFeed.style.display = 'none';
        }
        
        const webgazerFaceOverlay = document.getElementById('webgazerFaceOverlay');
        if (webgazerFaceOverlay) {
            webgazerFaceOverlay.style.display = 'none';
        }
        
        const webgazerFaceFeedbackBox = document.getElementById('webgazerFaceFeedbackBox');
        if (webgazerFaceFeedbackBox) {
            webgazerFaceFeedbackBox.style.display = 'none';
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
        }
    }
}

// 创建全局实例
const eyeTracker = new EyeTracker();

