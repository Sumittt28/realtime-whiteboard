import React from 'react';
import './UserList.css';

const UserList = ({ users }) => {
  return (
    <div className="user-list">
      <h3>Active Users ({users.length})</h3>
      <div className="user-items">
        {users.map(user => (
          <div key={user.id} className="user-item">
            <span 
              className="user-color" 
              style={{ backgroundColor: user.color }}
            />
            <span className="user-id">User #{user.id.slice(0, 6)}</span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="no-users">No other users online</p>
        )}
      </div>
    </div>
  );
};

export default UserList;
