/**
 * 主应用逻辑
 * 管理页面流程、任务执行、数据提交
 */

class App {
    constructor() {
        // API 地址
        this.apiUrl = window.location.origin;
        
        // 会话信息
        this.sessionId = this.generateUUID();
        this.userInfo = {
            age: null,
            gender: null
        };
        
        // 任务配置
        this.tasks = [
            { type: 'baseline', name: '基线校准', duration: 6, description: '请依次注视屏幕上出现的圆点，帮助系统校准您的眼动。' },
            { type: 'image', name: '图片识别', duration: 6, description: '请仔细观察两张图片，重点关注公鸡图片。' },
            { type: 'video', name: '视频观看', duration: 10, description: '请观看视频，自然地跟随画面内容。' },
            { type: 'text', name: '文字阅读', duration: 15, description: '请大声朗读屏幕上的文字段落。' }
        ];
        
        this.currentTaskIndex = 0;
        this.taskResults = {};
        
        // 页面元素
        this.pages = {
            welcome: document.getElementById('page-welcome'),
            prepare: document.getElementById('page-prepare'),
            task: document.getElementById('page-task'),
            processing: document.getElementById('page-processing'),
            report: document.getElementById('page-report')
        };
    }

    /**
     * 生成 UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 切换页面
     */
    showPage(pageName) {
        Object.values(this.pages).forEach(page => page.classList.remove('active'));
        this.pages[pageName].classList.add('active');
    }

    /**
     * 启动系统
     */
    async startSystem() {
        // 获取用户信息
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        
        if (!age || age < 1 || age > 120) {
            alert('请输入有效的年龄（1-120）');
            return;
        }
        
        this.userInfo.age = age;
        this.userInfo.gender = gender;
        
        // 初始化 WebGazer
        try {
            await eyeTracker.init();
            
            // 开始第一个任务
            this.currentTaskIndex = 0;
            this.showPrepareScreen();
            
        } catch (error) {
            alert('摄像头初始化失败，请确保已授予摄像头权限。\n错误: ' + error.message);
        }
    }

    /**
     * 显示准备页面
     */
    showPrepareScreen() {
        const task = this.tasks[this.currentTaskIndex];
        
        document.getElementById('prepare-title').textContent = task.name;
        document.getElementById('prepare-description').textContent = task.description;
        
        this.showPage('prepare');
        
        // 3秒倒计时
        this.startPrepareCountdown(3);
    }

    /**
     * 准备倒计时
     */
    startPrepareCountdown(seconds) {
        const countdownText = document.getElementById('prepare-countdown');
        const progressCircle = document.getElementById('prepare-progress');
        
        let remaining = seconds;
        countdownText.textContent = remaining;
        
        const circumference = 2 * Math.PI * 90;
        progressCircle.style.strokeDasharray = circumference;
        
        const timer = setInterval(() => {
            remaining--;
            
            if (remaining > 0) {
                countdownText.textContent = remaining;
                const progress = (seconds - remaining) / seconds;
                progressCircle.style.strokeDashoffset = circumference * (1 - progress);
            } else {
                clearInterval(timer);
                this.startTask();
            }
        }, 1000);
    }

    /**
     * 开始任务
     */
    async startTask() {
        const task = this.tasks[this.currentTaskIndex];
        
        // 显示任务页面
        this.showPage('task');
        document.getElementById('task-title').textContent = task.name;
        
        // 显示对应的任务内容
        this.showTaskContent(task.type);

        // Baseline 任务：先执行标定流程
        if (task.type === 'baseline') {
            await this.runBaselineCalibration();
        }
        
        // 运行任务（收集眼动数据）
        const duration = task.duration;
        let elapsed = 0;
        
        eyeTracker.runTask(duration, (remaining) => {
            elapsed = duration - remaining;
            this.updateTaskTimer(elapsed, duration);
            this.updateTaskProgress(elapsed / duration * 100);
        }).then(data => {
            console.log(`${task.type} 任务完成，收集到 ${data.length} 个数据点`);
            this.onTaskComplete(task.type, data);
        });
    }

