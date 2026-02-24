'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Radio, Tabs, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined, TeamOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

// --- 类型定义 ---
type LoginFieldType = {
  username?: string;
  password?: string;
};

type RegisterFieldType = {
  username?: string;
  password?: string;
  confirmPassword?: string;
  role?: 'merchant' | 'admin';
};

// 定义子组件需要的 Props
interface AuthFormProps {
  loading: boolean;
  onFinish: (values: any) => void;
}

// --- 正则表达式定义 ---
const REGEX = {
  // 账号：支持两种格式
  // 1. 商户账号：merchant + 数字，如 merchant01, merchant02
  // 2. 管理员账号：admin + 数字，如 admin01, admin02
  username: /^(merchant|admin)\d{2}$/,
  // 密码：6位数字，如 123456
  password: /^\d{6}$/
};

// --- 1. LoginForm 组件 ---
const LoginForm: React.FC<AuthFormProps> = ({ loading, onFinish }) => {
  const [form] = Form.useForm();
  
  return (
    <Form
      form={form}
      name="admin_login"
      onFinish={onFinish}
      layout="vertical"
      autoComplete="off"
      preserve={false}
    >
      <Form.Item<LoginFieldType>
        label="账号"
        name="username"
        rules={[
          { required: true, message: '请输入您的账号!' },
          { pattern: REGEX.username, message: '账号格式：merchant01 或 admin01' }
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="请输入商户或管理员账号" size="large" />
      </Form.Item>

      <Form.Item<LoginFieldType>
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请输入您的密码!' },
          { pattern: REGEX.password, message: '密码为6位数字，如 123456' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

// --- 2. RegisterForm 组件 ---
const RegisterForm: React.FC<AuthFormProps> = ({ loading, onFinish }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      name="admin_register"
      onFinish={onFinish}
      layout="vertical"
      initialValues={{ role: 'merchant' }}
      autoComplete="off"
      preserve={false}
    >
      <Form.Item<RegisterFieldType>
        label="账号"
        name="username"
        rules={[
          { required: true, message: '请设置您的账号!' },
          { pattern: REGEX.username, message: '账号格式：merchant01 或 admin01' }
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="设置账号" size="large" />
      </Form.Item>

      <Form.Item<RegisterFieldType>
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请设置密码!' },
          { pattern: REGEX.password, message: '密码为6位数字，如 123456' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="设置密码" size="large" />
      </Form.Item>

      <Form.Item<RegisterFieldType>
        label="确认密码"
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
        <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" size="large" />
      </Form.Item>

      <Form.Item<RegisterFieldType>
        label="注册角色"
        name="role"
        rules={[{ required: true, message: '请选择注册角色!' }]}
      >
        <Radio.Group buttonStyle="solid" className="w-full">
          <Radio.Button value="merchant" style={{ width: '50%', textAlign: 'center' }}>
            <ShopOutlined /> 商户
          </Radio.Button>
          <Radio.Button value="admin" style={{ width: '50%', textAlign: 'center' }}>
            <TeamOutlined /> 管理员
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          注册
        </Button>
      </Form.Item>
    </Form>
  );
};

// --- 主页面组件 ---
const AdminAuthPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loading, setLoading] = useState<boolean>(false);

  // --- 登录逻辑 ---
  const onLoginFinish = async (values: LoginFieldType) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        message.error(data.message || '登录失败');
        return;
      }

      message.success('登录成功');
      localStorage.setItem('token', data.token);
      router.push('/admin/dashboard');
    } catch (error) {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // --- 注册逻辑 ---
  const onRegisterFinish = async (values: RegisterFieldType) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        message.error(data.message || '注册失败');
        return;
      }

      message.success('注册成功，请登录');
      setActiveTab('login');
    } catch (error) {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // --- Tabs 配置 ---
  const items: TabsProps['items'] = [
    {
      key: 'login',
      label: '账号登录',
      children: <LoginForm loading={loading} onFinish={onLoginFinish} />,
    },
    {
      key: 'register',
      label: '新用户注册',
      children: <RegisterForm loading={loading} onFinish={onRegisterFinish} />,
    },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#f0f2f5',
      backgroundImage: 'url("https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center 110px',
      backgroundSize: '100%'
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        // [修改点1] bordered={false} 替换为 variant="borderless"
        variant="borderless"
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>易宿酒店管理后台</Title>
          <span style={{ color: '#888' }}>商户与管理员接入中心</span>
        </div>
        
        {/* [修改点2] destroyInactiveTabPane 替换为 destroyOnHidden */}
        <Tabs 
          activeKey={activeTab} 
          items={items} 
          onChange={setActiveTab} 
          centered
          destroyOnHidden={true} 
        />
      </Card>
    </div>
  );
};

export default AdminAuthPage;