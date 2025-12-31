"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Eye, EyeOff, User, Mail, CheckCircle, ChevronLeft } from 'lucide-react';
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

// Memoized form input components to prevent re-renders
const FormInput = memo(({ 
  icon: Icon, 
  type, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required,
  disabled,
  className = ""
}: any) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
    />
  </div>
));

FormInput.displayName = 'FormInput';

const PasswordInput = memo(({ 
  showPassword, 
  togglePassword, 
  value, 
  onChange, 
  placeholder,
  name,
  disabled
}: any) => (
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      disabled={disabled}
      minLength={8}
      className="w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <button
      type="button"
      onClick={togglePassword}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  </div>
));

PasswordInput.displayName = 'PasswordInput';

const EmailExistsPopup = memo(({ isOpen, onClose, onLogin }: any) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-6 w-80 text-center shadow-xl animate-scale-in">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Already Registered
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          This email is already registered. Please login to continue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onLogin}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
});

EmailExistsPopup.displayName = 'EmailExistsPopup';

const AnimatedMessage = memo(({ messages }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [messages.length]);
  
  return (
    <div
      key={currentIndex}
      className="transition-all duration-700 ease-in-out opacity-100"
    >
      <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
        {messages[currentIndex].title}
        <br />
        <span className="font-normal text-2xl">
          {messages[currentIndex].subtitle}
        </span>
      </h1>
    </div>
  );
});

AnimatedMessage.displayName = 'AnimatedMessage';

