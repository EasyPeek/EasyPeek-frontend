import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Space, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import './Register.css';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[A-Za-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/register', {
        username: values.username,
        email: values.email,
        password: values.password,
      });

      if (response.data.code === 200) {
        message.success('注册成功！请登录');
        navigate('/login');
      } else {
        // 根据后端返回的错误码显示具体错误信息
        const errorMessage = response.data.message || '注册失败';
        message.error(errorMessage);
      }
    }  catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        // 如果后端返回了具体的错误信息
        message.error(error.response.data.message || '登录失败，服务器错误');
      } else {
        // 网络错误等
        message.error('登录失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return '#ff4d4f';
    if (passwordStrength < 75) return '#faad14';
    return '#52c41a';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return '弱';
    if (passwordStrength < 50) return '一般';
    if (passwordStrength < 75) return '良好';
    return '强';
  };

  return (
    <div className={`register-container ${theme}`}>
      <div className="register-background">
        <div className="register-particles"></div>
        <div className="register-waves"></div>
      </div>
      
      <div className="register-theme-toggle">
        <ThemeToggle className="fixed" />
      </div>
      
      <div className="register-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
          <Col xs={22} sm={20} md={18} lg={14} xl={12} xxl={10}>
            <div className="register-wrapper">
              <div className="register-brand">
                <div className="register-logo">
                  <SafetyOutlined className="register-logo-icon" />
                </div>
                <h1 className={`register-title ${theme}`}>加入 EasyPeek</h1>
                <p className={`register-subtitle ${theme}`}>创建您的账户，开始新闻探索之旅</p>
              </div>
              
              <Card className={`register-card ${theme}`} bordered={false}>
                <Form
                  name="register"
                  onFinish={onFinish}
                  autoComplete="off"
                  size="large"
                  layout="vertical"
                  className="register-form"
                >
                  <Form.Item
                    label={<span className={`register-label ${theme}`}>用户名</span>}
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名!' },
                      { min: 3, message: '用户名至少3个字符!' },
                      { max: 20, message: '用户名最多20个字符!' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="register-input-icon" />}
                      placeholder="请输入您的用户名"
                      className={`register-input ${theme}`}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className={`register-label ${theme}`}>邮箱地址</span>}
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱!' },
                      { type: 'email', message: '请输入有效的邮箱地址!' }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="register-input-icon" />}
                      placeholder="请输入您的邮箱地址"
                      className={`register-input ${theme}`}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className={`register-label ${theme}`}>密码</span>}
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码!' },
                      { min: 8, message: '密码至少8个字符!' },
                      {
                        pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                        message: '密码必须包含至少一个字母和一个数字!'
                      }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="register-input-icon" />}
                      placeholder="请输入您的密码"
                      className={`register-input ${theme}`}
                      onChange={(e) => checkPasswordStrength(e.target.value)}
                    />
                  </Form.Item>
                  
                  {passwordStrength > 0 && (
                    <div className="password-strength">
                      <div className="password-strength-label">
                        <span className={`password-strength-text ${theme}`}>密码强度: </span>
                        <span 
                          className="password-strength-level"
                          style={{ color: getPasswordStrengthColor() }}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <Progress 
                        percent={passwordStrength} 
                        strokeColor={getPasswordStrengthColor()}
                        showInfo={false}
                        size="small"
                      />
                    </div>
                  )}

                  <Form.Item
                    label={<span className={`register-label ${theme}`}>确认密码</span>}
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="register-input-icon" />}
                      placeholder="请再次输入密码"
                      className={`register-input ${theme}`}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: '16px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="register-button"
                      size="large"
                    >
                      {loading ? '注册中...' : '立即注册'}
                    </Button>
                  </Form.Item>
                  
                  <div className="register-footer">
                    <Space>
                      <span className={`register-footer-text ${theme}`}>已有账户？</span>
                      <Link to="/login" className="register-link">
                        立即登录
                      </Link>
                    </Space>
                  </div>
                </Form>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Register;