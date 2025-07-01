/* Login.js */
import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
        username: values.username,
        password: values.password,
      });
      
      if (response.data.code==200) {
        // 1. 保存认证信息
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // 2. 显示成功消息
        message.success('欢迎回来！登录成功');

        // 3. 直接使用 navigate 进行跳转，不再使用 setTimeout 和 try/catch
        navigate('/HomePage');
        
      } else {
        message.error(response.data.message || '登录失败，请检查用户名或密码');
      }
    } catch (error) {
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


  return (
    <div className={`login-container ${theme}`}>
      <div className="login-background">
        <div className="login-particles"></div>
        <div className="login-waves"></div>
      </div>
      
      <div className="login-theme-toggle">
        <ThemeToggle className="fixed" />
      </div>
      
      <div className="login-content">
        <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
          <Col xs={22} sm={20} md={18} lg={14} xl={12} xxl={10}>
            <div className="login-wrapper">
              <div className="login-brand">
                <div className="login-logo">
                  <EyeOutlined className="login-logo-icon" />
                </div>
                <h1 className={`login-title ${theme}`}>EasyPeek</h1>
                <p className={`login-subtitle ${theme}`}>开始您的新闻探索之旅</p>
              </div>
              
              <Card className={`login-card ${theme}`} bordered={false}>
                <Form
                  name="login"
                  onFinish={onFinish}
                  autoComplete="off"
                  size="large"
                  layout="vertical"
                  className="login-form"
                >
                  <Form.Item
                    label={<span className={`login-label ${theme}`}>用户名</span>}
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名!' },
                      { min: 3, message: '用户名至少3个字符!' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="login-input-icon" />}
                      placeholder="请输入您的用户名"
                      className={`login-input ${theme}`}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className={`login-label ${theme}`}>密码</span>}
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码!' },
                      { min: 6, message: '密码至少6个字符!' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="login-input-icon" />}
                      placeholder="请输入您的密码"
                      className={`login-input ${theme}`}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: '16px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="login-button"
                      size="large"
                    >
                      {loading ? '登录中...' : '立即登录'}
                    </Button>
                  </Form.Item>
                  
                  <div className="login-footer">
                    <Space>
                      <span className={`login-footer-text ${theme}`}>还没有账户？</span>
                      <Link to="/register" className="login-link">
                        立即注册
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

export default Login;
