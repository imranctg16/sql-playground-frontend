import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { register, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!passwordConfirmation) errors.passwordConfirmation = 'Password confirmation is required';
    if (password !== passwordConfirmation) errors.passwordConfirmation = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await register(name, email, password, passwordConfirmation);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Dynamic Orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-orbit-1"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-orbit-2"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-35 animate-orbit-3"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-orbit-4"></div>
        <div className="absolute bottom-1/3 left-1/3 w-88 h-88 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-orbit-5"></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-4 h-4 border-2 border-green-300 opacity-40 animate-float-shape" style={{animationDelay: '0s', transform: 'rotate(45deg)'}}>
        </div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-teal-300 opacity-30 animate-float-shape" style={{animationDelay: '1s', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
        </div>
        <div className="absolute bottom-60 left-40 w-8 h-8 border-2 border-cyan-300 rounded-full opacity-25 animate-float-shape" style={{animationDelay: '2s'}}>
        </div>
        <div className="absolute top-60 right-20 w-5 h-5 bg-emerald-300 opacity-35 animate-float-shape" style={{animationDelay: '3s', transform: 'rotate(45deg)'}}>
        </div>
        <div className="absolute bottom-40 right-40 w-6 h-6 border-2 border-blue-300 opacity-30 animate-float-shape" style={{animationDelay: '4s', clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)'}}>
        </div>
      </div>

      {/* Matrix-style Code Rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-10 text-green-400 opacity-25 text-xs font-mono animate-code-rain" style={{animationDelay: '0s'}}>
          INSERT<br/>CREATE<br/>ALTER<br/>GRANT<br/>REVOKE<br/>COMMIT<br/>ROLLBACK<br/>BEGIN<br/>END<br/>DECLARE
        </div>
        <div className="absolute top-0 left-32 text-teal-400 opacity-20 text-xs font-mono animate-code-rain" style={{animationDelay: '2s'}}>
          VALUES<br/>INTO<br/>SET<br/>REFERENCES<br/>CASCADE<br/>RESTRICT<br/>ACTION<br/>MATCH<br/>PARTIAL<br/>FULL
        </div>
        <div className="absolute top-0 right-20 text-cyan-400 opacity-28 text-xs font-mono animate-code-rain" style={{animationDelay: '1s'}}>
          AUTO<br/>INCREMENT<br/>IDENTITY<br/>SEQUENCE<br/>NEXTVAL<br/>CURRVAL<br/>GENERATED<br/>ALWAYS<br/>BY<br/>DEFAULT
        </div>
        <div className="absolute top-0 right-40 text-emerald-400 opacity-23 text-xs font-mono animate-code-rain" style={{animationDelay: '3s'}}>
          BOOLEAN<br/>INTEGER<br/>VARCHAR<br/>DECIMAL<br/>TIMESTAMP<br/>DATE<br/>TIME<br/>BLOB<br/>CLOB<br/>JSON
        </div>
        <div className="absolute top-0 left-60 text-blue-400 opacity-26 text-xs font-mono animate-code-rain" style={{animationDelay: '4s'}}>
          TRIGGER<br/>BEFORE<br/>AFTER<br/>INSTEAD<br/>OF<br/>FOR<br/>EACH<br/>ROW<br/>STATEMENT<br/>WHEN
        </div>
      </div>

      {/* Particle System */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-300 rounded-full opacity-40 animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      {/* Floating SQL Fragments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-green-200 opacity-40 text-sm font-mono transform rotate-12 animate-float-text" style={{animationDelay: '1s'}}>
          CREATE USER account
        </div>
        <div className="absolute top-40 right-20 text-teal-200 opacity-35 text-sm font-mono transform -rotate-6 animate-float-text" style={{animationDelay: '3s'}}>
          GRANT ALL PRIVILEGES
        </div>
        <div className="absolute bottom-40 left-20 text-cyan-200 opacity-30 text-sm font-mono transform rotate-6 animate-float-text" style={{animationDelay: '2s'}}>
          INSERT INTO users
        </div>
        <div className="absolute bottom-20 right-10 text-emerald-200 opacity-45 text-sm font-mono transform -rotate-12 animate-float-text" style={{animationDelay: '4s'}}>
          SET password = hash
        </div>
        <div className="absolute top-60 left-40 text-blue-200 opacity-25 text-sm font-mono transform rotate-3 animate-float-text" style={{animationDelay: '5s'}}>
          CREATE DATABASE app
        </div>
        <div className="absolute bottom-60 right-30 text-teal-200 opacity-40 text-sm font-mono transform -rotate-8 animate-float-text" style={{animationDelay: '6s'}}>
          BEGIN TRANSACTION
        </div>
      </div>

      {/* Lightning Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-25 animate-lightning" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/2 right-10 w-1 h-24 bg-gradient-to-b from-transparent via-teal-400 to-transparent opacity-20 animate-lightning" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 left-20 w-1 h-28 bg-gradient-to-b from-transparent via-emerald-400 to-transparent opacity-30 animate-lightning" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo/Icon */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-2xl animate-float">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              SQL Playground
            </h1>
            <p className="text-blue-200 text-lg">
              Master SQL through practice
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Join the Community!
              </h2>
              <p className="text-blue-200">
                Start your SQL learning journey
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                {formErrors.name && (
                  <p className="text-red-300 text-sm animate-shake">{formErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
                {formErrors.email && (
                  <p className="text-red-300 text-sm animate-shake">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    placeholder="Create a password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                {formErrors.password && (
                  <p className="text-red-300 text-sm animate-shake">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-white">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    placeholder="Confirm your password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {formErrors.passwordConfirmation && (
                  <p className="text-red-300 text-sm animate-shake">{formErrors.passwordConfirmation}</p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 backdrop-blur-sm animate-shake">
                  <p className="text-red-200 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-blue-200">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-medium text-white hover:text-blue-200 underline underline-offset-2 decoration-2 decoration-green-400 hover:decoration-blue-200 transition-all duration-300"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes orbit-1 {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(100px, -50px) rotate(90deg); }
          50% { transform: translate(0, -100px) rotate(180deg); }
          75% { transform: translate(-100px, -50px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes orbit-2 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-80px, 80px) rotate(120deg) scale(1.1); }
          66% { transform: translate(80px, 40px) rotate(240deg) scale(0.9); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); }
        }

        @keyframes orbit-3 {
          0% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(60px, 100px) rotate(72deg); }
          40% { transform: translate(-40px, 120px) rotate(144deg); }
          60% { transform: translate(-120px, 20px) rotate(216deg); }
          80% { transform: translate(-60px, -80px) rotate(288deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes orbit-4 {
          0% { transform: translate(0, 0) rotate(0deg) scale(0.8); }
          50% { transform: translate(-120px, -60px) rotate(180deg) scale(1.2); }
          100% { transform: translate(0, 0) rotate(360deg) scale(0.8); }
        }

        @keyframes orbit-5 {
          0% { transform: translate(0, 0) rotate(0deg); }
          30% { transform: translate(90px, -90px) rotate(108deg); }
          60% { transform: translate(-60px, -120px) rotate(216deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes float-shape {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(-40px) translateX(-10px) rotate(180deg); }
          75% { transform: translateY(-20px) translateX(15px) rotate(270deg); }
        }

        @keyframes code-rain {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes particle {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; transform: scale(1); }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }

        @keyframes float-text {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(var(--rotation, 0deg)); }
          25% { transform: translateY(-15px) translateX(8px) rotate(var(--rotation, 0deg)); }
          50% { transform: translateY(-30px) translateX(-5px) rotate(var(--rotation, 0deg)); }
          75% { transform: translateY(-15px) translateX(12px) rotate(var(--rotation, 0deg)); }
        }

        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          5%, 10% { opacity: 1; }
          15%, 20% { opacity: 0; }
          25%, 30% { opacity: 0.8; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 1s ease-out 0.3s both;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-orbit-1 {
          animation: orbit-1 20s linear infinite;
        }

        .animate-orbit-2 {
          animation: orbit-2 25s linear infinite reverse;
        }

        .animate-orbit-3 {
          animation: orbit-3 30s linear infinite;
        }

        .animate-orbit-4 {
          animation: orbit-4 15s linear infinite reverse;
        }

        .animate-orbit-5 {
          animation: orbit-5 35s linear infinite;
        }

        .animate-float-shape {
          animation: float-shape 8s ease-in-out infinite;
        }

        .animate-code-rain {
          animation: code-rain 12s linear infinite;
        }

        .animate-particle {
          animation: particle 6s linear infinite;
        }

        .animate-float-text {
          animation: float-text 6s ease-in-out infinite;
        }

        .animate-lightning {
          animation: lightning 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default RegisterForm;