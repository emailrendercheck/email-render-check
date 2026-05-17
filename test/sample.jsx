import React from 'react';

export default function Sample({ name }) {
  return (
    <table style={{ backgroundColor: '#000', borderRadius: 8, maxWidth: 600 }}>
      <tr>
        <td style={{ padding: 20 }}>
          <h1 style={{ fontSize: 24, color: '#fff', animation: 'fadeIn 1s' }}>
            Sample, {name}
          </h1>
          <a href="https://example.com" style={{ 
            display: 'inline-block', 
            padding: '12px 24px',
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Sample Link
          </a>
        </td>
      </tr>
    </table>
  );
}