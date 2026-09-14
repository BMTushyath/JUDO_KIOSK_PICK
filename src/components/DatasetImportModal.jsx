import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertTriangle, CheckCircle, X, FileSpreadsheet, Download, Info, AlertCircle } from 'lucide-react';

// Helper to format any raw participant ID into clean, stable 3-digit format (001, 002, etc.)
export function formatThreeDigitId(rawId, fallbackIndex = 1) {
  if (rawId !== undefined && rawId !== null) {
    const str = String(rawId).trim();
    const digitsMatch = str.match(/\d+/);
    if (digitsMatch) {
      const num = parseInt(digitsMatch[0], 10);
      if (!isNaN(num) && num > 0) {
        return String(num).padStart(3, '0');
      }
    }
  }
  return String(fallbackIndex).padStart(3, '0');
}

export default function DatasetImportModal({
  isOpen,
  onClose,
  onImport
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedValidRows, setParsedValidRows] = useState(null);
  const [parsedInvalidRows, setParsedInvalidRows] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState('valid'); // 'valid' | 'invalid'

  if (!isOpen) return null;

  // Process XLSX / CSV file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse sheet as raw 2D array of rows to be fully header-position agnostic
        const rawGrid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawGrid || rawGrid.length === 0) {
          setErrorMsg('The selected spreadsheet contains no data rows.');
          setIsProcessing(false);
          return;
        }

        validateAndPrepare(selectedFile.name, rawGrid);
      } catch (err) {
        setErrorMsg('Failed to parse spreadsheet file: ' + err.message);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const validateAndPrepare = (fileName, rows) => {
    // 1. Detect header row by scanning first 6 rows for common keywords
    let headerRowIndex = 0;
    let idCol = -1;
    let nameCol = -1;
    let collegeCol = -1;
    let genderCol = -1;
    let catCol = -1;
    let weightCol = -1;

    for (let r = 0; r < Math.min(rows.length, 6); r++) {
      const row = rows[r].map(c => String(c).trim().toLowerCase());
      let foundName = -1;
      let foundCollege = -1;
      let foundId = -1;

      row.forEach((cell, idx) => {
        if (/college|institution|institute|university|school|team/.test(cell)) {
          foundCollege = idx;
        } else if (/participant_?id|athlete_?id|player_?id|\bid\b|sl\.?\s*no|sno|serial|roll|chest|bib/.test(cell)) {
          foundId = idx;
        } else if (/name|athlete|participant|player|student/.test(cell)) {
          foundName = idx;
        } else if (/gender|sex/.test(cell)) {
          genderCol = idx;
        } else if (/weight/.test(cell)) {
          weightCol = idx;
        } else if (/category/.test(cell)) {
          catCol = idx;
        }
      });

      if (foundName !== -1 && foundCollege !== -1) {
        headerRowIndex = r;
        nameCol = foundName;
        collegeCol = foundCollege;
        idCol = foundId;
        break;
      }
    }

    // Fallback if no matching headers found: column 0=ID, column 1=Name, column 2=College
    if (nameCol === -1 || collegeCol === -1) {
      if (rows[0] && rows[0].length >= 2) {
        idCol = 0;
        nameCol = 1;
        collegeCol = 2;
        headerRowIndex = 0;
      }
    }

    const validRows = [];
    const invalidRows = [];
    const warnings = [];
    const seenIds = new Set();
    const seenNamesAndColleges = new Set();

    let serialCounter = 1;

    // 2. Iterate through data rows (after header row)
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      const spreadsheetRowNumber = r + 1;

      // Ignore rows where all cells are empty or spaces
      if (!row || row.every(c => !String(c).trim())) {
        continue;
      }

      const rawName = String(nameCol >= 0 && row[nameCol] !== undefined ? row[nameCol] : '').trim();
      const rawCollege = String(collegeCol >= 0 && row[collegeCol] !== undefined ? row[collegeCol] : '').trim();
      const rawId = idCol >= 0 && row[idCol] !== undefined ? String(row[idCol]).trim() : '';

      // Validate required fields
      if (!rawName) {
        invalidRows.push({
          rowNum: spreadsheetRowNumber,
          rawId,
          rawName: '(Empty Name)',
          rawCollege: rawCollege || '(Empty College)',
          reason: 'Missing athlete / participant name'
        });
        continue;
      }

      if (!rawCollege) {
        invalidRows.push({
          rowNum: spreadsheetRowNumber,
          rawId,
          rawName,
          rawCollege: '(Empty College)',
          reason: 'Missing college / institution'
        });
        continue;
      }

      // Convert ID to clean 3-digit format (001, 002, 003, ...)
      let threeDigitId = formatThreeDigitId(rawId, serialCounter);

      // Check for duplicate ID
      if (seenIds.has(threeDigitId)) {
        const adjustedId = String(serialCounter).padStart(3, '0');
        warnings.push(`Row ${spreadsheetRowNumber}: Duplicate ID "${threeDigitId}" re-assigned to "${adjustedId}".`);
        threeDigitId = adjustedId;
      }
      seenIds.add(threeDigitId);
      serialCounter++;

      // Check for duplicate athlete (same name & college)
      const duplicateKey = `${rawName.toLowerCase()}|||${rawCollege.toLowerCase()}`;
      if (seenNamesAndColleges.has(duplicateKey)) {
        warnings.push(`Row ${spreadsheetRowNumber}: Possible duplicate athlete "${rawName}" from "${rawCollege}".`);
      }
      seenNamesAndColleges.add(duplicateKey);

      validRows.push({
        participant_id: threeDigitId,
        name: rawName,
        college: rawCollege,
        gender: genderCol >= 0 ? String(row[genderCol] || '').trim() : '',
        category: catCol >= 0 ? String(row[catCol] || '').trim() : '',
        weight_category: weightCol >= 0 ? String(row[weightCol] || '').trim() : ''
      });
    }

    setParsedValidRows(validRows);
    setParsedInvalidRows(invalidRows);
    setValidationReport({
      fileName,
      totalRows: validRows.length + invalidRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      warningCount: warnings.length,
      warnings
    });
    setIsProcessing(false);
  };

  const handleConfirm = () => {
    if (!parsedValidRows || parsedValidRows.length === 0) return;

    const meta = {
      fileName: validationReport.fileName,
      uploadedAt: new Date().toLocaleString(),
      recordCount: parsedValidRows.length
    };

    onImport(parsedValidRows, meta);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedValidRows(null);
    setParsedInvalidRows([]);
    setValidationReport(null);
    setErrorMsg('');
    setIsProcessing(false);
    onClose();
  };

  // Helper to trigger Excel template download
  const handleDownloadTemplate = () => {
    const wsData = [['participant_id', 'name', 'college']];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 38 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, 'vtu_participant_import_template.xlsx');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal-box" style={{ maxWidth: '820px', width: '95%' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={22} color="#0284c7" />
            <span>Import Participant Dataset (XLSX / CSV)</span>
          </div>
          <button 
            onClick={handleClose} 
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 0' }}>
          {/* STEP 1: UPLOAD AREA */}
          {!parsedValidRows ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #0284c7',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#f8fdfe',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <Upload size={40} color="#0284c7" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Click to select or drop an XLSX / CSV spreadsheet
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  Supports <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code> files
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {isProcessing && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#0284c7', fontWeight: 700 }}>
                  Parsing and validating spreadsheet data...
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              {/* Template Download & Format Info */}
              <div style={{ background: '#f1f5f9', padding: '14px 18px', borderRadius: '8px', fontSize: '13px', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={15} color="#0284c7" /> Need the Official Import Template?
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                    Contains the correct columns: <code>participant_id</code> (001, 002...), <code>name</code>, and <code>college</code>.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn-undo-result"
                  style={{ padding: '8px 14px', fontSize: '12px', background: '#ffffff', border: '1px solid #cbd5e1' }}
                >
                  <Download size={14} /> Download Excel Template
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2 & 3: VALIDATION SUMMARY & PREVIEW WITH DISTINCT VALID & INVALID VIEWS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div 
                  onClick={() => setActivePreviewTab('valid')}
                  style={{
                    background: activePreviewTab === 'valid' ? '#dcfce7' : '#f0fdf4',
                    border: activePreviewTab === 'valid' ? '2px solid #16a34a' : '1px solid #bbf7d0',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>VALID PARTICIPANTS</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803d' }}>{validationReport.validCount}</div>
                </div>

                <div 
                  onClick={() => parsedInvalidRows.length > 0 && setActivePreviewTab('invalid')}
                  style={{
                    background: activePreviewTab === 'invalid' ? '#fee2e2' : validationReport.invalidCount > 0 ? '#fef2f2' : '#f8fafc',
                    border: activePreviewTab === 'invalid' ? '2px solid #dc2626' : '1px solid #fecaca',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: validationReport.invalidCount > 0 ? 'pointer' : 'default'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#991b1b' }}>INVALID / SKIPPED ROWS</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#b91c1c' }}>{validationReport.invalidCount}</div>
                </div>

                <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#854d0e' }}>WARNINGS / DUPLICATES</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#a16207' }}>{validationReport.warningCount}</div>
                </div>
              </div>

              {/* Warnings List */}
              {validationReport.warnings.length > 0 && (
                <div style={{ maxHeight: '80px', overflowY: 'auto', background: '#fffbeb', border: '1px solid #fcd34d', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
                  <div style={{ fontWeight: 800, marginBottom: '2px' }}>Validation Warnings:</div>
                  {validationReport.warnings.slice(0, 4).map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                  {validationReport.warnings.length > 4 && (
                    <div>...and {validationReport.warnings.length - 4} more warnings.</div>
                  )}
                </div>
              )}

              {/* PREVIEW: VALID ROWS VIEW */}
              {activePreviewTab === 'valid' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      Valid Entries Ready to Import (Showing first 6 of {parsedValidRows.length} athletes with 3-digit IDs)
                    </span>
                    {parsedInvalidRows.length > 0 && (
                      <button 
                        onClick={() => setActivePreviewTab('invalid')}
                        style={{ background: 'transparent', border: 'none', color: '#b91c1c', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        View {parsedInvalidRows.length} Invalid Rows →
                      </button>
                    )}
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 10px' }}>ID (3-Digit)</th>
                          <th style={{ padding: '8px 10px' }}>Athlete Name</th>
                          <th style={{ padding: '8px 10px' }}>College / Institution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedValidRows.slice(0, 6).map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 700 }}>
                              {p.participant_id}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700 }}>{p.name}</td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>{p.college}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PREVIEW: INVALID ROWS VIEW */}
              {activePreviewTab === 'invalid' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#b91c1c' }}>
                      Invalid / Skipped Rows ({parsedInvalidRows.length} rows)
                    </span>
                    <button 
                      onClick={() => setActivePreviewTab('valid')}
                      style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Back to Valid Rows
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #fca5a5', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ background: '#fef2f2', textAlign: 'left', borderBottom: '1px solid #fecaca' }}>
                          <th style={{ padding: '8px 10px' }}>Row #</th>
                          <th style={{ padding: '8px 10px' }}>Athlete Name</th>
                          <th style={{ padding: '8px 10px' }}>College</th>
                          <th style={{ padding: '8px 10px', color: '#b91c1c' }}>Reason for Rejection</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedInvalidRows.map((inv, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #fee2e2', background: '#fff' }}>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{inv.rowNum}</td>
                            <td style={{ padding: '8px 10px' }}>{inv.rawName}</td>
                            <td style={{ padding: '8px 10px' }}>{inv.rawCollege}</td>
                            <td style={{ padding: '8px 10px', color: '#b91c1c', fontWeight: 700 }}>{inv.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
          {parsedValidRows ? (
            <>
              <button 
                className="btn-modal-cancel"
                onClick={() => {
                  setParsedValidRows(null);
                  setParsedInvalidRows([]);
                  setValidationReport(null);
                }}
              >
                Choose Different File
              </button>
              <button 
                className="btn-modal-confirm"
                onClick={handleConfirm}
                disabled={parsedValidRows.length === 0}
              >
                <CheckCircle size={16} /> Confirm & Import {parsedValidRows.length} Participants
              </button>
            </>
          ) : (
            <>
              <button className="btn-modal-cancel" onClick={handleClose}>
                Cancel
              </button>
              <button 
                className="btn-modal-confirm" 
                onClick={() => fileInputRef.current?.click()}
              >
                Browse File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
