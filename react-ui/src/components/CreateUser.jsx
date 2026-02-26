import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateUser.css';

function CreateUser() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    heart_beat: '',
    blood_group: '',
    temperature: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const userData = {
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
      medical
    };

    try {
      setSubmitting(true);

      const response = await fetch('https://pragyan-hackathon.onrender.com/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`User created successfully!\nID: ${result.user._id}`);
        navigate(`/dashboard?userName=${encodeURIComponent(result.user.name)}`);
      } else {
        alert(`Error: ${result.message}`);
      }

    } catch (error) {
      alert(`Server error: ${error.message}`);
    }

    setSubmitting(false);
  };

  return (
    <div className="create-user">
      

      <div className="form-container glass">
        <h2>Create Patient</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input
            type="number"
            name="heart_beat"
            placeholder="Heart Rate (bpm)"
            value={formData.heart_beat}
            onChange={handleChange}
          />

          <select
            name="blood_group"
            value={formData.blood_group}
            onChange={handleChange}
          >
            <option value="">Blood Group</option>
            <option value="A+">A+</option>
            <option value="B+">B+</option>
            <option value="O+">O+</option>
          </select>

          <input
            type="number"
            name="temperature"
            placeholder="Temperature (°F)"
            value={formData.temperature}
            onChange={handleChange}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default CreateUser;
