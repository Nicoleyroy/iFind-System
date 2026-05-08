import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../layout/navbar';
import { API_ENDPOINTS } from '../../utils/constants';
import Swal from 'sweetalert2';

export default function ClaimRequests() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [matchDetailsModal, setMatchDetailsModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [matchStrengthFilter, setMatchStrengthFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleCancelClaim = async (claimId, claimName) => {
    const result = await Swal.fire({
      title: 'Cancel Claim?',
      text: `Are you sure you want to cancel your claim for "${claimName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel Claim',
      cancelButtonText: 'Keep Claim',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_ENDPOINTS.CLAIMS}/${claimId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message || 'Failed to cancel claim');
        }

        await Swal.fire({
          title: 'Claim Cancelled',
          text: 'Your claim has been successfully cancelled.',
          icon: 'success',
          confirmButtonColor: '#f97316',
        });

        // Remove from local state
        setClaims(claims.filter(c => c._id !== claimId));
        setSelectedClaim(null);
      } catch (err) {
        await Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to cancel claim',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  // Calculate match score between item and claim
  const calculateMatchScore = (item, claim) => {
    if (!claim || !claim.itemId) return { score: 0, details: [] };
    
    // If no item provided, use claim.itemId as the found item
    const foundItem = item || claim.itemId;
    
    let score = 0;
    let maxScore = 0;
    const matchDetails = [];

    // Category match (20 points)
    maxScore += 20;
    if (foundItem.category) {
      score += 20;
      matchDetails.push({ label: 'Category matched', status: 'match' });
    } else {
      matchDetails.push({ label: 'Category', status: 'no-match' });
    }

    // Description similarity (30 points)
    maxScore += 30;
    const foundDesc = (foundItem.description || '').toLowerCase();
    const claimDesc = (claim.proofOfOwnership || '').toLowerCase();
    const descWords = foundDesc.split(' ').filter(w => w.length > 3);
    const matchedWords = descWords.filter(w => claimDesc.includes(w));
    const descSimilarity = descWords.length > 0 ? (matchedWords.length / descWords.length) : 0;
    
    if (descSimilarity > 0.5) {
      score += 30;
      matchDetails.push({ label: 'Description matches', status: 'match' });
    } else if (descSimilarity > 0.2) {
      score += 15;
      matchDetails.push({ label: 'Partial description match', status: 'weak-match' });
    } else {
      matchDetails.push({ label: 'Description details', status: 'no-match' });
    }

    // Location match (20 points)
    maxScore += 20;
    if (foundItem.location) {
      const itemLoc = foundItem.location.toLowerCase();
      const claimLoc = foundItem.location?.toLowerCase() || '';
      if (itemLoc === claimLoc) {
        score += 20;
        matchDetails.push({ label: 'Location matches', status: 'match' });
      } else if (itemLoc.split(' ').some(word => claimLoc.includes(word))) {
        score += 10;
        matchDetails.push({ label: 'Location partially matches', status: 'weak-match' });
      } else {
        matchDetails.push({ label: 'Location verified', status: 'match' });
      }
    }

    // Date proximity (15 points)
    maxScore += 15;
    if (foundItem.dateFound && claim.createdAt) {
      const foundDate = new Date(foundItem.dateFound);
      const claimDate = new Date(claim.createdAt);
      const daysDiff = Math.abs((foundDate - claimDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        score += 15;
        matchDetails.push({ label: 'Claimed within 7 days of finding', status: 'match' });
      } else if (daysDiff <= 30) {
        score += 7;
        matchDetails.push({ label: 'Claimed within 30 days', status: 'weak-match' });
      } else {
        matchDetails.push({ label: 'Claimed after 30+ days', status: 'no-match' });
      }
    }

    // Proof image provided (15 points)
    maxScore += 15;
    if (claim.imageUrl) {
      score += 15;
      matchDetails.push({ label: 'Proof image provided', status: 'match' });
    } else {
      matchDetails.push({ label: 'No proof image', status: 'weak-match' });
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return { score: percentage, details: matchDetails };
  };

  // Determine match strength label
  const getMatchStrength = (score) => {
    if (score >= 80) return 'Strong';
    if (score >= 50) return 'Possible';
    return 'Weak';
  };

  // Get match badge color
  const getMatchBadgeClass = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Needs Proof': return 'bg-blue-100 text-blue-800';
      case 'Matched': return 'bg-purple-100 text-purple-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return '⏱️';
      case 'Needs Proof': return '📤';
      case 'Matched': return '✨';
      case 'Approved': return '✅';
      case 'Rejected': return '❌';
      default: return '❓';
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #fff7ed, #fef2f2, #fffbeb)' }}>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header with Back Button */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#134252] hover:bg-white/50 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#134252]">My Claim Requests</h1>
              <p className="text-gray-600 mt-1">Track your claims and monitor match status</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by item</label>
                <input
                  type="text"
                  placeholder="Item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Needs Proof">Needs Proof</option>
                  <option value="Matched">Matched</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Match Strength</label>
                <select
                  value={matchStrengthFilter}
                  onChange={(e) => setMatchStrengthFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Matches</option>
                  <option value="Strong">Strong Match</option>
                  <option value="Possible">Possible Match</option>
                  <option value="Weak">Weak Match</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadClaims}
                  className="w-full px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-3">Loading claim requests...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium">No claim requests yet</p>
              <p className="text-gray-500 text-sm mt-1">Start by browsing found items and submitting a claim request</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims
                .filter(claim => {
                  const matchScore = calculateMatchScore(null, claim).score;
                  const matchStrength = getMatchStrength(matchScore);
                  
                  const itemName = (claim.itemId?.name || '').toLowerCase();
                  const searchLower = searchTerm.toLowerCase();
                  
                  return (
                    (statusFilter === 'all' || claim.status === statusFilter) &&
                    (matchStrengthFilter === 'all' || matchStrength === matchStrengthFilter) &&
                    (searchTerm === '' || itemName.includes(searchLower))
                  );
                })
                .map((claim) => {
                  const matchData = calculateMatchScore(null, claim);
                  const matchStrength = getMatchStrength(matchData.score);

                  return (
                    <div
                      key={claim._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all overflow-hidden cursor-pointer"
                      onClick={() => setSelectedClaim(claim)}
                    >
                      <div className="p-4 sm:p-6">
                        {/* Top row: Item info + status badges */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div className="flex gap-4 flex-1">
                            {/* Item image */}
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {claim.itemId?.images && claim.itemId.images.length > 0 ? (
                                <img
                                  src={claim.itemId.images[0]}
                                  alt={claim.itemId.name}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewUrl(claim.itemId.images[0]);
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Item details */}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-[#134252]">{claim.itemId?.name || 'Unknown Item'}</h3>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {claim.itemId?.category && <span>{claim.itemId.category} • </span>}
                                Claimed {new Date(claim.createdAt).toLocaleDateString()}
                              </p>
                              {claim.itemId?.location && (
                                <p className="text-sm text-gray-500 mt-1">📍 Found at: {claim.itemId.location}</p>
                              )}
                            </div>
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-col gap-2 sm:items-end">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(claim.status)} whitespace-nowrap`}>
                              {claim.status}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getMatchBadgeClass(matchData.score)} whitespace-nowrap`}>
                              {matchData.score}% - {matchStrength} Match
                            </span>
                          </div>
                        </div>

                        {/* Match highlights */}
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-4 border border-orange-100">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Match Summary</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {matchData.details.slice(0, 3).map((detail, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-xs">
                                {detail.status === 'match' ? (
                                  <span className="text-green-600">✔</span>
                                ) : detail.status === 'weak-match' ? (
                                  <span className="text-yellow-600">⚠</span>
                                ) : (
                                  <span className="text-gray-400">✖</span>
                                )}
                                <span className={detail.status === 'match' ? 'text-green-700' : detail.status === 'weak-match' ? 'text-yellow-700' : 'text-gray-600'}>
                                  {detail.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMatchDetailsModal(claim);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border-2 border-blue-500 text-blue-700 font-medium hover:bg-blue-50 transition-colors text-sm"
                          >
                            View Match Details
                          </button>
                          
                          {claim.status === 'Needs Proof' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClaim(claim);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
                            >
                              Upload Proof
                            </button>
                          )}

                          {claim.status === 'Pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelClaim(claim._id, claim.itemId?.name || 'Unknown Item');
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border-2 border-red-500 text-red-700 font-medium hover:bg-red-50 transition-colors text-sm"
                            >
                              Cancel Claim
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {previewUrl && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div className="max-w-4xl w-full">
              <img
                src={previewUrl}
                alt="preview"
                className="w-full h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Match Details Modal */}
        {matchDetailsModal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setMatchDetailsModal(null)}
          >
            <div
              className="bg-white rounded-xl max-w-2xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#134252]">Match Details</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Item: <strong>{matchDetailsModal.itemId?.name}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setMatchDetailsModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const matchData = calculateMatchScore(null, matchDetailsModal);
                  return (
                    <>
                      {/* Overall Score */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-green-600">{matchData.score}%</div>
                          <p className="text-lg font-semibold text-green-700 mt-2">
                            {getMatchStrength(matchData.score)} Match
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            {matchData.score >= 80
                              ? 'Strong match - High confidence this item belongs to you'
                              : matchData.score >= 50
                              ? 'Possible match - Some details align'
                              : 'Weak match - Limited matching details'}
                          </p>
                        </div>
                      </div>

                      {/* Match Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Breakdown</h3>
                        <div className="space-y-3">
                          {matchData.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {detail.status === 'match' ? (
                                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                ) : detail.status === 'weak-match' ? (
                                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <span className="text-yellow-600 font-bold text-sm">!</span>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400 font-bold text-sm">✕</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${
                                  detail.status === 'match' ? 'text-green-700' : 
                                  detail.status === 'weak-match' ? 'text-yellow-700' : 
                                  'text-gray-600'
                                }`}>
                                  {detail.label}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">What's Next?</h3>
                        {matchDetailsModal.status === 'Pending' && (
                          <p className="text-sm text-blue-800">
                            Your claim is pending review. A moderator will verify your proof and compare it with the found item details.
                          </p>
                        )}
                        {matchDetailsModal.status === 'Needs Proof' && (
                          <p className="text-sm text-blue-800">
                            Please upload a photo or document to verify your ownership, such as a receipt, serial number, or unique marking.
                          </p>
                        )}
                        {matchDetailsModal.status === 'Matched' && (
                          <p className="text-sm text-blue-800">
                            ✨ Excellent! This item strongly matches your claim. A moderator will review and approve soon.
                          </p>
                        )}
                        {matchDetailsModal.status === 'Approved' && (
                          <p className="text-sm text-blue-800">
                            🎉 Your claim has been approved! Visit the SBO with your ID and proof to claim your item.
                          </p>
                        )}
                        {matchDetailsModal.status === 'Rejected' && (
                          <p className="text-sm text-blue-800">
                            This claim was not approved. Contact support if you have questions.
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Claim Details Modal */}
        {selectedClaim && !matchDetailsModal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedClaim(null)}
          >
            <div
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-start justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="text-2xl font-bold text-[#134252]">{selectedClaim.itemId?.name || 'Claim Details'}</h2>
                  <p className="text-sm text-gray-600 mt-1">Submitted: {formatDate(selectedClaim.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      getStatusBadgeClass(selectedClaim.status)
                    }`}>{selectedClaim.status}</span>                  <button
                    onClick={() => setSelectedClaim(null)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Item and Proof Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Item Image */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Item Found</h3>
                    {selectedClaim.itemId?.images && selectedClaim.itemId.images.length > 0 ? (
                      <img
                        src={selectedClaim.itemId.images[0]}
                        alt="found item"
                        className="w-full h-56 object-cover rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => setPreviewUrl(selectedClaim.itemId.images[0])}
                      />
                    ) : (
                      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Proof Image */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Proof</h3>
                    {selectedClaim.imageUrl ? (
                      <img
                        src={selectedClaim.imageUrl}
                        alt="proof"
                        className="w-full h-56 object-cover rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => setPreviewUrl(selectedClaim.imageUrl)}
                      />
                    ) : (
                      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        No Proof Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Description */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Item Description</h3>
                  <p className="text-sm text-gray-700">{selectedClaim.itemId?.description || 'No description'}</p>
                </div>

                {/* Proof of Ownership */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Proof of Ownership</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedClaim.proofOfOwnership || 'No proof provided'}</p>
                </div>

                {/* Claimant Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Information</h3>
                  <p className="text-sm text-gray-700">
                    <strong>{selectedClaim.claimantId?.name || 'N/A'}</strong> — {selectedClaim.claimantId?.email || ''}
                  </p>
                </div>

                {/* Approved Instructions */}
                {selectedClaim.status === 'Approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Your Claim Approved!</h3>
                    <h4 className="text-sm font-semibold text-green-800 mb-2">How to Claim Your Item</h4>
                    <ol className="list-decimal list-inside text-sm text-gray-800 space-y-2">
                      <li>Bring a valid photo ID (student ID or government-issued ID).</li>
                      <li>Bring this notification or a printed copy as proof.</li>
                      <li>Bring any additional proof of ownership you submitted.</li>
                      <li>Visit the COT-SBO (Student Body Organization) to claim your item.</li>
                      <li>They will verify and release it to you.</li>
                    </ol>
                    <p className="text-xs text-gray-600 mt-4">
                      💡 Note: The SBO may require you to sign a release form. Contact support if you have questions.
                    </p>
                  </div>
                )}

                {/* Rejected Reason */}
                {selectedClaim.status === 'Rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">❌ Claim Not Approved</h3>
                    <p className="text-sm text-red-700">
                      This claim could not be approved at this time. Contact support for more information or submit a new claim with additional proof.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
