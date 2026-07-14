import React from 'react';
export function ServiceUnavailable() {
  return (
    <div
      style={{
        margin: '40px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000',
        background: '#fff',
        lineHeight: 1.5
      }}>
      
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 'normal',
          marginBottom: '10px'
        }}>
        
        503 Service Unavailable
      </h1>
      <p>
        The server is temporarily unable to service your request due to
        maintenance downtime or capacity problems. Please try again later.
      </p>
      <hr />
      <p>
        <strong>Error Code:</strong> 503
      </p>
      <p>
        <strong>Request ID:</strong> 4B81F29C
      </p>
      <p>
        <strong>Time:</strong> {new Date().toUTCString()}
      </p>
      <hr />
      <small>nginx/1.26.1</small>
    </div>);

}