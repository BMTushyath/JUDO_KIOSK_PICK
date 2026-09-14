import React, { useState, useEffect } from 'react';
import { User, School, X, Save } from 'lucide-react';

export default function ParticipantFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null
}) {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCollege(initialData.college || '');
      setParticipantId(initialData.participant_id || '');
    } else {
      setName('');
      setCollege('');
      setParticipantId('');
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
      college: college.trim()
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
            <button type="submit" className="btn-modal-confirm">
              <Save size={16} /> Save Participant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
