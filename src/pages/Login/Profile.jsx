const ProfilePage = () => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    return <div className="profile-loading">No user data found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card modern-card">

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user.user_name?.charAt(0)?.toUpperCase() ||
              user.user_id?.charAt(0)?.toUpperCase()}
          </div>

          <div className="profile-header-info">
            <h2>{user.user_name}</h2>
            <p className="profile-role">{user.role}</p>
            <span className="profile-company">{user.company}</span>
          </div>
        </div>

        <div className="profile-divider" />

        {/* Details */}
        <div className="profile-section">
          <ProfileRow label="User ID" value={user.user_id} />
          <ProfileRow label="User Master ID" value={user.userma_id} />
          <ProfileRow label="Role" value={user.role} />
          <ProfileRow label="Company Code" value={user.com_code} />
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }) => (
  <div className="profile-row">
    <div className="profile-label">{label}</div>
    <div className="profile-value">{value || "-"}</div>
  </div>
);

export default ProfilePage;
