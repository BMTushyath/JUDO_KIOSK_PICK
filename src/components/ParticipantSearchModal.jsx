import React, { useState, useMemo } from 'react';
import { Search, X, Check, User, School, AlertCircle } from 'lucide-react';

export default function ParticipantSearchModal({
  isOpen,
  onClose,
  onSelect,
  onNavigateToDataset,
  participants = [],
  title = "Select Participant"
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const filteredParticipants = useMemo(() => {
    if (!searchTerm.trim()) {
      return participants.slice(0, 50); // Show first 50 by default
    }
    const query = searchTerm.toLowerCase();
    return participants.filter(p => 
      p.name?.toLowerCase().includes(query) ||
      p.college?.toLowerCase().includes(query) ||
      p.participant_id?.toLowerCase().includes(query)
    ).slice(0, 100);
  }, [participants, searchTerm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedParticipant) {
      onSelect(selectedParticipant);
      setSelectedParticipant(null);
      setSearchTerm('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedParticipant(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal-box" style={{ maxWidth: '640px', width: '92%' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#0284c7" />
            <span>{title}</span>
          </div>
          <button 
            onClick={handleClose} 
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              autoFocus
              placeholder="Search participant by name or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '8px',
                border: '1px solid #b2ebf2',
                background: '#f8fdfe',
                fontSize: '14px',
                color: 'var(--color-navy-dark)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Results List */}
          {participants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 20px', color: '#64748b' }}>
              <AlertCircle size={36} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)', fontSize: '15px' }}>No Participant Dataset Loaded</div>
              <p style={{ fontSize: '13px', marginTop: '4px', marginBottom: '16px' }}>
                Please upload a participant XLSX or CSV dataset first to select athletes.
              </p>
              {onNavigateToDataset && (
                <button
                  type="button"
                  className="btn-primary-action"
                  style={{ margin: '0 auto' }}
                  onClick={() => {
                    handleClose();
                    onNavigateToDataset();
                  }}
                >
                  Go to Dataset / Participants →
                </button>
              )}
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              No matching athletes found for "{searchTerm}".
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
              {filteredParticipants.map((p) => {
                const isSelected = selectedParticipant?.participant_id === p.participant_id;
                return (
                  <div
                    key={p.participant_id || p.name}
                    onClick={() => setSelectedParticipant(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(2, 132, 199, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)', fontSize: '14px' }}>
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        <School size={12} />
                        <span>{p.college}</span>
                        {p.participant_id && (
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7', marginLeft: '4px' }}>
                            ({p.participant_id})
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ background: '#0284c7', color: '#ffffff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected preview & Action Buttons */}
        <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {selectedParticipant ? (
              <span>Selected: <strong style={{ color: 'var(--color-navy-dark)' }}>{selectedParticipant.name}</strong> ({selectedParticipant.college})</span>
            ) : (
              <span>Select a participant to proceed</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-modal-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="btn-modal-confirm"
              onClick={handleConfirm}
              disabled={!selectedParticipant}
              style={{ opacity: selectedParticipant ? 1 : 0.5 }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
