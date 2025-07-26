import React, { useState } from 'react';
import LoginForm from './LoginForm.tsx';
import RegisterForm from './RegisterForm.tsx';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </>
  );
};

export default AuthPage;