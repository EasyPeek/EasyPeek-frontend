// 事件状态配置
export const eventStatusConfig = {
  ongoing: { 
    label: "进行中", 
    color: "#10b981", 
    bgColor: "rgba(16, 185, 129, 0.1)" 
  },
  ended: { 
    label: "已结束", 
    color: "#6b7280", 
    bgColor: "rgba(107, 114, 128, 0.1)" 
  },
  breaking: { 
    label: "突发", 
    color: "#ef4444", 
    bgColor: "rgba(239, 68, 68, 0.1)" 
  }
};

// 事件配置
export const eventConfig = {
  "AI技术发展": { 
    label: "AI技术发展", 
    bgColor: "rgba(59, 130, 246, 0.9)" 
  },
  "气候变会议": { 
    label: "气候变会议", 
    bgColor: "rgba(16, 185, 129, 0.9)" 
  },
  "新能源汽车发展": { 
    label: "新能源汽车发展", 
    bgColor: "rgba(245, 158, 11, 0.9)" 
  },
  "太空探索计划": { 
    label: "太空探索计划", 
    bgColor: "rgba(139, 92, 246, 0.9)" 
  },
  "全球经济复苏": { 
    label: "全球经济复苏", 
    bgColor: "rgba(34, 197, 94, 0.9)" 
  },
  "奥运会筹备": { 
    label: "奥运会筹备", 
    bgColor: "rgba(251, 146, 60, 0.9)" 
  }
};

// 重要性配置
export const importanceConfig = {
  high: { 
    label: "高", 
    color: "#ef4444", 
    bgColor: "rgba(239, 68, 68, 0.1)" 
  },
  medium: { 
    label: "中", 
    color: "#f59e0b", 
    bgColor: "rgba(245, 158, 11, 0.1)" 
  },
  low: { 
    label: "低", 
    color: "#10b981", 
    bgColor: "rgba(16, 185, 129, 0.1)" 
  }
};

// 获取状态颜色的工具函数
export const getStatusColor = (status) => {
  return eventStatusConfig[status]?.color || '#6b7280';
};

// 获取状态文本的工具函数
export const getStatusText = (status) => {
  return eventStatusConfig[status]?.label || '未知';
};

// 获取重要性颜色的工具函数
export const getImportanceColor = (importance) => {
  return importanceConfig[importance]?.color || '#6b7280';
};

// 获取重要性文本的工具函数
export const getImportanceText = (importance) => {
  return importanceConfig[importance]?.label || '未知';
};