import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, ShieldAlert, Sparkles, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const from = location.state?.from?.pathname || location.state?.from || '/';

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const loggedUser = await login(data.email, data.password);
      toast.success(`Welcome back, ${loggedUser.name || loggedUser.fullName || 'User'}!`);
      
      // Determine redirection based on role
      const userRoles = [loggedUser.role, ...(loggedUser.roles || [])].filter(Boolean);
      if (userRoles.includes('ROLE_HOTEL_MANAGER')) {
        navigate('/admin');
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (err) {
      if (err.message && err.message.includes("Email not verified")) {
        setRegisteredEmail(data.email);
        setShowOtpScreen(true);
        setTimer(60);
        // Automatically request a new OTP to be sent when they try to login
        try {
          await axiosInstance.post('/auth/resend-otp', { email: data.email });
          toast.info('Your email is not verified yet. We have sent a new verification code.');
        } catch (resendErr) {
          toast.info('Your email is not verified yet. Please check your email for the verification code.');
        }
      } else {
        toast.error(err.message || 'Login failed. Please verify credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await axiosInstance.post('/auth/verify', {
        email: registeredEmail,
        otp: otpCode,
      });
      toast.success('Email verified successfully! You can now log in.');
      setShowOtpScreen(false);
      setOtpCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await axiosInstance.post('/auth/resend-otp', {
        email: registeredEmail,
      });
      toast.success('Verification code resent successfully.');
      setTimer(60);
      setOtpCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  if (showOtpScreen) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Verify Your Email</h2>
          <p className="text-xs text-gray-500 font-semibold">
            We've sent a 6-digit OTP code to <strong className="text-gray-800">{registeredEmail}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">
              6-Digit OTP Code
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border rounded-xl py-3 px-3 text-center text-lg font-bold tracking-widest focus:outline-none border-gray-300 focus:border-brand"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-3.5 font-extrabold text-sm shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
          >
            {verifying ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center text-xs space-y-2">
          <button
            onClick={handleResendOtp}
            disabled={resending || timer > 0}
            className="text-brand hover:underline font-bold bg-transparent border-none p-0 cursor-pointer disabled:text-gray-400 disabled:no-underline"
          >
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP Code'}
          </button>
          <div className="block mt-2">
            <button
              onClick={() => setShowOtpScreen(false)}
              className="text-gray-500 hover:text-gray-700 font-semibold bg-transparent border-none p-0 cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
          <Globe className="w-6 h-6 animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Welcome to Airbnb Clone</h2>
        <p className="text-xs text-gray-500 font-semibold">Sign in to unlock reservations, payments, and hosting.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address shape',
                },
              })}
              className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className={`w-full border rounded-xl py-3 pl-11 pr-10 text-sm focus:outline-none ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-3.5 font-extrabold text-sm shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {submitting ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <hr className="border-gray-200" />

      {/* Redirect to signup */}
      <div className="text-center text-sm text-gray-500">
        <span>New to Airbnb? </span>
        <Link to="/signup" className="text-brand hover:underline font-bold">
          Create an account
        </Link>
      </div>

    </div>
  );
};

export default Login;
