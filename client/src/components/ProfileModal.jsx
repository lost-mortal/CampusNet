import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import StudentPublicProfile from '../pages/public/StudentPublicProfile';
import ClubPublicProfile from '../pages/public/ClubPublicProfile';
import CommunityPublicProfile from '../pages/public/CommunityPublicProfile';

// Unified profile popup. type: 'student' | 'club' | 'community', id: entity id.
const ProfileModal = ({ type, id, onClose }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!type || !id) return null;

    const content = () => {
        if (type === 'student') return <StudentPublicProfile entityId={id} asModal onClose={onClose} />;
        if (type === 'club')    return <ClubPublicProfile entityId={id} asModal />;
        if (type === 'community') return <CommunityPublicProfile entityId={id} asModal onClose={onClose} />;
        return null;
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-[#0d0d0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Scrollable profile content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {content()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
