import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  MailOpen,
  Archive,
  CheckCircle,
  Filter,
  Search,
  MessageSquare,
  Package,
  User,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import ModSidebar from '../layout/ModSidebar';
import { API_ENDPOINTS } from '../../utils/constants';

const Messages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.status !== 'all') params.append('status', filter.status);
      
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  // Update message status
  const updateMessageStatus = async (messageId, status, notes = '') => {
    try {
      setUpdating(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(API_ENDPOINTS.MESSAGE_BY_ID(messageId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          notes,
          userId: currentUser._id || currentUser.id 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchMessages();
        if (selectedMessage && selectedMessage._id === messageId) {
          setSelectedMessage({ ...selectedMessage, status, notes });
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
    } finally {
      setUpdating(false);
    }
  };

  // View message details
  const viewMessageDetails = async (message) => {
    setSelectedMessage(message);
    
    // Mark as read if unread
    if (message.status === 'unread') {
      await updateMessageStatus(message._id, 'read');
    }
  };

  // Filter messages based on search
  const filteredMessages = messages.filter(msg => {
    const searchLower = searchTerm.toLowerCase();
    return (
      msg.senderName.toLowerCase().includes(searchLower) ||
      msg.senderEmail.toLowerCase().includes(searchLower) ||
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.message.toLowerCase().includes(searchLower)
    );
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      unread: 'bg-blue-100 text-blue-700',
      read: 'bg-gray-100 text-gray-700',
      replied: 'bg-green-100 text-green-700',
      archived: 'bg-orange-100 text-orange-700',
    };
    return badges[status] || badges.read;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread': return <Mail className="w-4 h-4" />;
      case 'read': return <MailOpen className="w-4 h-4" />;
      case 'replied': return <CheckCircle className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    contactUs: messages.filter(m => m.type === 'contact_us').length,
    itemContact: messages.filter(m => m.type === 'item_contact').length,
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <ModSidebar />

      <div className="flex-1 ml-64">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-8 py-12">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-white/90 text-base mt-1">View and manage all contact messages</p>
          </div>
        </div>

        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contact Us</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.contactUs}</p>
                </div>
                <User className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Item Messages</p>
                  <p className="text-2xl font-bold text-green-600">{stats.itemContact}</p>
                </div>
                <Package className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, subject, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter({ ...filter, type: 'all' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter.type === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter({ ...filter, type: 'contact_us' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter.type === 'contact_us'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Contact Us
                </button>
                <button
                  onClick={() => setFilter({ ...filter, type: 'item_contact' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter.type === 'item_contact'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Item Messages
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Messages List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((message) => (
                  <div
                    key={message._id}
                    onClick={() => viewMessageDetails(message)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      message.status === 'unread' ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(message.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-gray-900 ${message.status === 'unread' ? 'font-bold' : ''}`}>
                              {message.senderName}
                            </h3>
                            <p className="text-sm text-gray-500">{message.senderEmail}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(message.status)}`}>
                              {message.status}
                            </span>
                            {message.type === 'contact_us' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Contact Us
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Item Message
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {message.subject && (
                          <p className={`text-sm mb-1 ${message.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {message.subject}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(message.createdAt)}
                          </span>
                          {message.relatedItemId && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {message.relatedItemId.name || 'Item'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Message Details</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  {selectedMessage.type === 'contact_us' ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      Contact Us
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Item Message
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sender Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">From</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedMessage.senderName}</p>
                    <p className="text-sm text-gray-500">{selectedMessage.senderEmail}</p>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Date</h3>
                <p className="text-gray-900">{formatDate(selectedMessage.createdAt)}</p>
              </div>

              {/* Subject (for contact_us) */}
              {selectedMessage.subject && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Subject</h3>
                  <p className="text-gray-900">{selectedMessage.subject}</p>
                </div>
              )}

              {/* Related Item (for item_contact) */}
              {selectedMessage.relatedItemId && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Related Item</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Package className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedMessage.relatedItemId.name || 'Item'}</p>
                      <p className="text-sm text-gray-500">{selectedMessage.relatedItemId.category}</p>
                    </div>
                    {selectedMessage.itemOwnerId && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Owner:</p>
                        <p className="text-sm font-medium text-gray-700">{selectedMessage.itemOwnerId.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Message</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedMessage.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Moderator Notes</h3>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMessage.status === 'unread' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'read')}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  {(selectedMessage.status === 'read' || selectedMessage.status === 'unread') && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'replied')}
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Mark as Replied
                    </button>
                  )}
                  <button
                    onClick={() => updateMessageStatus(selectedMessage._id, 'archived')}
                    disabled={updating}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    Archive
                  </button>
                  {selectedMessage.status === 'archived' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'unread')}
                      disabled={updating}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
