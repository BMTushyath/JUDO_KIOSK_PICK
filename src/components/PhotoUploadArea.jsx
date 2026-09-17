import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, RefreshCw, Clipboard } from 'lucide-react';
import DefaultAvatar from './DefaultAvatar';
import { compressImageFile } from '../utils/imageUtils';

/**
 * 3-tier Participant Photo Input Component:
 * 1. Drag-and-Drop directly from Windows File Explorer
 * 2. Clipboard Copy & Paste (Ctrl+V) from screenshot / web / image viewer
 * 3. Standard File Picker fallback
 * Fallback to clean generic DefaultAvatar when no real photo exists.
 */
export default function PhotoUploadArea({
  photo = null,
  onPhotoChange,
  size = 80,
  shape = 'rounded', // 'rounded' | 'circle'
  label = '',
  disabled = false,
  className = '',
  style = {}
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const dimension = typeof size === 'number' ? `${size}px` : size;
  const borderRadius = shape === 'circle' ? '50%' : '10px';

  const processFile = async (file) => {
    if (!file || disabled) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setErrorNotice('Only image files are accepted');
      setTimeout(() => setErrorNotice(''), 3500);
      return;
    }

    try {
      setIsCompressing(true);
      setErrorNotice('');
      const compressedDataUrl = await compressImageFile(file, 720, 720, 0.85);
      if (onPhotoChange) {
        onPhotoChange(compressedDataUrl);
      }
    } catch (err) {
      console.error('Photo compression error:', err);
      setErrorNotice('Failed to process image');
      setTimeout(() => setErrorNotice(''), 3500);
    } finally {
      setIsCompressing(false);
    }
  };

  // 1. Windows File Explorer Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  // 2. Clipboard Copy & Paste (Ctrl+V) Handlers
  const handlePaste = async (e) => {
    if (disabled) return;
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    // Check clipboard items
    const items = clipboardData.items;
    let foundImage = false;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            foundImage = true;
            e.preventDefault();
            e.stopPropagation();
            setPasteNotice(true);
            setTimeout(() => setPasteNotice(false), 2000);
            await processFile(file);
            break;
          }
        }
      }
    }

    // Fallback: check clipboard files
    if (!foundImage && clipboardData.files && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      if (file.type && file.type.startsWith('image/')) {
        e.preventDefault();
        e.stopPropagation();
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 2000);
        await processFile(file);
      }
    }
  };

  // 3. Normal File Picker Fallback Handler
  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
      // reset input so same file can be re-selected if retrying
      e.target.value = '';
    }
  };

  const handleClearPhoto = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onPhotoChange) {
      onPhotoChange(null);
    }
  };

  const hasPhoto = Boolean(photo && typeof photo === 'string' && photo.length > 50);

  return (
    <div
      className={`photo-upload-container ${className}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', ...style }}
    >
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Participant photo dropzone and paste area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={() => {
          if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }
        }}
        style={{
          width: dimension,
          height: dimension,
          borderRadius,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9',
          border: isDragOver
            ? '3px dashed #0284c7'
            : hasPhoto
            ? '2px solid #0284c7'
            : '2px dashed #94a3b8',
          boxShadow: isDragOver ? '0 0 14px rgba(2, 132, 199, 0.4)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          outline: 'none',
          transition: 'all 0.18s ease-in-out',
          userSelect: 'none'
        }}
        title="Drag & drop image file from Windows Explorer, or focus & press Ctrl+V to paste, or click to browse"
      >
        {/* Photo or Default Avatar */}
        {hasPhoto ? (
          <img
            src={photo}
            alt="Participant preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <DefaultAvatar size="100%" style={{ border: 'none', borderRadius }} />
        )}

        {/* Loading Spinner during compression */}
        {isCompressing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              gap: '4px'
            }}
          >
            <RefreshCw size={20} className="animate-spin" />
            <span>Processing</span>
          </div>
        )}

        {/* Drag-over overlay feedback */}
        {isDragOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(2, 132, 199, 0.88)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              textAlign: 'center',
              padding: '4px'
            }}
          >
            <Upload size={22} />
            <span>Drop Image</span>
          </div>
        )}

        {/* Quick hover badge if photo exists */}
        {!disabled && hasPhoto && !isCompressing && (
          <div
            className="photo-hover-overlay"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              padding: '4px 2px',
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <Camera size={11} />
            <span>Replace</span>
          </div>
        )}

        {/* Hidden File Picker Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>

      {/* Paste / Error Toast Feedback */}
      {pasteNotice && (
        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 800 }}>
          ✓ Image Pasted
        </span>
      )}
      {errorNotice && (
        <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>
          {errorNotice}
        </span>
      )}

      {/* Action helpers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (fileInputRef.current) fileInputRef.current.click();
          }}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            padding: '3px 8px',
            fontSize: '11px',
            color: '#0284c7',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Browse file from disk"
        >
          <Upload size={12} />
          <span>{hasPhoto ? 'Replace' : 'Upload'}</span>
        </button>

        {hasPhoto && (
          <button
            type="button"
            onClick={handleClearPhoto}
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '5px',
              padding: '3px 6px',
              fontSize: '11px',
              color: '#dc2626',
              cursor: 'pointer'
            }}
            title="Remove photo and revert to Default Avatar"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {label && (
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
          {label}
        </span>
      )}
    </div>
  );
}
