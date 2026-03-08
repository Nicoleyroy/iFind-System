import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { success as swalSuccess } from '../../utils/swal';

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
        // Show success confirmation
        await swalSuccess(
          'Password Reset Successful!',
          'Your password has been changed successfully. You can now login with your new password.'
        );
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
    <div className="fixed inset-0 w-screen h-screen bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div
        className="text-white rounded-[2.1rem] shadow-[0_8px_30px_rgba(255,140,0,0.3)] w-[420px] flex flex-col items-center p-8"
        style={{
          background:
            'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        }}
      >
        <div className="text-4xl font-extrabold tracking-wide mb-3">iFind</div>
        <div className="text-lg mb-4 text-orange-100">Enter and confirm your new password</div>

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white text-gray-900 rounded-md px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
          type="password"
          placeholder="New password"
        />
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-white text-gray-900 rounded-md px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
          type="password"
          placeholder="Confirm password"
        />

        {error && <div className="text-orange-100 bg-orange-900/30 rounded-md px-3 py-2 mb-2 w-full text-sm">{error}</div>}

        <button
          type="button"
          onClick={handleReset}
          className="w-full bg-white text-orange-600 rounded-md py-3 font-bold mb-2 hover:bg-orange-50 transition-colors disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;

