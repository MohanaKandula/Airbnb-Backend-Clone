import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, User, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
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
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'ROLE_GUEST',
    },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      setRegisteredEmail(data.email);
      setShowOtpScreen(true);
      setTimer(60);
      toast.info('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Signup failed. Please try a different email address.');
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
      navigate('/login');
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
              Back to Signup
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
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Create your Account</h2>
        <p className="text-xs text-gray-500 font-semibold">Join Airbnb Clone and unlock professional bookings.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Mohana Kandula"
              {...register('name', {
                required: 'Full name is required',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters',
                },
              })}
              className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand'
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>

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
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Choose Account Type</label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition ${
              watch('role') === 'ROLE_GUEST' ? 'border-brand bg-brand/5 ring-1 ring-brand/10' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                value="ROLE_GUEST"
                {...register('role')}
                className="sr-only"
              />
              <span className="font-extrabold text-sm text-gray-900">Traveler Guest</span>
              <span className="text-[10px] text-gray-500 mt-1">Book hotels, add guest info & view stays</span>
            </label>

            <label className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition ${
              watch('role') === 'ROLE_HOTEL_MANAGER' ? 'border-brand bg-brand/5 ring-1 ring-brand/10' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                value="ROLE_HOTEL_MANAGER"
                {...register('role')}
                className="sr-only"
              />
              <span className="font-extrabold text-sm text-gray-900">Hotel Manager</span>
              <span className="text-[10px] text-gray-500 mt-1">Register properties, add rooms & view reports</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-3.5 font-extrabold text-sm shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <hr className="border-gray-200" />

      {/* Redirect to login */}
      <div className="text-center text-sm text-gray-500">
        <span>Already have an account? </span>
        <Link to="/login" className="text-brand hover:underline font-bold">
          Log in
        </Link>
      </div>
    </div>
  );
};

export default Signup;
