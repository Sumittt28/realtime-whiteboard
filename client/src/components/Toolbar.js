import React from 'react';
import './Toolbar.css';

const Toolbar = ({ brushColor, setBrushColor, brushSize, setBrushSize, onClear }) => {
  const colors = [
    '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <label>Brush Color</label>
        <div className="color-palette">
          {colors.map(color => (
            <button
              key={color}
              className={`color-btn ${brushColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setBrushColor(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <label>Brush Size: {brushSize}px</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="brush-slider"
        />
      </div>

      <div className="toolbar-section">
        <button className="action-btn clear-btn" onClick={onClear}>
          🗑️ Clear Canvas
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
