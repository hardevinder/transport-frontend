import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

const StudentPayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentInfo = localStorage.getItem('studentInfo');
  const student = studentInfo ? JSON.parse(studentInfo) : null;

  useEffect(() => {
    if (!student || !student.id || !student.name || !student.phone) {
      console.error('❌ Invalid student data:', student);
      navigate('/student/login');
      return;
    }

    const startPayment = async () => {
      const displayAmount = parseFloat(searchParams.get('amount') || '0'); // in ₹
      const amountInPaise = displayAmount * 100;

      const slab = searchParams.get('slab') || '';
      const feeStructureId = searchParams.get('feeStructureId') || '';

     if (!displayAmount || !slab || !feeStructureId) {
          console.error('❌ Missing required parameters:', { displayAmount, slab, feeStructureId });

        alert('Invalid payment details. Please try again.');
        navigate('/student/dashboard');
        return;
      }

      try {
        const res = await axios.post('/payments/create-order', {
          studentId: student.id,
          amount: amountInPaise,
          slab,
          feeStructureId,
        });


        const data = res.data as RazorpayOrderResponse;

        if (!data?.id || !data?.amount || !data?.currency) {
          console.error('❌ Invalid Razorpay response:', data);
          alert('Failed to initialize payment. Please try again.');
          navigate('/student/dashboard');
          return;
        }

        const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;

        if (!razorpayKey) {
          alert('⚠️ Razorpay key not configured. Please contact admin.');
          console.error('❌ Razorpay key missing in .env');
          return;
        }

        const options = {
          key: razorpayKey,
          amount: data.amount,
          currency: data.currency,
          name: 'Transport Fee Payment',
          description: `Payment for ${slab}`,
          order_id: data.id,
          prefill: {
            name: student.name,
            contact: student.phone,
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await axios.post('/payments/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                studentId: student.id,
                amount: displayAmount, // send rupees, not paise
                slab,
                feeStructureId,
              });

              console.log('✅ Payment verified:', verifyRes.data);
              alert('✅ Payment successful!');
              navigate('/student/dashboard');
            } catch (err: any) {
              console.error('❌ Payment verification failed:', err.response?.data || err.message);
              alert('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: () => {
              console.warn('❌ Payment modal closed by user');
              alert('Payment was cancelled.');
              navigate('/student/dashboard');
            },
          },
          theme: {
            color: '#0d9488',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        console.error('❌ Payment initiation failed:', err.response?.data || err.message);
        alert('Payment failed. Please try again.');
        navigate('/student/dashboard');
      }
    };

    const loadRazorpayScript = () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        console.log('ℹ️ Razorpay script already loaded');
        startPayment();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Razorpay script loaded');
        startPayment();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        alert('Failed to load payment gateway. Please refresh and try again.');
        navigate('/student/dashboard');
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, [navigate, searchParams, student]);

  return (
    <div className="text-center mt-20 text-gray-700">
      Please wait... Redirecting to payment...
    </div>
  );
};

export default StudentPayPage;
