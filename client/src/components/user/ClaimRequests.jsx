import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../layout/navbar';
import { API_ENDPOINTS } from '../../utils/constants';

export default function ClaimRequests() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const hasOpenedFromUrl = useRef(false);

  useEffect(() => {
    loadClaims();
  }, []);

  // If page opened with ?openClaim=<id>, open that claim after loading
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openClaim = params.get('openClaim');
    if (!openClaim || hasOpenedFromUrl.current) return;

    // If claims already loaded, try to find it; otherwise loadClaims will handle after fetch
    if (!loading && claims.length > 0) {
      const found = claims.find(c => String(c._id) === String(openClaim));
      if (found) {
        setSelectedClaim(found);
        hasOpenedFromUrl.current = true;
        // Clean up URL
        navigate('/profile/claims', { replace: true });
      } else {
        // Fetch single claim as fallback
        (async () => {
          try {
            const res = await fetch(API_ENDPOINTS.CLAIM_BY_ID(openClaim));
            const json = await res.json();
            if (res.ok && json.data) {
              setSelectedClaim(json.data);
              hasOpenedFromUrl.current = true;
              // Clean up URL
              navigate('/profile/claims', { replace: true });
            }
          } catch (err) {
            console.warn('Failed to load claim by id', err);
          }
        })();
      }
    }
  }, [location.search, loading, claims, navigate]);

  const loadClaims = async () => {
    setLoading(true);
    setError('');

    try {
      const userStr = localStorage.getItem('user') || '{}';
      const user = JSON.parse(userStr);
      const currentUserId = user._id || user.id;
      if (!currentUserId) {
        setError('You must be logged in to view your claim requests');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_ENDPOINTS.CLAIMS}?claimantId=${currentUserId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load claims');

      setClaims(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error('Failed to load claims', err);
      setError(err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Claim Requests</h1>
              <p className="text-sm text-gray-600">All claim requests you submitted</p>
            </div>
            <div>
              <button
                onClick={loadClaims}
                className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading claim requests...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12 text-gray-600">You have not submitted any claim requests.</div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {claim.imageUrl ? (
                        <img
                          src={claim.imageUrl}
                          alt="claim"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setPreviewUrl(claim.imageUrl); }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{claim.itemId?.name || 'Unknown Item'}</h3>
                          <p className="text-sm text-gray-500">Submitted: {formatDate(claim.createdAt)}</p>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            claim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : claim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>{claim.status}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-700">
                        <p className="font-medium">Proof of ownership:</p>
                        <p className="whitespace-pre-wrap">{claim.proofOfOwnership || 'No proof provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview Modal */}
          {previewUrl && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
              <div className="max-w-4xl w-full">
                <img src={previewUrl} alt="preview" className="w-full h-[80vh] object-contain rounded-md mx-auto" />
              </div>
            </div>
          )}

          {/* Selected Claim Details Modal */}
          {selectedClaim && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedClaim.itemId?.name || 'Claim Details'}</h2>
                    <p className="text-sm text-gray-500">Submitted: {formatDate(selectedClaim.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedClaim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : selectedClaim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{selectedClaim.status}</span>

                    <button
                      onClick={() => setSelectedClaim(null)}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                      aria-label="Close details"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      {selectedClaim.imageUrl ? (
                        <img
                          src={selectedClaim.imageUrl}
                          alt="claim proof"
                          className="w-full h-56 object-cover rounded-md border border-gray-200 cursor-pointer"
                          onClick={() => setPreviewUrl(selectedClaim.imageUrl)}
                        />
                      ) : (
                        <div className="w-full h-56 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Item Information</h3>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.itemId?.description || 'No description'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Proof of Ownership</h3>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selectedClaim.proofOfOwnership || 'No proof provided'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Claimant</h3>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.claimantId?.name || 'N/A'} — {selectedClaim.claimantId?.email || ''}</p>
                      </div>

                      {selectedClaim.status === 'Approved' && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                          <h3 className="text-sm font-semibold text-green-800">How to claim your item</h3>
                          <ol className="list-decimal list-inside text-sm text-gray-800 mt-2 space-y-1">
                            <li>Bring a valid photo ID (student ID or government-issued ID).</li>
                            <li>Bring this notification (email or in-app) or a printed copy as proof.</li>
                            <li>Bring any additional proof of ownership you submitted (receipts, photos, etc.).</li>
                            <li>Go to the COT-SBO (Student Body Organization) to claim your item — they will verify and release it to you.</li>
                            <li>If you cannot visit in person, contact the SBO for alternate arrangements.</li>
                          </ol>
                          <p className="text-xs text-gray-600 mt-3">Note: The SBO may require you to sign a release form. If you have questions, contact support.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
