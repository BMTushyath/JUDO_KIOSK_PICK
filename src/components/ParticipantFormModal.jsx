import React, { useState, useEffect } from 'react';
import { User, School, X, Save } from 'lucide-react';
import PhotoUploadArea from './PhotoUploadArea';

export default function ParticipantFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null
}) {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCollege(initialData.college || '');
      setPhoto(initialData.photo || null);
    } else {
      setName('');
      setCollege('');
      setPhoto(null);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

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

    // Auto-generate ID if new participant, or preserve existing
    const existingId = initialData?.participant_id || initialData?.id;
    const cleanId = existingId || ("p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4));

    onSave({
      participant_id: cleanId,
      id: cleanId,
      name: name.trim(),
      college: college.trim(),
      photo: photo || null
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal-box" style={{ maxWidth: '480px', width: '92%' }}>
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

            {/* Photo Input (Drag & drop from Windows Explorer, Paste Ctrl+V, or File Picker) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <PhotoUploadArea
                photo={photo}
                onPhotoChange={setPhoto}
                size={78}
                shape="circle"
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: '3px' }}>
                  Participant Photo (Optional)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                  Drag & drop image, paste with <strong>Ctrl+V</strong>, or browse. If empty, the default avatar will be used until captured.
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334e68', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Participant Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: 'var(--color-navy-dark)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* College Field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334e68', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                College / Institution Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Sambhram Institute of Technology"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: 'var(--color-navy-dark)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <School size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} />
              <span>{initialData ? 'Save Changes' : 'Add Participant'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