    /**
     * Baseline 标定流程：依次高亮 5 个圆点并喂给 WebGazer
     */
    async runBaselineCalibration() {
        const sequence = ['dot-center', 'dot-up', 'dot-right', 'dot-down', 'dot-left'];
        const samplesPerDot = 8;
        const durationPerDotMs = 1200;
        const interval = durationPerDotMs / samplesPerDot;

        const calibrationSamples = [];

        // 启动 WebGazer（仅用于标定，不记录前端数据）
        try {
            if (window.webgazer) {
                webgazer.resume();
            }
        } catch (e) {
            console.warn('Baseline 标定时恢复 WebGazer 失败:', e);
        }

        for (const dotId of sequence) {
            this.setBaselineActiveDot(dotId);

            const el = document.getElementById(dotId);
            if (!el) {
                continue;
            }

            const rect = el.getBoundingClientRect();
            const trueX = rect.left + rect.width / 2;
            const trueY = rect.top + rect.height / 2;

            const predXs = [];
            const predYs = [];

            for (let i = 0; i < samplesPerDot; i++) {
                // 告诉 WebGazer：当前真实注视的位置（用于其内部回归）
                if (window.webgazer) {
                    try {
                        webgazer.recordScreenPosition(trueX, trueY, 'click');
                    } catch (e) {
                        console.warn('recordScreenPosition 出错:', e);
                    }
                }

                // 采集当前预测坐标，作为标定样本
                const pred = eyeTracker.getLatestRawPrediction
                    ? eyeTracker.getLatestRawPrediction()
                    : null;
                if (pred && pred.x != null && pred.y != null) {
                    predXs.push(pred.x);
                    predYs.push(pred.y);
                }

                await this.delay(interval);
            }

            if (predXs.length > 0 && predYs.length > 0) {
                const meanPredX = predXs.reduce((a, b) => a + b, 0) / predXs.length;
                const meanPredY = predYs.reduce((a, b) => a + b, 0) / predYs.length;
                calibrationSamples.push({
                    predX: meanPredX,
                    predY: meanPredY,
                    trueX,
                    trueY
                });
            }
        }

        this.clearBaselineActiveDot();

        try {
            if (window.webgazer) {
                webgazer.pause();
            }
        } catch (e) {
            console.warn('Baseline 标定结束时暂停 WebGazer 失败:', e);
        }

        // 基于采样结果拟合标定映射并下发到 EyeTracker
        const mapping = this.computeCalibrationMapping(calibrationSamples);
        if (eyeTracker.setCalibrationMapping) {
            eyeTracker.setCalibrationMapping(mapping);
        }
    }

    /**
     * 根据标定样本拟合线性映射参数
     */
    computeCalibrationMapping(samples) {
        if (!samples || samples.length < 2) {
            console.warn('标定样本不足，使用默认映射');
            return null;
        }

        const fitAxis = (predKey, trueKey) => {
            const n = samples.length;
            let sumP = 0, sumT = 0;
            for (const s of samples) {
                sumP += s[predKey];
                sumT += s[trueKey];
            }
            const meanP = sumP / n;
            const meanT = sumT / n;

            let num = 0, den = 0;
            for (const s of samples) {
                const dp = s[predKey] - meanP;
                const dt = s[trueKey] - meanT;
                num += dp * dt;
                den += dp * dp;
            }

            if (Math.abs(den) < 1e-6) {
                // 几乎没有变化，使用单位映射
                return { a: 1, b: 0 };
            }

            const a = num / den;
            const b = meanT - a * meanP;
            return { a, b };
        };

        const xMap = fitAxis('predX', 'trueX');
        const yMap = fitAxis('predY', 'trueY');

        const mapping = {
            ax: xMap.a,
            bx: xMap.b,
            ay: yMap.a,
            by: yMap.b
        };

        console.log('拟合得到标定映射:', mapping);
        return mapping;
    }

    /**
     * 设置当前激活的 baseline 圆点
     */
    setBaselineActiveDot(dotId) {
        document.querySelectorAll('.baseline-dots .dot').forEach(el => {
            el.classList.remove('dot-active');
        });

        const el = document.getElementById(dotId);
        if (el) {
            el.classList.add('dot-active');
        }
    }

    /**
     * 清除所有 baseline 激活状态
     */
    clearBaselineActiveDot() {
        document.querySelectorAll('.baseline-dots .dot').forEach(el => {
            el.classList.remove('dot-active');
        });
    }

    /**
     * 显示任务内容
     */
    showTaskContent(taskType) {
        // 隐藏所有任务内容
        document.querySelectorAll('.task-content').forEach(el => {
            el.style.display = 'none';
        });
        
        // 显示当前任务
        const taskElement = document.getElementById(`task-${taskType}`);
        if (taskElement) {
            taskElement.style.display = 'flex';
        }
    }

    /**
     * 更新任务计时器
     */
    updateTaskTimer(elapsed, total) {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('task-timer').textContent = timerText;
    }

    /**
     * 更新任务进度
     */
    updateTaskProgress(percent) {
        document.getElementById('task-progress').style.width = percent + '%';
    }

    /**
     * 任务完成回调
     */
    async onTaskComplete(taskType, data) {
        // 提交数据到后端
        await this.submitTaskData(taskType, data);
        
        // 下一个任务
        this.currentTaskIndex++;
        
        if (this.currentTaskIndex < this.tasks.length) {
            // 还有任务，继续
            this.showPrepareScreen();
        } else {
            // 所有任务完成，生成报告
            this.generateReport();
        }
    }

