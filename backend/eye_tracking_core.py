"""
眼动追踪核心分析引擎
从原有系统提取并封装的核心功能
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')  # 无GUI后端
import matplotlib.pyplot as plt
import io
import base64
from typing import List, Tuple, Dict, Any


class EyeTrackingAnalyzer:
    """眼动追踪数据分析器"""
    
    # 参考值（normative measures）- 从原系统的 report.html 提取
    NORMATIVE_DATA = {
        'baseline': {
            'x_avg': 713.5751317312771,
            'y_avg': 402.7833802120454,
            'x_std': 250.3032201790183,
            'y_std': 180.3955841826786
        },
        'image': {
            'x_avg': 675.9809203021368,
            'y_avg': 507.5129294969926,
            'x_std': 96.34322937033356,
            'y_std': 54.98972616789554
        },
        'text': {
            'x_avg': 798.1710423511332,
            'y_avg': 603.50437211459584,
            'x_std': 202.98884055053023,
            'y_std': 138.0331209650518
        },
        'video': {
            'x_avg': 883.7260491898053,
            'y_avg': 606.0342106999008,
            'x_std': 197.26021187706115,
            'y_std': 107.8777422682236
        }
    }
    
    def __init__(self):
        """初始化分析器"""
        pass
    
    def get_coords(self, data: List[List[float]]) -> Tuple[List[float], List[float]]:
        """
        从数据中提取 X 和 Y 坐标
        
        Args:
            data: 坐标数据列表 [[x1, y1], [x2, y2], ...]
            
        Returns:
            (x_list, y_list): X坐标列表和Y坐标列表
        """
        x_list = []
        y_list = []
        for i in range(len(data)):
            x_list.append(data[i][0])
            y_list.append(data[i][1])
        return x_list, y_list
    
    def calculate_statistics(self, x_coords: List[float], y_coords: List[float]) -> Dict[str, float]:
        """
        计算统计指标
        
        Args:
            x_coords: X坐标列表
            y_coords: Y坐标列表
            
        Returns:
            统计数据字典
        """
        if not x_coords or not y_coords:
            return {
                'x_avg': 0,
                'y_avg': 0,
                'x_std': 0,
                'y_std': 0
            }
        
        return {
            'x_avg': float(np.mean(x_coords)),
            'y_avg': float(np.mean(y_coords)),
            'x_std': float(np.std(x_coords)),
            'y_std': float(np.std(y_coords))
        }
    
    def generate_visualization(self, x_coords: List[float], y_coords: List[float], 
                              task_name: str) -> str:
        """
        生成可视化图表并返回 base64 编码
        
        Args:
            x_coords: X坐标列表
            y_coords: Y坐标列表
            task_name: 任务名称
            
        Returns:
            base64 编码的图片字符串
        """
        plt.figure(figsize=(8, 6))
        plt.plot(x_coords, y_coords, linewidth=0.5, alpha=0.7)
        plt.title(f'{task_name.upper()} - trajectory', fontsize=14, pad=20)
        plt.xlabel('X coordinate', fontsize=12)
        plt.ylabel('Y coordinate', fontsize=12)
        plt.grid(True, alpha=0.3)
        
        # 转换为 base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        
        return f"data:image/png;base64,{image_base64}"
    
    def compare_with_baseline(self, user_stats: Dict[str, float], 
                             task_type: str) -> Dict[str, Any]:
        """
        与参考值对比
        
        Args:
            user_stats: 用户统计数据
            task_type: 任务类型
            
        Returns:
            对比结果字典
        """
        if task_type not in self.NORMATIVE_DATA:
            return {'error': f'未知任务类型: {task_type}'}
        
        baseline = self.NORMATIVE_DATA[task_type]
        
        # 计算差异百分比
        def calc_diff_percent(user_val, baseline_val):
            if baseline_val == 0:
                return 0
            return ((user_val - baseline_val) / baseline_val) * 100
        
        comparison = {
            'user': user_stats,
            'baseline': baseline,
            'diff_percent': {
                'x_avg': calc_diff_percent(user_stats['x_avg'], baseline['x_avg']),
                'y_avg': calc_diff_percent(user_stats['y_avg'], baseline['y_avg']),
                'x_std': calc_diff_percent(user_stats['x_std'], baseline['x_std']),
                'y_std': calc_diff_percent(user_stats['y_std'], baseline['y_std'])
            }
        }
        
        return comparison
    
    def process_task_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理任务数据（完整流程）
        
        Args:
            data: 包含任务数据的字典
                {
                    'task': 'baseline',
                    'data': [[x1, y1], [x2, y2], ...],
                    'sessionId': 'xxx',
                    ...
                }
                
        Returns:
            处理结果字典
        """
        task_type = data.get('task', 'unknown')
        coords_data = data.get('data', [])
        
        if not coords_data:
            return {'error': '没有眼动数据'}
        
        # 提取坐标
        x_coords, y_coords = self.get_coords(coords_data)
        
        # 计算统计
        stats = self.calculate_statistics(x_coords, y_coords)
        
        # 生成可视化
        visualization = self.generate_visualization(x_coords, y_coords, task_type)
        
        # 与参考值对比
        comparison = self.compare_with_baseline(stats, task_type)
        
        return {
            'task': task_type,
            'sessionId': data.get('sessionId'),
            'statistics': stats,
            'comparison': comparison,
            'visualization': visualization,
            'data_points': len(coords_data)
        }
    
    def generate_full_report(self, all_tasks_data: Dict[str, Dict]) -> Dict[str, Any]:
        """
        生成完整报告（所有任务）
        
        Args:
            all_tasks_data: 所有任务的处理结果
                {
                    'baseline': {...},
                    'image': {...},
                    'text': {...},
                    'video': {...}
                }
                
        Returns:
            完整报告字典
        """
        return {
            'summary': '眼动追踪分析报告',
            'tasks': all_tasks_data,
            'total_tasks': len(all_tasks_data),
            'recommendation': self._generate_recommendation(all_tasks_data)
        }
    
    def _generate_recommendation(self, tasks_data: Dict) -> str:
        """生成简单的建议（基于数据完整性）"""
        completed = len(tasks_data)
        if completed == 4:
            return '所有任务已完成，数据收集完整。'
        elif completed >= 2:
            return f'已完成 {completed}/4 个任务，建议完成剩余任务以获得更准确的分析。'
        else:
            return '任务完成较少，建议完成更多任务。'

