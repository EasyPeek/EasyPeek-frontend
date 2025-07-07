import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import AdminHeader from '../../components/admin/AdminHeader';
import { getAllNews, updateNews, deleteNews, createNews } from '../../api/adminApi';
import { message, Modal, Form, Input, Select, Switch, DatePicker, Button, Table, Space, Tag, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import './Admin.css';
import './NewsManagement.css';

const { TextArea } = Input;
const { Option } = Select;

const NewsManagement = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });

    // 过滤器状态
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        source_type: '',
        search: ''
    });

    useEffect(() => {
        fetchNews();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current,
                size: pagination.pageSize,
                ...filters
            };

            const response = await getAllNews(params);
            if (response.code === 200) {
                setNews(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.total || 0
                }));
            } else {
                message.error(response.message || '获取新闻列表失败');
            }
        } catch (error) {
            console.error('获取新闻列表失败:', error);
            if (error.response?.status === 401) {
                message.error('认证失败，请重新登录');
                navigate('/admin/login');
            } else {
                message.error('获取新闻列表失败，请检查网络连接');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (paginationInfo) => {
        setPagination(prev => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize
        }));
    };

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

    const openModal = (newsItem = null) => {
        setEditingNews(newsItem);
        setModalVisible(true);

        if (newsItem) {
            form.setFieldsValue({
                ...newsItem,
                published_at: newsItem.published_at ? moment(newsItem.published_at) : null,
                tags: newsItem.tags ? JSON.parse(newsItem.tags) : []
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                is_active: true,
                status: 'published',
                source_type: 'manual'
            });
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingNews(null);
        form.resetFields();
    };

    const handleSubmit = async (values) => {
        try {
            const submitData = {
                ...values,
                published_at: values.published_at ? values.published_at.toISOString() : null,
                tags: values.tags ? JSON.stringify(values.tags) : ''
            };

            let response;
            if (editingNews) {
                response = await updateNews(editingNews.id, submitData);
            } else {
                response = await createNews(submitData);
            }

            if (response.code === 200) {
                message.success(editingNews ? '更新新闻成功' : '创建新闻成功');
                closeModal();
                fetchNews();
            } else {
                message.error(response.message || '操作失败');
            }
        } catch (error) {
            console.error('提交失败:', error);
            message.error('操作失败，请重试');
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await deleteNews(id);
            if (response.code === 200) {
                message.success('删除新闻成功');
                fetchNews();
            } else {
                message.error(response.message || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            message.error('删除失败，请重试');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            render: (text) => (
                <div>
                    <div className="news-title">{text}</div>
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
            title: '来源',
            dataIndex: 'source',
            key: 'source',
            width: 120,
            render: (source) => (
                <div>
                    <div>{source}</div>
                </div>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Tag color={status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'red'}>
                    {status === 'published' ? '已发布' : status === 'draft' ? '草稿' : '已下线'}
                </Tag>
            )
        },
        {
            title: '发布时间',
            dataIndex: 'published_at',
            key: 'published_at',
            width: 180,
            render: (date) => date ? moment(date).format('YYYY-MM-DD HH:mm') : '-'
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
                        onClick={() => window.open(`/newspage/${record.id}`, '_blank')}
                        title="查看"
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openModal(record)}
                        title="编辑"
                    />
                    <Popconfirm
                        title="确定要删除这条新闻吗？"
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
                    <h1 className="page-title">新闻管理</h1>
                    <p className="page-subtitle">管理系统中的新闻内容</p>
                </div>

                <div className="content-card">
                    <div className="card-header">
                        <div className="header-left">
                            <h2 className="card-title">新闻列表</h2>
                        </div>
                        <div className='card-right'>
                            <Space>
                                <Select
                                    placeholder="选择状态"
                                    style={{ width: 120 }}
                                    allowClear
                                    value={filters.status}
                                    onChange={(value) => handleFilterChange('status', value)}
                                >
                                    <Option value="published">已发布</Option>
                                    <Option value="draft">草稿</Option>
                                    <Option value="archived">已下线</Option>
                                </Select>

                                <Select
                                    placeholder="选择来源类型"
                                    style={{ width: 120 }}
                                    allowClear
                                    value={filters.source_type}
                                    onChange={(value) => handleFilterChange('source_type', value)}
                                >
                                    <Option value="manual">手动</Option>
                                    <Option value="rss">RSS</Option>
                                </Select>

                                <Input
                                    placeholder="搜索标题或内容"
                                    style={{ width: 200 }}
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    allowClear
                                />

                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => openModal()}
                                >
                                    新增新闻
                                </Button>
                            </Space>
                        </div>
                    </div>




                    {/* 新闻表格 */}
                    <Table
                        columns={columns}
                        dataSource={news}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1200 }}
                    />
                </div>
            </div>

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingNews ? '编辑新闻' : '新增新闻'}
                open={modalVisible}
                onCancel={closeModal}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="标题"
                        rules={[
                            { required: true, message: '请输入新闻标题' },
                            { min: 5, max: 255, message: '标题长度应在5-255字符之间' }
                        ]}
                    >
                        <Input placeholder="请输入新闻标题" />
                    </Form.Item>

                    <Form.Item
                        name="summary"
                        label="摘要"
                    >
                        <TextArea
                            placeholder="请输入新闻摘要"
                            rows={3}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="内容"
                        rules={[{ required: true, message: '请输入新闻内容' }]}
                    >
                        <TextArea
                            placeholder="请输入新闻内容"
                            rows={8}
                            maxLength={10000}
                            showCount
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="category"
                            label="分类"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="请输入分类" maxLength={50} />
                        </Form.Item>

                        <Form.Item
                            name="source"
                            label="来源"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="请输入新闻来源" maxLength={100} />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="status"
                            label="状态"
                            style={{ flex: 1 }}
                        >
                            <Select placeholder="选择状态">
                                <Option value="published">已发布</Option>
                                <Option value="draft">草稿</Option>
                                <Option value="archived">已下线</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="published_at"
                            label="发布时间"
                            style={{ flex: 1 }}
                        >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                placeholder="选择发布时间"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="is_active"
                        label="是否活跃"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="活跃" unCheckedChildren="禁用" />
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={closeModal}>
                            取消
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingNews ? '更新' : '创建'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div >
    );
};

export default NewsManagement;