import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import AdminHeader from '../../components/admin/AdminHeader';
import { getAllEvents, updateEvent, deleteEvent, createEvent, clearAllEvents, generateEvents, triggerBatchAIAnalysis } from '../../api/adminApi';
import { message, Modal, Form, Input, Select, Switch, DatePicker, Button, Table, Space, Tag, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, CalendarOutlined, ClearOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import moment from 'moment';
import './Admin.css';
import './EventManagement.css';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EventManagement = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // 状态管理
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // 过滤器状态
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        search: '',
        sort_by: 'time'
    });

    useEffect(() => {
        fetchEvents();
    }, [pagination.current, pagination.pageSize, filters]);

    // 获取事件列表
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                ...filters
            };

            const response = await getAllEvents(params);
            if (response.code === 200) {
                setEvents(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.total || 0
                }));
            } else {
                message.error(response.message || '获取事件列表失败');
            }
        } catch (error) {
            console.error('获取事件列表失败:', error);
            if (error.response?.status === 401) {
                message.error('认证失败，请重新登录');
                navigate('/admin/login');
            } else {
                message.error('获取事件列表失败，请检查网络连接');
            }
        } finally {
            setLoading(false);
        }
    };

    // 处理表格分页变化
    const handleTableChange = (paginationInfo) => {
        setPagination(prev => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize
        }));
    };

    // 处理过滤器变化
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({
            ...prev,
            current: 1
        }));
    };

    // 打开新增/编辑模态框
    const openModal = (eventItem = null) => {
        setEditingEvent(eventItem);
        setModalVisible(true);

        if (eventItem) {
            form.setFieldsValue({
                ...eventItem,
                time_range: [
                    moment(eventItem.start_time),
                    moment(eventItem.end_time)
                ],
                tags: eventItem.tags ? JSON.parse(eventItem.tags) : [],
                related_links: eventItem.related_links ? JSON.parse(eventItem.related_links) : []
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                status: '进行中',
                category: ''
            });
        }
    };

    // 关闭模态框
    const closeModal = () => {
        setModalVisible(false);
        setEditingEvent(null);
        form.resetFields();
    };

    // 提交表单
    const handleSubmit = async (values) => {
        try {
            const submitData = {
                ...values,
                start_time: values.time_range[0].toISOString(),
                end_time: values.time_range[1].toISOString(),
                tags: values.tags ? JSON.stringify(values.tags) : '',
                related_links: values.related_links ? JSON.stringify(values.related_links) : ''
            };

            // 移除time_range字段
            delete submitData.time_range;

            let response;
            if (editingEvent) {
                response = await updateEvent(editingEvent.id, submitData);
            } else {
                response = await createEvent(submitData);
            }

            if (response.code === 200) {
                message.success(editingEvent ? '更新事件成功' : '创建事件成功');
                closeModal();
                fetchEvents();
            } else {
                message.error(response.message || '操作失败');
            }
        } catch (error) {
            console.error('提交失败:', error);
            message.error('操作失败，请重试');
        }
    };

    // 删除事件
    const handleDelete = async (id) => {
        try {
            // 添加调试信息
            console.log('准备删除事件 - ID:', id, '类型:', typeof id);
            
            // 确保ID是数字类型
            const eventId = typeof id === 'string' ? parseInt(id, 10) : id;
            if (isNaN(eventId) || eventId <= 0) {
                message.error('无效的事件ID');
                return;
            }
            
            console.log('转换后的ID:', eventId, '类型:', typeof eventId);
            
            const response = await deleteEvent(eventId);
            if (response.code === 200) {
                message.success('删除事件成功');
                fetchEvents();
            } else {
                message.error(response.message || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            message.error('删除失败，请重试');
        }
    };

    // 清空所有事件
    const handleClearAll = async () => {
        try {
            console.log('准备清空所有事件');
            
            const response = await clearAllEvents();
            if (response.code === 200) {
                const deletedCount = response.data?.deleted_count || 0;
                message.success(`成功清空 ${deletedCount} 个事件`);
                fetchEvents(); // 刷新列表
            } else {
                message.error(response.message || '清空事件失败');
            }
        } catch (error) {
            console.error('清空事件失败:', error);
            message.error('清空事件失败，请重试');
        }
    };

    // 手动更新事件 - 重新生成事件
    const handleGenerateEvents = async () => {
        try {
            console.log('准备重新生成事件');
            setLoading(true);
            
            const response = await generateEvents();
            if (response.code === 200) {
                const generatedCount = response.data?.generated_count || 0;
                message.success(`成功生成 ${generatedCount} 个事件`);
                fetchEvents(); // 刷新列表
            } else {
                message.error(response.message || '事件生成失败');
            }
        } catch (error) {
            console.error('事件生成失败:', error);
            message.error('事件生成失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 触发AI分析
    const handleTriggerAIAnalysis = async () => {
        try {
            console.log('准备触发AI分析');
            setLoading(true);
            
            const response = await triggerBatchAIAnalysis();
            if (response.code === 200) {
                const processedCount = response.data?.processed_count || 0;
                message.success(`AI分析完成，处理了 ${processedCount} 条新闻`);
            } else {
                message.error(response.message || 'AI分析失败');
            }
        } catch (error) {
            console.error('AI分析失败:', error);
            message.error('AI分析失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 获取事件状态颜色
    const getStatusColor = (status, startTime, endTime) => {
        const now = moment();
        const start = moment(startTime);
        const end = moment(endTime);

        if (status === '已结束' || now.isAfter(end)) {
            return 'red';
        } else if (status === '进行中' && now.isBetween(start, end)) {
            return 'green';
        } else if (now.isBefore(start)) {
            return 'blue';
        }
        return 'orange';
    };

    // 获取事件状态文本
    const getStatusText = (status, startTime, endTime) => {
        const now = moment();
        const start = moment(startTime);
        const end = moment(endTime);

        if (status === '已结束' || now.isAfter(end)) {
            return '已结束';
        } else if (now.isBetween(start, end)) {
            return '进行中';
        } else if (now.isBefore(start)) {
            return '未开始';
        }
        return status;
    };

    // 表格列定义
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '事件信息',
            key: 'event_info',
            render: (_, record) => (
                <div>
                    <div className="event-title">{record.title}</div>
                    {record.description && (
                        <div className="event-description">{record.description.substring(0, 100)}...</div>
                    )}
                    {record.location && (
                        <div className="event-location">📍 {record.location}</div>
                    )}
                </div>
            )
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            render: (category) => category ? <Tag color="blue">{category}</Tag> : '-'
        },
        {
            title: '状态',
            key: 'status',
            width: 100,
            render: (_, record) => {
                const statusText = getStatusText(record.status, record.start_time, record.end_time);
                const statusColor = getStatusColor(record.status, record.start_time, record.end_time);
                return <Tag color={statusColor}>{statusText}</Tag>;
            }
        },
        {
            title: '时间',
            key: 'time',
            width: 180,
            render: (_, record) => (
                <div className="event-time">
                    <div>开始: {moment(record.start_time).format('MM-DD HH:mm')}</div>
                    <div>结束: {moment(record.end_time).format('MM-DD HH:mm')}</div>
                </div>
            )
        },
        {
            title: '统计',
            key: 'stats',
            width: 120,
            render: (_, record) => (
                <div className="event-stats">
                    <div>浏览: {record.view_count || 0}</div>
                    <div>点赞: {record.like_count || 0}</div>
                    <div>热度: {(record.hotness_score || 0).toFixed(1)}</div>
                </div>
            )
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: '操作',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/story/${record.id}`, '_blank')}
                        title="查看"
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openModal(record)}
                        title="编辑"
                    />
                    <Popconfirm
                        title="确定要删除这个事件吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            title="删除"
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="admin-container">
            <AdminHeader />

            <div className="admin-content">
                <div className="page-header">
                    <h1 className="page-title">事件管理</h1>
                    <p className="page-subtitle">管理系统中的所有热点事件</p>
                </div>

                <div className="content-card">
                    {/* 过滤器和操作栏 */}
                    <div className="filter-section">
                        <div className="filter-row">
                            <Select
                                placeholder="选择状态"
                                style={{ width: 120 }}
                                allowClear
                                value={filters.status}
                                onChange={(value) => handleFilterChange('status', value)}
                            >
                                <Option value="进行中">进行中</Option>
                                <Option value="已结束">已结束</Option>
                            </Select>

                            <Select
                                placeholder="排序方式"
                                style={{ width: 120 }}
                                value={filters.sort_by}
                                onChange={(value) => handleFilterChange('sort_by', value)}
                            >
                                <Option value="time">按时间</Option>
                                <Option value="hotness">按热度</Option>
                                <Option value="views">按浏览量</Option>
                            </Select>

                            <Input
                                placeholder="搜索标题或描述"
                                style={{ width: 200 }}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                allowClear
                            />

                            <div className="action-buttons">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => openModal()}
                                >
                                    新增事件
                                </Button>

                                <Button
                                    type="default"
                                    icon={<ThunderboltOutlined />}
                                    onClick={handleTriggerAIAnalysis}
                                    loading={loading}
                                >
                                    AI分析
                                </Button>

                                <Button
                                    type="default"
                                    icon={<ReloadOutlined />}
                                    onClick={handleGenerateEvents}
                                    loading={loading}
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                                >
                                    更新事件
                                </Button>
                                
                                <Popconfirm
                                    title="清空所有事件"
                                    description="确定要清空所有事件吗？此操作无法撤销！"
                                    onConfirm={handleClearAll}
                                    okText="确定清空"
                                    cancelText="取消"
                                    okType="danger"
                                >
                                    <Button
                                        danger
                                        icon={<ClearOutlined />}
                                        disabled={!events || events.length === 0}
                                    >
                                        清空事件
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>
                    </div>

                    {/* 事件表格 */}
                    <Table
                        columns={columns}
                        dataSource={events}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1200 }}
                    />
                </div>
            </div>

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingEvent ? '编辑事件' : '新增事件'}
                open={modalVisible}
                onCancel={closeModal}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="事件标题"
                        rules={[
                            { required: true, message: '请输入事件标题' },
                            { min: 1, max: 200, message: '标题长度应在1-200字符之间' }
                        ]}
                    >
                        <Input placeholder="请输入事件标题" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="事件描述"
                        rules={[{ max: 1000, message: '描述长度不能超过1000字符' }]}
                    >
                        <TextArea
                            placeholder="请输入事件描述"
                            rows={3}
                            maxLength={1000}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="详细内容"
                        rules={[{ required: true, message: '请输入事件详细内容' }]}
                    >
                        <TextArea
                            placeholder="请输入事件详细内容"
                            rows={6}
                            maxLength={10000}
                            showCount
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="category"
                            label="分类"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: '请输入事件分类' }]}
                        >
                            <Input placeholder="请输入事件分类" maxLength={50} />
                        </Form.Item>

                        <Form.Item
                            name="location"
                            label="地点"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: '请输入事件地点' }]}
                        >
                            <Input placeholder="请输入事件地点" maxLength={255} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="time_range"
                        label="事件时间"
                        rules={[{ required: true, message: '请选择事件时间范围' }]}
                    >
                        <RangePicker
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder={['开始时间', '结束时间']}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="source"
                            label="来源"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="请输入事件来源" maxLength={100} />
                        </Form.Item>

                        <Form.Item
                            name="author"
                            label="作者"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="请输入作者信息" maxLength={100} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="status"
                        label="状态"
                    >
                        <Select placeholder="选择事件状态">
                            <Option value="进行中">进行中</Option>
                            <Option value="已结束">已结束</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="image"
                        label="事件图片URL"
                    >
                        <Input placeholder="请输入事件图片URL" />
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={closeModal}>
                            取消
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingEvent ? '更新' : '创建'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default EventManagement;