    /**
     * 提交任务数据到后端
     */
    async submitTaskData(taskType, data) {
        try {
            const response = await fetch(`${this.apiUrl}/api/task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: taskType,
                    data: data,
                    sessionId: this.sessionId,
                    age: this.userInfo.age,
                    gender: this.userInfo.gender,
                    date: new Date().toLocaleString('zh-CN')
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`${taskType} 数据提交成功`);
                this.taskResults[taskType] = result.result;
            } else {
                console.error(`${taskType} 数据提交失败:`, result.error);
            }
            
        } catch (error) {
            console.error('提交数据时出错:', error);
        }
    }

    /**
     * 生成报告
     */
    async generateReport() {
        // 显示处理中页面
        this.showPage('processing');
        
        // 模拟处理进度
        await this.simulateProcessing();
        
        // 从后端获取完整报告
        try {
            const response = await fetch(`${this.apiUrl}/api/report/${this.sessionId}`);
            const result = await response.json();
            
            if (result.success) {
                this.displayReport(result.report);
            } else {
                alert('生成报告失败: ' + result.error);
            }
            
        } catch (error) {
            console.error('获取报告时出错:', error);
            // 使用本地数据显示报告
            this.displayReport({ tasks: this.taskResults });
        }
    }

    /**
     * 模拟处理进度
     */
    async simulateProcessing() {
        const statusText = document.getElementById('processing-status');
        const progressBar = document.getElementById('processing-bar');
        
        const steps = [
            { text: '正在分析眼动轨迹...', progress: 25 },
            { text: '计算统计指标...', progress: 50 },
            { text: '生成可视化图表...', progress: 75 },
            { text: '对比参考数据...', progress: 100 }
        ];
        
        for (const step of steps) {
            statusText.textContent = step.text;
            progressBar.style.width = step.progress + '%';
            await this.delay(800);
        }
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 显示报告
     */
    displayReport(report) {
        this.showPage('report');
        
        // 设置日期
        document.getElementById('report-date').textContent = 
            `生成时间: ${new Date().toLocaleString('zh-CN')}`;
        
        // 生成任务报告
        const tasksContainer = document.getElementById('report-tasks');
        tasksContainer.innerHTML = '';
        
        for (const taskType of ['baseline', 'image', 'text', 'video']) {
            const taskData = report.tasks[taskType];
            if (taskData) {
                tasksContainer.appendChild(this.createTaskReportCard(taskData));
            }
        }
    }

    /**
     * 创建任务报告卡片
     */
    createTaskReportCard(taskData) {
        const card = document.createElement('div');
        card.className = 'task-report';
        
        const taskNames = {
            'baseline': '基线校准',
            'image': '图片识别',
            'video': '视频观看',
            'text': '文字阅读'
        };
        
        const stats = taskData.statistics;
        const comparison = taskData.comparison;
        
        card.innerHTML = `
            <h2>${taskNames[taskData.task] || taskData.task}</h2>
            <div class="task-stats">
                ${this.createStatItem('X 坐标平均值', stats.x_avg, comparison.baseline.x_avg, comparison.diff_percent.x_avg)}
                ${this.createStatItem('Y 坐标平均值', stats.y_avg, comparison.baseline.y_avg, comparison.diff_percent.y_avg)}
                ${this.createStatItem('X 坐标标准差', stats.x_std, comparison.baseline.x_std, comparison.diff_percent.x_std)}
                ${this.createStatItem('Y 坐标标准差', stats.y_std, comparison.baseline.y_std, comparison.diff_percent.y_std)}
            </div>
            <div class="task-visualization">
                <img src="${taskData.visualization}" alt="${taskData.task} 可视化">
            </div>
            <p style="color: #666; margin-top: 15px;">数据点数: ${taskData.data_points}</p>
        `;
        
        return card;
    }

    /**
     * 创建统计项
     */
    createStatItem(label, userValue, baselineValue, diffPercent) {
        const diffClass = diffPercent >= 0 ? 'positive' : 'negative';
        const diffSymbol = diffPercent >= 0 ? '+' : '';
        
        return `
            <div class="stat-item">
                <div class="stat-label">${label}</div>
                <div class="stat-value">${userValue.toFixed(2)}</div>
                <div class="stat-baseline">参考值: ${baselineValue.toFixed(2)}</div>
                <div class="stat-diff ${diffClass}">${diffSymbol}${diffPercent.toFixed(1)}%</div>
            </div>
        `;
    }

    /**
     * 重新开始测试
     */
    restartSystem() {
        // 重置状态
        this.sessionId = this.generateUUID();
        this.currentTaskIndex = 0;
        this.taskResults = {};
        
        // 清空表单
        document.getElementById('age').value = '';
        document.getElementById('gender').value = 'male';
        
        // 销毁 WebGazer
        eyeTracker.destroy();
        
        // 返回欢迎页
        this.showPage('welcome');
    }
}

// 创建全局应用实例
const app = new App();

// 页面加载完成后的初始化
window.addEventListener('load', () => {
    console.log('眼动追踪系统已加载');
    console.log('会话 ID:', app.sessionId);
});

