"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** If you’re using TypeScript, define a props interface: */
interface OtpVerificationScreenProps {
  phoneNumber: string;
  countryCode: string;
  onVerify: (otpOrData: any) => void; // or a more specific type
  onResend: () => void;
  onBack: () => void;
  userData?: any;
  /** Add these two props to properly handle loading and error states */
  isLoading?: boolean;
  error?: string | null;
}

export default function OtpVerificationScreen({
  phoneNumber,
  countryCode,
  onVerify,
  onResend,
  onBack,
  userData,
  isLoading = false, // default to false so it's never undefined
  error = null,      // default to null so it's never undefined
}: OtpVerificationScreenProps) {
  const router = useRouter();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(22);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  /** Handle OTP character-by-character input */
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.split('').slice(0, 4);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 3);
      document.getElementById(`otp-input-${nextIndex}`)?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) {
        document.getElementById(`otp-input-${index + 1}`)?.focus();
      }
    }
  };

  /** Handle backspace navigation between OTP fields */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  /** Verify the entered OTP with your API */
  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setVerificationStatus('error');
      return;
    }

    try {
      console.log('Submitting OTP:', otpValue, 'for phone:', phoneNumber);
      
      const response = await fetch('https://micro.sobhagya.in/auth/api/signup-login/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: otpValue,
          notifyToken: 'notifyToken',
        }),
        credentials: 'include', // Include cookies in the request
      });

      // Debug
      console.log('OTP verification response status:', response.status);

      const data = await response.json();
      console.log('OTP verification response data:', data);

      // Check success
      if ((response.ok && data.token) || data.success === true) {
        setVerificationStatus('success');

        // Extract token from response
        const token = data.token || (data.data && data.data.id);
        if (!token) {
          console.warn('Login successful but no token found in response. Using fallback token handling.');
        }

        // Save user details in localStorage
        const userDetails = {
          phoneNumber,
          countryCode,
          ...userData, 
          authToken: token || 'authenticated', 
          userId: data.data && data.data.id,
          timestamp: new Date().getTime(),
        };
        localStorage.setItem('userDetails', JSON.stringify(userDetails));

        // Also set token in localStorage + cookie
        if (token) {
          localStorage.setItem('authToken', token);
          document.cookie = `authToken=${token}; path=/; max-age=2592000; SameSite=Strict`;
        }

        // Notify parent that verification succeeded
        onVerify({
          ...data,
          userDetails,
        });

        // Navigate if desired
        router.push('/astrologers');
      } else {
        console.error('OTP verification failed:', data);
        setVerificationStatus('error');
        if (data.message && data.success !== true) {
          alert(`Verification failed: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    }
  };

  /** Resend OTP via your API */
  const handleResend = async () => {
    setIsResending(true);
    try {
      console.log('Resending OTP for phone:', phoneNumber);

      const response = await fetch('https://micro.sobhagya.in/auth/api/signup-login/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Resend OTP response:', data);

      if (response.ok) {
        // Reset the local state for new OTP input
        setOtp(['', '', '', '']);
        setTimeLeft(22);
        setVerificationStatus(null);
        
        if (data && data.message) {
          alert(`OTP sent: ${data.message}`);
        }
        // Let parent know we resent
        onResend();
      } else {
        console.error('Error resending OTP:', data);
        if (data && data.message) {
          alert(`Failed to resend OTP: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Resend error:', error);
      alert('Network error when trying to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-[#F7971D] py-3 sm:py-4 text-center">
          <h1 
            className="text-white text-xl sm:text-2xl md:text-3xl font-medium"
            style={{ fontFamily: 'Poppins', letterSpacing: '1%' }}
          >
            Verify Phone
          </h1>
        </div>
        
        {/* Content */}
        <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <p
            className="text-center text-[#373737] mb-6 sm:mb-8 md:mb-10 font-normal text-base sm:text-lg md:text-xl"
            style={{ fontFamily: 'Poppins' }}
          >
            You&apos;ll receive a 4-digit code to verify your identity
          </p>
          
          <div className="text-center mb-6 sm:mb-8">
            <p 
              className="text-[#373737] font-medium text-base sm:text-lg md:text-xl"
              style={{ fontFamily: 'Poppins' }}
            >
              OTP sent to {countryCode} {phoneNumber}
            </p>
          </div>
          
          {/* OTP Input Fields */}
          <div className="flex justify-center space-x-2 sm:space-x-3 md:space-x-4 mb-6 sm:mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-center text-lg sm:text-xl md:text-2xl bg-[#F2F2F2] border border-gray-300 rounded-md focus:outline-[#F7971D] focus:border-[#F7971D]"
                style={{ fontFamily: 'Poppins' }}
              />
            ))}
          </div>
          
          {/* Timer and Resend */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-y-3">
            <div className="text-gray-600 text-sm sm:text-base">
              {timeLeft > 0 ? (
                <span>Send OTP in {timeLeft}s</span>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 0 || isResending}
              className={`text-[#F7971D] font-medium text-sm sm:text-base ${
                (timeLeft > 0 || isResending) ? 'opacity-50 cursor-not-allowed' : 'hover:text-orange-600'
              }`}
            >
              Resend OTP
            </button>
          </div>
          
          {/* Show parent's error if we want */}
          {error && (
            <div className="text-red-500 text-center mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}
          
          {/* Local verification error */}
          {verificationStatus === 'error' && (
            <div className="text-red-500 text-center mb-4 text-sm sm:text-base">
              Invalid OTP. Please check the code and try again or request a new OTP.
            </div>
          )}

          {/* If you want to disable the "Login" button when isLoading is true or no OTP */}
          <button
            onClick={handleVerify}
            className="w-full flex justify-center mx-auto bg-[#F7971D] text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-md hover:bg-orange-500 transition-colors font-medium text-sm sm:text-base"
            disabled={otp.some((digit) => !digit) || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>
          
          {/* Back Button */}
          <button
            onClick={onBack}
            className="mt-3 sm:mt-4 w-full flex justify-center mx-auto bg-transparent text-gray-600 py-2 px-6 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            Back
          </button>
          
          {/* Footer Text */}
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6">
            You agree to our 
            <a href="/privacy-policy" className="text-orange-400 hover:underline ml-1">Privacy Policy</a>
            <span className="mx-1">&</span>
            <a href="/terms" className="text-orange-400 hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
