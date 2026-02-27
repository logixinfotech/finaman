import React, { useState } from 'react';
import './WhatsAppForm.css';
import { FaPaperPlane } from 'react-icons/fa'; // Import send icon

function WhatsAppForm({ onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const url = 'http://localhost:6789/send-message/SUMAN1232312455';
    const body = {
      number: phoneNumber,
      message: message,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseBody = await response.text(); // Get response body text

      if (response.ok) {
        alert('Message sent successfully!');
        setPhoneNumber('');
        setMessage('');
      } else {
        alert(`Failed to send message: ${responseBody}`);
      }
    } catch (error) {
      alert('An unexpected error occurred.');
    }
  };

  return (
    <div className="whatsapp-form-container">
      <button className="close-btn" onClick={onClose}>×</button>
      <h2>Send a WhatsApp Message</h2>
      <form className="whatsapp-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="phone-number">Phone Number:</label>
        <input
          id="phone-number"
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
        />
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
        ></textarea>
        <button type="button" onClick={handleSend}>
          Send
          <FaPaperPlane className="send-icon" />
        </button>
      </form>
    </div>
  );
}

export default WhatsAppForm;
