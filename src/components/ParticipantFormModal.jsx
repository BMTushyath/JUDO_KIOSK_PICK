import React, { useState, useEffect, useRef } from 'react';
import { User, School, X, Save, Camera, Upload, Trash2 } from 'lucide-react';
import { compressImageFile } from '../utils/imageUtils';

export default function ParticipantFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null
}) {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCollege(initialData.college || '');
      setParticipantId(initialData.participant_id || '');
      setPhoto(initialData.photo || null);
    } else {
      setName('');
      setCollege('');
      setParticipantId('');
      setPhoto(null);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    try {
      setCompressing(true);
      setError('');
      const compressedUrl = await compressImageFile(file, 480, 480, 0.82);
      setPhoto(compressedUrl);
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Could not process photo: ' + (err.message || 'Invalid image file'));
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the participant name.');
      return;
    }
    if (!college.trim()) {
      setError('Please enter the participant college.');
      return;
    }

    // Format ID to 3 digits (e.g. 001, 042)
    let cleanId = participantId.trim();
    const digitsMatch = cleanId.match(/\d+/);
    if (digitsMatch) {
      cleanId = String(parseInt(digitsMatch[0], 10)).padStart(3, '0');
    } else if (!cleanId) {
      cleanId = String(Math.floor(1 + Math.random() * 300)).padStart(3, '0');
    }

    onSave({
      participant_id: cleanId,
      name: name.trim(),
      college: college.trim(),
      photo: photo || null
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal-box" style={{ maxWidth: '500px', width: '92%' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#0284c7" />
            <span>{initialData ? 'Edit Participant' : 'Add New Participant'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* Photo Upload & Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '64px',
                height: '76px',
                borderRadius: '8px',
                backgroundColor: '#e2e8f0',
                border: photo ? '2px solid #0284c7' : '2px dashed #94a3b8',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {photo ? (
                  <img src={photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={22} color="#94a3b8" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                  Participant Photo
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={13} />
                    <span>{photo ? 'Change Photo' : 'Select Photo'}</span>
                  </button>

                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 8px',
                        borderRadius: '5px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  {compressing ? 'Optimizing photo...' : 'Required for ongoing fixtures'}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                Participant ID
              </label>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="e.g. 042"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontFamily: 'var(--font-mono)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                Athlete Full Name *
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                College / Institution *
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Sambhram Institute of Technology"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-confirm" disabled={compressing}>
              <Save size={16} /> Save Participant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
