import React, { useState } from 'react';
import './USERMA.css';

// User Entry Form Component
const UserEntry = () => {
  const [userGroup, setUserGroup] = useState('');
  const [userName, setUserName] = useState('');
  const [userID, setUserID] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userPicture, setUserPicture] = useState(null);
  const [userBlockedDate, setUserBlockedDate] = useState('');
  const [otherDetails, setOtherDetails] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setUserPicture(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement user creation logic here
    console.log({
      userGroup,
      userName,
      userID,
      userPass,
      userPicture,
      userBlockedDate,
      otherDetails,
    });
  };

  return (
    <div className="user-entry">
      <h2>User Entry</h2>
      <form onSubmit={handleSubmit}>
        <label>
          User Group:
          <input
            type="text"
            value={userGroup}
            onChange={(e) => setUserGroup(e.target.value)}
            required
          />
        </label>
        <label>
          User Name:
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </label>
        <label>
          User ID:
          <input
            type="text"
            value={userID}
            onChange={(e) => setUserID(e.target.value)}
            required
          />
        </label>
        <label>
          User Pass:
          <input
            type="password"
            value={userPass}
            onChange={(e) => setUserPass(e.target.value)}
            required
          />
        </label>
        <label>
          User Picture:
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {userPicture && <img src={userPicture} alt="User Preview" style={{ width: '100px', height: '100px' }} />}
        </label>
        <label>
          User Blocked Date:
          <input
            type="date"
            value={userBlockedDate}
            onChange={(e) => setUserBlockedDate(e.target.value)}
          />
        </label>
        <label>
          Other Details:
          <textarea
            value={otherDetails}
            onChange={(e) => setOtherDetails(e.target.value)}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

// User Search Component
const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = () => {
    // Implement user search logic here
    console.log('Searching for:', searchTerm);
    // Example search results
    setSearchResults([
      { userID: '123', userName: 'John Doe' },
      { userID: '456', userName: 'Jane Doe' }
    ]);
  };

  return (
    <div className="user-search">
      <h2>User Search</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter User ID or Name"
      />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {searchResults.map((user, index) => (
          <li key={index}>
            {user.userID} - {user.userName}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main Component
const UserMa = () => {
  const [currentPage, setCurrentPage] = useState('entry');

  return (
    <div className="user-ma">
      <nav>
        <button onClick={() => setCurrentPage('entry')}>Entry</button>
        <button onClick={() => setCurrentPage('search')}>Search</button>
      </nav>
      {currentPage === 'entry' && <UserEntry />}
      {currentPage === 'search' && <UserSearch />}
    </div>
  );
};

export default UserMa;
