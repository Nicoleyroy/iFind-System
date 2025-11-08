import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

function ForgotPassword({ onClose = () => {} }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    setError('');
    if (!email) return setError('Please enter your email');
    setLoading(true);
    try {
      const res = await fetch('/api/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        // if backend returned a devCode (no SMTP configured), pass it along so EnterCode can prefill
        const devCode = data?.devCode;
        // navigate to verify and pass email (and devCode when present)
        const state = devCode ? { email, devCode } : { email };
        navigate('/verify', { state });
      } else {
        setError(data.error || 'Unable to send code');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[rgba(50,20,20,0.14)] backdrop-blur-md flex items-center justify-center z-50">
      <div
        className="text-white rounded-[2.1rem] shadow-[0_8px_30px_rgba(60,0,0,0.18)] w-[420px] flex flex-col items-center p-8"
        style={{
          background:
            'radial-gradient(120% 140% at 0% 0%, #b21a10 0%, #5b0905 100%)',
        }}
      >
        <div className="text-4xl font-extrabold tracking-wide mb-1">iFind</div>
        <div className="text-xl font-extrabold mb-1">Forgot your Password?</div>
        <div className="text-lg mb-4 text-[#ffe0c5]">Enter your Email Address</div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full bg-white text-[#430d08] rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g. username@ifind.com"
        />

        {error && <div className="text-red-200 mb-2 w-full">{error}</div>}

        <button
          type="button"
          onClick={handleSend}
          className="w-full bg-[#fff3e2] text-[#7e2217] rounded-md py-3 font-bold mb-4 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Code'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="bg-transparent text-[#ffe0c5] font-semibold text-base self-start flex items-center gap-2"
        >
          <span className="mr-2">←</span> Back To Login
        </button>
      </div>
    </div>
  );
}

ForgotPassword.propTypes = {
  onClose: PropTypes.func,
};

export default ForgotPassword;
