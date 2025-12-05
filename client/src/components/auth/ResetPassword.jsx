import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location?.state?.email || '';
  const code = location?.state?.code || '';

  const handleReset = async () => {
    setError('');
    if (!password || !confirm) return setError('Please enter and confirm your new password');
    if (password !== confirm) return setError('Passwords do not match');
    if (!email || !code) return setError('Missing reset context');
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        // navigate to login
        navigate('/login', { state: { fromReset: true } });
      } else {
        setError(data.error || 'Unable to reset password');
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
        <div className="text-4xl font-extrabold tracking-wide mb-3">iFind</div>
        <div className="text-lg mb-4 text-[#ffe0c5]">Enter and confirm your new password</div>

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white text-[#430d08] rounded-md px-4 py-3 text-base mb-4"
          type="password"
          placeholder="New password"
        />
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-white text-[#430d08] rounded-md px-4 py-3 text-base mb-4"
          type="password"
          placeholder="Confirm password"
        />

        {error && <div className="text-red-200 mb-2 w-full">{error}</div>}

        <button
          type="button"
          onClick={handleReset}
          className="w-full bg-[#fff3e2] text-[#7e2217] rounded-md py-3 font-bold mb-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;

