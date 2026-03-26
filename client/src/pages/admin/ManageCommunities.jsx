import React, { useState } from 'react';
import { PENDING_COMMUNITIES } from '../../data/mockData';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const ManageCommunities = () => {
    const [pendingRequests, setPendingRequests] = useState(PENDING_COMMUNITIES);
    const [feedback, setFeedback] = useState(null);

    const handleApprove = (request) => {
        // Remove from pending list
        setPendingRequests(pendingRequests.filter(r => r.id !== request.id));

        // Show success feedback
        setFeedback({
            type: 'success',
            message: `"${request.name}" has been approved! ${request.requestedBy} is now the Community Manager.`
        });

        console.log('Approved community:', {
            ...request,
            status: 'approved',
            managedBy: request.requestedBy
        });

        // Clear feedback after 5 seconds
        setTimeout(() => setFeedback(null), 5000);
    };

    const handleReject = (request) => {
        // Remove from pending list
        setPendingRequests(pendingRequests.filter(r => r.id !== request.id));

        // Show reject feedback
        setFeedback({
            type: 'error',
            message: `"${request.name}" request has been rejected.`
        });

        console.log('Rejected community:', request);

        // Clear feedback after 5 seconds
        setTimeout(() => setFeedback(null), 5000);
    };

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Manage Communities
                </h1>
                <p className="text-gray-500">Review and approve community creation requests</p>
            </div>

            {/* Feedback Banner */}
            {feedback && (
                <div className={`mb-6 p-4 rounded-xl border ${feedback.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    } flex items-center gap-3 animate-pulse`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle size={20} />
                    ) : (
                        <XCircle size={20} />
                    )}
                    <p className="font-medium">{feedback.message}</p>
                </div>
            )}

            {/* Pending Requests */}
            {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={40} className="text-gray-600" />
                    </div>
                    <p className="text-xl font-semibold text-gray-400 mb-2">No Pending Requests</p>
                    <p className="text-sm text-gray-600">All community requests have been reviewed!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
                        >
                            {/* Request Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{request.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock size={14} />
                                        <span>Requested on {new Date(request.requestedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Purpose */}
                            <div className="mb-4 p-3 bg-white/5 border border-white/5 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1 font-semibold">Purpose:</p>
                                <p className="text-sm text-gray-300">{request.purpose}</p>
                            </div>

                            {/* Requesting Student */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <div className="text-2xl">{request.requestedByAvatar}</div>
                                <div>
                                    <p className="text-xs text-gray-500">Requested by</p>
                                    <p className="text-sm font-semibold text-indigo-400">{request.requestedBy}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleApprove(request)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 rounded-xl font-semibold text-green-400 transition-all"
                                >
                                    <CheckCircle size={18} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(request)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-xl font-semibold text-red-400 transition-all"
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageCommunities;
