import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Image, Calendar, Clock, MapPin, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../lib/session';

const API = import.meta.env.VITE_API_URL;

const TAGS = ['Technical', 'Cultural', 'Sports', 'Recruitment', 'Creative', 'Other'];

const CreatePostModal = ({ isOpen, onClose, type, onCreated }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [venue, setVenue] = useState('');
  const [tag, setTag] = useState(type === 'Recruitment' ? 'Recruitment' : 'Technical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Paid-event state
  const [isPaid, setIsPaid] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentQrImage, setPaymentQrImage] = useState('');
  const [qrStatus, setQrStatus] = useState('idle'); // idle | checking | valid | invalid

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setBody(''); setImage(''); setEventDate(''); setRegistrationDeadline('');
      setVenue(''); setTag(type === 'Recruitment' ? 'Recruitment' : 'Technical');
      setError('');
      setIsPaid(false); setAmount(''); setPaymentQrImage(''); setQrStatus('idle');
    }
  }, [isOpen, type]);

  const handleQrFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPaymentQrImage(reader.result);
    reader.readAsDataURL(file);

    setQrStatus('checking');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-validator');
      const result = await scanner.scanFile(file, false);
      setQrStatus(result ? 'valid' : 'invalid');
    } catch {
      setQrStatus('invalid');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (type === 'Event' && !eventDate) { setError('Event date is required'); return; }
    if (!registrationDeadline) {
      setError(type === 'Recruitment' ? 'Application deadline is required' : 'Registration deadline is required');
      return;
    }
    if (type === 'Event' && isPaid) {
      if (!paymentQrImage) { setError('Payment QR image is required for paid events'); return; }
      if (!amount || Number(amount) <= 0) { setError('Amount must be greater than 0'); return; }
    }

    setLoading(true);
    try {
      const token = getToken();
      const { data } = await axios.post(`${API}/api/posts`, {
        type, title, body, image,
        eventDate: eventDate || undefined,
        registrationDeadline,
        venue, tag,
        isPaid: type === 'Event' ? isPaid : false,
        amount: type === 'Event' && isPaid ? Number(amount) : 0,
        paymentQrImage: type === 'Event' && isPaid ? paymentQrImage : '',
      }, { headers: { Authorization: `Bearer ${token}` } });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const gradientClass = type === 'Recruitment'
    ? 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]'
    : 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Off-screen host for html5-qrcode.scanFile â€” required to exist in DOM */}
          <div id="qr-validator" style={{ position: 'absolute', left: '-9999px', top: 0, width: 0, height: 0, overflow: 'hidden' }} />

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#18181b] border border-white/10 w-full max-w-lg rounded-2xl p-6 relative shadow-2xl overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[50px] ${type === 'Recruitment' ? 'bg-amber-500/15' : 'bg-blue-500/15'}`} />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="relative z-10">
                <h2 className="text-lg font-bold text-white mb-1">
                  {type === 'Recruitment' ? 'New Recruitment Post' : 'New Event Post'}
                </h2>
                <p className="text-gray-500 text-sm mb-5">
                  {type === 'Recruitment'
                    ? 'This will appear in the student feed as an open application.'
                    : 'This will appear in the student feed as an event.'}
                </p>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={type === 'Recruitment' ? 'e.g. Robotics Club â€” Open Positions' : 'e.g. ROS Workshop 2026'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                      {type === 'Recruitment' ? 'Roles & Description' : 'Description'}
                    </label>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      rows={3}
                      placeholder={type === 'Recruitment'
                        ? 'Describe the roles you are looking forâ€¦'
                        : 'Describe the event, agenda, who should attendâ€¦'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors resize-none"
                    />
                  </div>

                  {/* Event-only date pair */}
                  {type === 'Event' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1 block">
                          <Calendar size={11} /> Event Date *
                        </label>
                        <input
                          type="datetime-local"
                          value={eventDate}
                          onChange={e => setEventDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1 block">
                          <Clock size={11} /> Registration Deadline *
                        </label>
                        <input
                          type="datetime-local"
                          value={registrationDeadline}
                          onChange={e => setRegistrationDeadline(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Event venue */}
                  {type === 'Event' && (
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1 block">
                        <MapPin size={11} /> Venue
                      </label>
                      <input
                        type="text"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                        placeholder="e.g. Seminar Hall A"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                  )}

                  {/* Recruitment-only deadline */}
                  {type === 'Recruitment' && (
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1 block">
                        <Clock size={11} /> Application Deadline *
                      </label>
                      <input
                        type="datetime-local"
                        value={registrationDeadline}
                        onChange={e => setRegistrationDeadline(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                  )}

                  {/* Event-only: Free / Paid toggle */}
                  {type === 'Event' && (
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">Ticket Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setIsPaid(false); setAmount(''); setPaymentQrImage(''); setQrStatus('idle'); }}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                            !isPaid
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          Free Event
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPaid(true)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                            isPaid
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          Paid Event
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Paid-event payment fields */}
                  {type === 'Event' && isPaid && (
                    <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Payment QR Code *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrFile}
                          className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/15"
                        />
                        {paymentQrImage && (
                          <div className="mt-3 flex items-start gap-3">
                            <img src={paymentQrImage} alt="QR preview" className="w-20 h-20 rounded-lg object-cover border border-white/10 bg-white" />
                            <div className="flex-1 text-xs">
                              {qrStatus === 'checking' && (
                                <span className="text-gray-400 flex items-center gap-1.5"><Loader size={12} className="animate-spin" /> Checkingâ€¦</span>
                              )}
                              {qrStatus === 'valid' && (
                                <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle size={12} /> Valid QR detected</span>
                              )}
                              {qrStatus === 'invalid' && (
                                <span className="text-red-400 flex items-start gap-1.5"><AlertCircle size={12} className="mt-0.5" /> Could not read QR â€” please upload a valid QR code image</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1 block">
                          <IndianRupee size={11} /> Amount (â‚¹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image URL */}
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1 block">
                      <Image size={11} /> Image URL <span className="text-gray-700">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={e => setImage(e.target.value)}
                      placeholder="https://â€¦"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
                    />
                  </div>

                  {/* Tag */}
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">Tag</label>
                    <div className="flex flex-wrap gap-2">
                      {TAGS.map(t => (
                        <button
                          key={t}
                          onClick={() => setTag(t)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            tag === t
                              ? 'bg-white/15 border-white/30 text-white'
                              : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full py-3 bg-gradient-to-r ${gradientClass} text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2`}
                  >
                    {loading ? <><Loader size={16} className="animate-spin" /> Publishingâ€¦</> : `Publish ${type} Post`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