const OrganizerSignup = () => {
  const messages = useMemo(() => [
    { title: "Enhance", subtitle: "visibility, credibility, & connect with new audiences" },
    { title: "Boost", subtitle: "your event outreach with multi-channel promotions" },
    { title: "Grow", subtitle: "your audience and build genuine trust" },
  ], []);

  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState({
    showPassword: false,
    showConfirmPassword: false,
    showOtpSection: false,
    showPasswordFields: false,
    showEmailExistsPopup: false,
    isSubmitting: false,
  });
  
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    designation: '',
    companyName: '',
    city: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const router = useRouter();

  // Optimized handlers
  const updateFormState = useCallback((updates: any) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  }, []);

  const handleInitialSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    updateFormState({ isSubmitting: true });

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (res.status === 409 && data.alreadyRegistered) {
        updateFormState({ showEmailExistsPopup: true });
        return;
      }

      if (res.ok) {
        updateFormState({ showOtpSection: true });
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending OTP");
    } finally {
      updateFormState({ isSubmitting: false });
    }
  }, [formData.email, updateFormState]);

  const handleOtpVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }
    
    updateFormState({ isSubmitting: true });

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      if (res.ok) {
        updateFormState({ showOtpSection: false });
        setCurrentStep(2);
      } else {
        const data = await res.json();
        alert(data.message || "OTP verification failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying OTP");
    } finally {
      updateFormState({ isSubmitting: false });
    }
  }, [formData.email, otp, updateFormState]);

  const handleResendOtp = useCallback(async () => {
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (res.ok) {
        alert("OTP resent successfully!");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error resending OTP");
    }
  }, [formData.email]);

  const handleStep2Submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, designation, companyName, city } = formData;
    
    if (!fullName || !designation || !companyName || !city) {
      alert("Please fill in all fields");
      return;
    }
    
    updateFormState({ showPasswordFields: true });
  }, [formData, updateFormState]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const { password, confirmPassword } = formData;
    
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    updateFormState({ isSubmitting: true });

    try {
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        companyName: formData.companyName,
        designation: formData.designation,
        userType: "organiser",
        city: formData.city,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();

      if (res.ok) {
        const loginRes = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (!loginRes?.error) {
          if (data.user?.role === "ORGANIZER") {
            router.push(`/organizer-dashboard/${data.user.id}`);
          } else {
            router.push(`/dashboard/${data.user.id}`);
          }
        } else {
          alert("Account created, but auto-login failed. Please log in manually.");
          router.push("/login");
        }
      } else {
        alert(data.error || data.details || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("An error occurred during registration. Please try again.");
    } finally {
      updateFormState({ isSubmitting: false });
    }
  }, [formData, router, updateFormState]);

  // Memoized UI sections
  const renderStep1 = useMemo(() => {
    if (currentStep !== 1) return null;
    
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-blue-100">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-black/40"></div>
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/organizer-signup/BG_ORG_DSH.jpg')" }}
          ></div>
        </div>

        <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 w-full">
          <div className="flex-1 text-blue-900 pr-12 max-w-lg">
            <AnimatedMessage messages={messages} />
            
            <p className="text-base mb-8 leading-relaxed text-white">
              Showcase your event to an engaged audience and build genuine trust using targeted, multi-channel outreach.
              Reach potential attendees through platforms they prefer—social media, mobile updates, our dynamic website,
              curated newsletters, and direct database access. Present your event as a credible industry opportunity.
            </p>

            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-900 transition-colors">
              LEARN MORE
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              {formState.showOtpSection ? 'Verify Your Email' : "Let's get started"}
            </h2>

            {!formState.showOtpSection ? (
              <form onSubmit={handleInitialSubmit} className="space-y-5">
                <FormInput
                  icon={User}
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
                
                <FormInput
                  icon={Mail}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your business email"
                  required
                />

                <button
                  type="submit"
                  disabled={formState.isSubmitting}
                  className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState.isSubmitting ? 'PROCESSING...' : 'PROCEED'}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <button
                  onClick={() => updateFormState({ showOtpSection: false })}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to form
                </button>

                <div className="bg-green-500 text-white p-3 rounded-lg mb-4">
                  <p className="text-sm">
                    We have sent an OTP to <strong>{formData.email}</strong>.
                    Please check your inbox and enter it below to verify.
                  </p>
                </div>

                <form onSubmit={handleOtpVerify} className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Enter 6-digit OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={handleOtpChange}
                      maxLength={6}
                      placeholder="123456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest text-center text-lg font-semibold"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => updateFormState({ showOtpSection: false })}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formState.isSubmitting}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formState.isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <button
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            <p className="text-gray-500 text-sm mt-6 text-center">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:underline font-semibold transition-colors">
                Sign in here
              </a>
            </p>
          </div>
        </div>
        
        <EmailExistsPopup
          isOpen={formState.showEmailExistsPopup}
          onClose={() => updateFormState({ showEmailExistsPopup: false })}
          onLogin={() => router.push("/login")}
        />
      </div>
    );
  }, [currentStep, formState, formData, otp, messages, handleInitialSubmit, handleOtpVerify, handleResendOtp, router, updateFormState, handleInputChange]);

  const renderStep2 = useMemo(() => {
    if (currentStep !== 2) return null;
    
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Email</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{formData.email}</span>
                <span className="px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  email verified
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`transition-opacity duration-300 ${formState.showPasswordFields ? 'opacity-50' : 'opacity-100'}`}>
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Full Name
                    </label>
                    <FormInput
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                      disabled={formState.showPasswordFields}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Designation
                    </label>
                    <FormInput
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="Event Manager"
                      required
                      disabled={formState.showPasswordFields}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Company Name
                  </label>
                  <FormInput
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Event Solutions Inc"
                    required
                    disabled={formState.showPasswordFields}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">City</label>
                  <FormInput
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York, United States"
                    required
                    disabled={formState.showPasswordFields}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Phone (Optional)</label>
                  <FormInput
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                    disabled={formState.showPasswordFields}
                  />
                </div>

                {!formState.showPasswordFields && (
                  <button
                    type="submit"
                    className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Continue to Password Setup
                  </button>
                )}
              </form>
            </div>

            {formState.showPasswordFields && (
              <div className="pt-6 border-t border-gray-200">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Password</label>
                    <PasswordInput
                      showPassword={formState.showPassword}
                      togglePassword={() => updateFormState({ showPassword: !formState.showPassword })}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password (min 8 characters)"
                      name="password"
                      disabled={formState.isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Confirm Password</label>
                    <PasswordInput
                      showPassword={formState.showConfirmPassword}
                      togglePassword={() => updateFormState({ showConfirmPassword: !formState.showConfirmPassword })}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your password again"
                      name="confirmPassword"
                      disabled={formState.isSubmitting}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => updateFormState({ showPasswordFields: false })}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back to Details
                    </button>
                    <button
                      type="submit"
                      disabled={formState.isSubmitting}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formState.isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [currentStep, formState, formData, handleStep2Submit, handlePasswordSubmit, updateFormState, handleInputChange]);

  return (
    <>
      {renderStep1}
      {renderStep2}
    </>
  );
};

export default OrganizerSignup;