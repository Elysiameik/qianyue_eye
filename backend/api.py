"""
Flask API 服务
提供 RESTful API 接口
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.eye_tracking_core import EyeTrackingAnalyzer

# 创建 Flask 应用
app = Flask(__name__, 
            static_folder='../frontend',
            static_url_path='')
CORS(app)  # 启用跨域

# 创建分析器实例
analyzer = EyeTrackingAnalyzer()

# 存储会话数据（内存中）
session_storage = {}


@app.route('/')
def index():
    """返回前端主页"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/task', methods=['POST'])
def process_task():
    """
    处理单个任务的数据
    
    请求格式:
    {
        "task": "baseline",
        "data": [[x1, y1], [x2, y2], ...],
        "sessionId": "xxx",
        "age": "25",
        "gender": "male"
    }
    
    返回格式:
    {
        "success": true,
        "result": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': '无效的请求数据'}), 400
        
        # 处理任务数据
        result = analyzer.process_task_data(data)
        
        # 存储到会话
        session_id = data.get('sessionId', 'unknown')
        if session_id not in session_storage:
            session_storage[session_id] = {
                'age': data.get('age'),
                'gender': data.get('gender'),
                'tasks': {}
            }
        
        task_type = data.get('task')
        session_storage[session_id]['tasks'][task_type] = result
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/report/<session_id>', methods=['GET'])
def get_report(session_id):
    """
    获取完整报告
    
    返回格式:
    {
        "success": true,
        "report": {...}
    }
    """
    try:
        if session_id not in session_storage:
            return jsonify({
                'success': False,
                'error': '会话不存在'
            }), 404
        
        session_data = session_storage[session_id]
        report = analyzer.generate_full_report(session_data['tasks'])
        report['user_info'] = {
            'age': session_data.get('age'),
            'gender': session_data.get('gender')
        }
        
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    """列出所有会话"""
    sessions = []
    for sid, data in session_storage.items():
        sessions.append({
            'sessionId': sid,
            'tasks_completed': len(data['tasks']),
            'age': data.get('age'),
            'gender': data.get('gender')
        })
    
    return jsonify({
        'success': True,
        'sessions': sessions
    })


@app.after_request
def add_headers(response):
    """添加响应头（CORS等）"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response


if __name__ == '__main__':
    print("=" * 60)
    print("眼动追踪系统正在启动...")
    print("=" * 60)
    print("\n🚀 服务器地址: https://localhost:5000")
    print("📊 请在浏览器中打开上述地址开始测试\n")
    print("=" * 60)
    
    # 启动服务器（使用 adhoc SSL）
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        ssl_context='adhoc'
    )

