"""
配置文件
"""

# 服务器配置
HOST = '0.0.0.0'
PORT = 5000
DEBUG = True

# 任务配置（秒）
TASK_DURATIONS = {
    'baseline': 6,
    'image': 6,
    'video': 10,
    'text': 15
}

# 任务名称（中文）
TASK_NAMES = {
    'baseline': '基线校准',
    'image': '图片识别',
    'video': '视频观看',
    'text': '文字阅读'
}

# 任务描述
TASK_DESCRIPTIONS = {
    'baseline': '请依次注视屏幕上出现的圆点，帮助系统校准您的眼动。',
    'image': '请仔细观察两张图片，重点关注公鸡图片。',
    'video': '请观看视频，自然地跟随画面内容。',
    'text': '请大声朗读屏幕上的文字段落。'
}

