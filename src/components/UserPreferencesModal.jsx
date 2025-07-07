import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Switch, Slider, Button, Tag, message, Row, Col, Divider } from 'antd';
import { SettingOutlined, HeartOutlined, EyeOutlined, StarOutlined } from '@ant-design/icons';
import { getUserProfile, updateUserProfile } from '../api/userApi';
import { getCategoryNames } from '../utils/statusConfig';
import './UserPreferencesModal.css';

const { Option } = Select;
const { TextArea } = Input;

const UserPreferencesModal = ({ visible, onClose, onSave }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [preferences, setPreferences] = useState({
        categories: [],
        keywords: [],
        sources: [],
        readingMode: 'balanced', // 'fast', 'balanced', 'deep'
        diversityLevel: 5, // 1-10 内容多样性
        personalizedWeight: 7, // 1-10 个性化权重
        excludeKeywords: [],
        enableSmartRecommend: true,
        enableTrendingBoost: true,
        enableSemanticMatch: true
    });

    // 可选择的分类
    const categories = getCategoryNames();
    
    // 预设关键词建议
    const keywordSuggestions = [
        '人工智能', '科技创新', '经济发展', '国际关系', '环境保护',
        '教育改革', '医疗健康', '交通出行', '文化娱乐', '体育运动',
        '互联网', '新能源', '航空航天', '生物科技', '量子计算'
    ];

    // 新闻源建议
    const sourceSuggestions = [
        '新华社', '人民网', '央视新闻', '澎湃新闻', '界面新闻',
        '36氪', 'IT之家', '虎嗅网', '钛媒体', '腾讯科技'
    ];

    useEffect(() => {
        if (visible) {
            loadUserPreferences();
        }
    }, [visible]);

    // 加载用户偏好
    const loadUserPreferences = async () => {
        try {
            setLoadingProfile(true);
            const userProfile = await getUserProfile();
            
            if (userProfile && userProfile.interests) {
                try {
                    const savedPrefs = JSON.parse(userProfile.interests);
                    setPreferences(prev => ({ ...prev, ...savedPrefs }));
                    
                    // 设置表单值
                    form.setFieldsValue({
                        categories: savedPrefs.categories || [],
                        keywords: savedPrefs.keywords || [],
                        sources: savedPrefs.sources || [],
                        readingMode: savedPrefs.readingMode || 'balanced',
                        diversityLevel: savedPrefs.diversityLevel || 5,
                        personalizedWeight: savedPrefs.personalizedWeight || 7,
                        excludeKeywords: savedPrefs.excludeKeywords || [],
                        enableSmartRecommend: savedPrefs.enableSmartRecommend !== false,
                        enableTrendingBoost: savedPrefs.enableTrendingBoost !== false,
                        enableSemanticMatch: savedPrefs.enableSemanticMatch !== false
                    });
                } catch (e) {
                    console.log('解析用户偏好失败，使用默认设置');
                }
            }
        } catch (error) {
            console.error('加载用户偏好失败:', error);
            message.error('加载偏好设置失败');
        } finally {
            setLoadingProfile(false);
        }
    };

    // 保存偏好
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const newPreferences = {
                ...preferences,
                ...values
            };
            
            // 保存到后端
            await updateUserProfile({
                interests: JSON.stringify(newPreferences)
            });
            
            setPreferences(newPreferences);
            message.success('偏好设置已保存');
            
            if (onSave) {
                onSave(newPreferences);
            }
            
            onClose();
        } catch (error) {
            console.error('保存偏好失败:', error);
            message.error('保存失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 重置偏好
    const handleReset = () => {
        const defaultPrefs = {
            categories: [],
            keywords: [],
            sources: [],
            readingMode: 'balanced',
            diversityLevel: 5,
            personalizedWeight: 7,
            excludeKeywords: [],
            enableSmartRecommend: true,
            enableTrendingBoost: true,
            enableSemanticMatch: true
        };
        
        setPreferences(defaultPrefs);
        form.setFieldsValue(defaultPrefs);
        message.info('已重置为默认设置');
    };

    return (
        <Modal
            title={
                <div className="preferences-modal-title">
                    <SettingOutlined />
                    <span>个性化偏好设置</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="reset" onClick={handleReset}>
                    重置默认
                </Button>,
                <Button key="cancel" onClick={onClose}>
                    取消
                </Button>,
                <Button key="save" type="primary" loading={loading} onClick={handleSave}>
                    保存设置
                </Button>
            ]}
            width={800}
            className="preferences-modal"
        >
            <div className="preferences-content">
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={preferences}
                >
                    {/* 内容偏好 */}
                    <div className="preference-section">
                        <div className="section-header">
                            <HeartOutlined />
                            <h3>内容偏好</h3>
                            <span>设置您感兴趣的新闻类型</span>
                        </div>
                        
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="categories"
                                    label="偏好分类"
                                    tooltip="选择您最感兴趣的新闻分类"
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="选择感兴趣的分类"
                                        allowClear
                                        showArrow
                                        tagRender={(props) => (
                                            <Tag color="blue" closable={props.closable} onClose={props.onClose}>
                                                {props.label}
                                            </Tag>
                                        )}
                                    >
                                        {categories.map(category => (
                                            <Option key={category} value={category}>
                                                {category}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            
                            <Col span={12}>
                                <Form.Item
                                    name="sources"
                                    label="偏好来源"
                                    tooltip="选择您信任的新闻来源"
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="选择偏好的新闻来源"
                                        allowClear
                                        showArrow
                                        tagRender={(props) => (
                                            <Tag color="green" closable={props.closable} onClose={props.onClose}>
                                                {props.label}
                                            </Tag>
                                        )}
                                    >
                                        {sourceSuggestions.map(source => (
                                            <Option key={source} value={source}>
                                                {source}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="keywords"
                                    label="关键词偏好"
                                    tooltip="添加您感兴趣的关键词，系统会优先推荐相关内容"
                                >
                                    <Select
                                        mode="tags"
                                        placeholder="输入或选择关键词"
                                        allowClear
                                        tagRender={(props) => (
                                            <Tag color="orange" closable={props.closable} onClose={props.onClose}>
                                                {props.label}
                                            </Tag>
                                        )}
                                    >
                                        {keywordSuggestions.map(keyword => (
                                            <Option key={keyword} value={keyword}>
                                                {keyword}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            
                            <Col span={12}>
                                <Form.Item
                                    name="excludeKeywords"
                                    label="屏蔽关键词"
                                    tooltip="添加您不感兴趣的关键词，系统会避免推荐相关内容"
                                >
                                    <Select
                                        mode="tags"
                                        placeholder="输入要屏蔽的关键词"
                                        allowClear
                                        tagRender={(props) => (
                                            <Tag color="red" closable={props.closable} onClose={props.onClose}>
                                                {props.label}
                                            </Tag>
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Divider />

                    {/* 推荐策略 */}
                    <div className="preference-section">
                        <div className="section-header">
                            <EyeOutlined />
                            <h3>推荐策略</h3>
                            <span>调整推荐算法的行为</span>
                        </div>
                        
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="readingMode"
                                    label="阅读模式"
                                    tooltip="选择符合您阅读习惯的模式"
                                >
                                    <Select>
                                        <Option value="fast">快速浏览 - 短文优先</Option>
                                        <Option value="balanced">平衡模式 - 长短结合</Option>
                                        <Option value="deep">深度阅读 - 详细内容</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            
                            <Col span={8}>
                                <Form.Item
                                    name="diversityLevel"
                                    label={`内容多样性: ${form.getFieldValue('diversityLevel') || 5}`}
                                    tooltip="数值越高，推荐内容越多样化"
                                >
                                    <Slider
                                        min={1}
                                        max={10}
                                        marks={{
                                            1: '专注',
                                            5: '平衡',
                                            10: '多样'
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            
                            <Col span={8}>
                                <Form.Item
                                    name="personalizedWeight"
                                    label={`个性化程度: ${form.getFieldValue('personalizedWeight') || 7}`}
                                    tooltip="数值越高，越倾向于推荐符合您偏好的内容"
                                >
                                    <Slider
                                        min={1}
                                        max={10}
                                        marks={{
                                            1: '通用',
                                            5: '平衡',
                                            10: '精准'
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Divider />

                    {/* 智能功能 */}
                    <div className="preference-section">
                        <div className="section-header">
                            <StarOutlined />
                            <h3>智能功能</h3>
                            <span>启用或关闭AI增强功能</span>
                        </div>
                        
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="enableSmartRecommend"
                                    label="智能推荐"
                                    valuePropName="checked"
                                    tooltip="使用AI算法分析您的阅读行为，提供更精准的推荐"
                                >
                                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                                </Form.Item>
                            </Col>
                            
                            <Col span={8}>
                                <Form.Item
                                    name="enableTrendingBoost"
                                    label="热点提升"
                                    valuePropName="checked"
                                    tooltip="在个性化推荐中适当增加热门内容的权重"
                                >
                                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                                </Form.Item>
                            </Col>
                            
                            <Col span={8}>
                                <Form.Item
                                    name="enableSemanticMatch"
                                    label="语义匹配"
                                    valuePropName="checked"
                                    tooltip="使用语义理解技术，推荐意思相关的内容"
                                >
                                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </div>
        </Modal>
    );
};

export default UserPreferencesModal; 