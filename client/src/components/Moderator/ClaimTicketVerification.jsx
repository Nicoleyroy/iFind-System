import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Users, FileText } from "lucide-react";
import Sidebar from "./ModSidebar";

const MetricCard = ({ label, value, Icon }) => (
  <div className="flex-1 bg-white rounded-xl shadow p-6 flex items-center justify-between transition hover:shadow-lg">
    <div>
      <p className="text-gray-600 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
    <span className="bg-rose-50 p-4 rounded-full">
      <Icon className="w-8 h-8 text-rose-600" />
    </span>
  </div>
);

const ClaimTicketVerification = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionModal, setActionModal] = useState({ show: false, approve: false });
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:4000/claimtickets")
      .then(res => {
        setTickets(res.data.data || []);
        computeMetrics(res.data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const computeMetrics = (data) => {
    setMetrics({
      total: data.length,
      pending: data.filter(t => t.status === "Pending").length,
      approved: data.filter(t => t.status === "Approved").length,
      rejected: data.filter(t => t.status === "Rejected").length,
    });
  };

  useEffect(() => {
    let filtered = tickets;
    if (statusFilter !== "All") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.claimantName.toLowerCase().includes(term) ||
        t.lostItemName.toLowerCase().includes(term)
      );
    }
    setFilteredTickets(filtered);
  }, [tickets, statusFilter, searchTerm]);

  const openConfirmModal = (approve) => {
    setActionModal({ show: true, approve });
  };

  const cancelConfirm = () => {
    setActionModal({ show: false, approve: false });
  };

  const handleClaimAction = (approve) => {
    if (!selectedTicket) return;
    const newStatus = approve ? "Approved" : "Rejected";
    axios
      .put(`http://localhost:4000/claimtickets/${selectedTicket._id}/status`, { status: newStatus })
      .then(() => {
        setTickets(prev =>
          prev.map(t =>
            t._id === selectedTicket._id ? { ...t, status: newStatus } : t
          )
        );
        setSelectedTicket(null);
        cancelConfirm();
      })
      .catch(console.error);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-900 font-inter">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto max-h-screen">
        {/* Metrics */}
        <div className="flex gap-6 mb-8">
          <MetricCard label="Total Claim Tickets" value={metrics.total} Icon={Users} />
          <MetricCard label="Pending Reviews" value={metrics.pending} Icon={FileText} />
          <MetricCard label="Approved Claims" value={metrics.approved} Icon={CheckCircle} />
          <MetricCard label="Rejected Claims" value={metrics.rejected} Icon={XCircle} />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <input
            type="search"
            placeholder="Search by claimant or item name..."
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-96 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* List and detail */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm p-4">
            {loading ? (
              <p className="text-center text-gray-500 mt-12">Loading tickets...</p>
            ) : filteredTickets.length === 0 ? (
              <p className="text-center text-gray-400 italic mt-12">No tickets found.</p>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket._id} className={`border-b border-gray-100 p-3 cursor-pointer ${selectedTicket?._id === ticket._id ? "bg-blue-50" : "hover:bg-blue-50"}`} onClick={() => setSelectedTicket(ticket)}>
                  <p className="font-semibold text-blue-700">{ticket.claimantName}</p>
                  <p>Claiming: <span className="font-medium">{ticket.lostItemName}</span></p>
                  <p>Status: <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ticket.status === "Pending" ? "bg-yellow-100 text-yellow-900" : ticket.status === "Approved" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>{ticket.status}</span></p>
                </div>
              ))
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm p-6 flex flex-col">
            {selectedTicket ? (
              <>
                <h2 className="font-bold text-2xl mb-4">{selectedTicket.claimantName}</h2>
                <p className="mb-2"><strong>Claiming Item:</strong> {selectedTicket.lostItemName}</p>
                {selectedTicket.evidenceText && (<p className="mb-4"><strong>Claimant Evidence:</strong> {selectedTicket.evidenceText}</p>)}
                {selectedTicket.evidenceImageUrl && (
                  <img src={selectedTicket.evidenceImageUrl} alt="Claimant Evidence" className="rounded-lg max-h-48 w-full object-contain mb-6" />
                )}
                <p><strong>Status:</strong> <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${selectedTicket.status === "Pending" ? "bg-yellow-100 text-yellow-900" : selectedTicket.status === "Approved" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>{selectedTicket.status}</span></p>
                <div className="mt-auto flex gap-4 pt-6">
                  <button disabled={selectedTicket.status === "Approved"} onClick={() => setActionModal({ show: true, approve: true })} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md transition">Approve</button>
                  <button disabled={selectedTicket.status === "Rejected"} onClick={() => setActionModal({ show: true, approve: false })} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold shadow-md transition">Reject</button>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 italic mt-20">Select a claim ticket to review details here.</p>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {actionModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl text-center">
              {actionModal.approve ? <CheckCircle className="mx-auto w-12 h-12 text-green-600 mb-3" /> : <XCircle className="mx-auto w-12 h-12 text-red-600 mb-3" />}
              <h3 className="text-xl font-bold mb-4">{actionModal.approve ? "Confirm Approval" : "Confirm Rejection"}</h3>
              <p className="mb-6 text-gray-700">Are you sure you want to {actionModal.approve ? "approve" : "reject"} this claim ticket? This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => handleClaimAction(actionModal.approve)} className={`px-6 py-2 rounded-lg font-bold transition text-white ${actionModal.approve ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                  Yes, Confirm
                </button>
                <button onClick={cancelConfirm} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

};

export default ClaimTicketVerification;
