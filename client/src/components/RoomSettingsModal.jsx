import React, { useState } from 'react';

const TIME_OPTIONS = [
  { label: '制限なし', value: 0 },
  { label: '1分', value: 60 },
  { label: '3分', value: 180 },
  { label: '5分', value: 300 },
  { label: '10分', value: 600 },
];

export default function RoomSettingsModal({ settings, onSave, onClose }) {
  const [timeLimit, setTimeLimit] = useState(settings?.timeLimit || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>ルーム設定</h3>

        <div className="setting-group">
          <label>持ち時間</label>
          <div className="time-options">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`btn btn-small ${timeLimit === opt.value ? 'active' : ''}`}
                onClick={() => setTimeLimit(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={() => onSave({ timeLimit })}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
