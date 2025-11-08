import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';

function EnterCode({ onClose = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(location?.state?.devCode || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const email = location?.state?.email || '';

  const handleVerify = async () => {
    setError('');
    if (!email) return setError('Missing email context');
    if (!code) return setError('Enter the code you received');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        // proceed to reset password and pass email+code
        navigate('/reset', { state: { email, code } });
      } else {
        setError(data.error || 'Invalid code');
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
        <div className="text-xl font-extrabold mb-1">Code Sent!</div>
        <div className="text-lg mb-4 text-[#ffe0c5]">Enter code sent to your email address</div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-white text-[#430d08] rounded-md px-4 py-3 text-base mb-4"
          type="text"
          placeholder="e.g. 253342"
        />
        {error && <div className="text-red-200 mb-2 w-full">{error}</div>}
        <button
          type="button"
          onClick={handleVerify}
          className="w-full bg-[#fff3e2] text-[#7e2217] rounded-md py-3 font-bold mb-4 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Enter Code'}
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

EnterCode.propTypes = {
  onClose: PropTypes.func,
};

export default EnterCode;
