import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
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
    <div className="fixed inset-0 w-screen h-screen bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div
        className="text-white rounded-[2.1rem] shadow-[0_8px_30px_rgba(255,140,0,0.3)] w-[420px] flex flex-col items-center p-8"
        style={{
          background:
            'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        }}
      >
        <div className="text-4xl font-extrabold tracking-wide mb-1">iFind</div>
        <div className="text-xl font-extrabold mb-1">Forgot your Password?</div>
        <div className="text-lg mb-4 text-orange-100">Enter your Email Address</div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full bg-white text-gray-900 rounded-md px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="e.g. username@ifind.com"
        />

        {error && <div className="text-orange-100 bg-orange-900/30 rounded-md px-3 py-2 mb-2 w-full text-sm">{error}</div>}

        <button
          type="button"
          onClick={handleSend}
          className="w-full bg-white text-orange-600 rounded-md py-3 font-bold mb-4 hover:bg-orange-50 transition-colors disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Code'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="bg-transparent text-orange-100 hover:text-white font-semibold text-base self-start flex items-center gap-2 transition-colors"
        >
          <span className="mr-2">←</span> Back To Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;

