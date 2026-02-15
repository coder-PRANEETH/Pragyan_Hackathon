import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

function Profile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    heart_beat: '',
    blood_group: '',
    temperature: ''
  });

  useEffect(() => {
    const userName = searchParams.get('userName');
    if (userName) {
      loadUserData(userName);
    } else {
      // Redirect to dashboard if no username provided
      navigate('/');
    }
  }, [searchParams, navigate]);

  const loadUserData = async (name) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/user-details/${encodeURIComponent(name)}`);

      if (!response.ok) throw new Error('User not found');

      const data = await response.json();
      setUserData(data);

      // Set form data
      const medical = data.medical && data.medical.length > 0 ? data.medical[0] : {};
      setFormData({
        name: data.name || '',
        age: data.age || '',
        gender: data.gender || '',
        heart_beat: medical.heart_beat || '',
        blood_group: medical.blood_group || '',
        temperature: medical.temperature || ''
      });

      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert(`Error loading user data: ${error.message}`);
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Name is required!');
      return;
    }

    const medical = [];
    if (formData.heart_beat || formData.blood_group || formData.temperature) {
      medical.push({
        heart_beat: formData.heart_beat ? parseFloat(formData.heart_beat) : undefined,
        blood_group: formData.blood_group || undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined
      });
    }

    const updateData = {
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
      medical
    };

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5000/update-user/${encodeURIComponent(userData.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Profile updated successfully!');
        setUserData(result.user);
        setIsEditing(false);

        // If name changed, update URL
        if (updateData.name !== userData.name) {
          navigate(`/profile?userName=${encodeURIComponent(updateData.name)}`);
        }
      } else {
        alert(`Error: ${result.message}`);
      }

      setSaving(false);
    } catch (error) {
      alert(`Error updating profile: ${error.message}`);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    const medical = userData?.medical && userData.medical.length > 0 ? userData.medical[0] : {};
    setFormData({
      name: userData?.name || '',
      age: userData?.age || '',
      gender: userData?.gender || '',
      heart_beat: medical.heart_beat || '',
      blood_group: medical.blood_group || '',
      temperature: medical.temperature || ''
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const medical = userData?.medical && userData.medical.length > 0 ? userData.medical[0] : {};

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Profile"
            />
          </div>
          <h1>{userData.name}</h1>
          <p className="profile-id">ID: {userData._id}</p>
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

        <div className="profile-content">
          <div className="section-header">
            <h2>Personal Information</h2>
            {!isEditing ? (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <div className="action-buttons">
                <button className="cancel-btn" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              ) : (
                <p>{userData.name}</p>
              )}
            </div>

            <div className="info-item">
              <label>Age</label>
              {isEditing ? (
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="150"
                />
              ) : (
                <p>{userData.age || 'N/A'}</p>
              )}
            </div>

            <div className="info-item">
              <label>Gender</label>
              {isEditing ? (
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p>{userData.gender || 'N/A'}</p>
              )}
            </div>

            <div className="info-item">
              <label>Member Since</label>
              <p>{new Date(userData.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="section-header">
            <h2>Medical Information</h2>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Heart Rate (bpm)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="heart_beat"
                  value={formData.heart_beat}
                  onChange={handleChange}
                  placeholder="72"
                  min="0"
                />
              ) : (
                <p>{medical.heart_beat || 'N/A'}</p>
              )}
            </div>

            <div className="info-item">
              <label>Blood Group</label>
              {isEditing ? (
                <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              ) : (
                <p>{medical.blood_group || 'N/A'}</p>
              )}
            </div>

            <div className="info-item">
              <label>Temperature (°F)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="98.6"
                  step="0.1"
                  min="0"
                />
              ) : (
                <p>{medical.temperature || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
