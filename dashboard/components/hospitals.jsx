// src/components/Hospitals.jsx
import React, { useState, useEffect } from 'react';
import { getHospitals, addHospital, updateHospital, deleteHospital } from '../services/api';
import './hospitals.css';

function Hospitals() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        hospital_name: '',
        address: ''
    });

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            setLoading(true);
            const response = await getHospitals();
            setHospitals(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load hospitals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHospital) {
                await updateHospital(editingHospital.hospital_id, formData);
            } else {
                await addHospital(formData);
            }
            fetchHospitals();
            closeModal();
        } catch (err) {
            alert('Failed to save hospital: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this hospital?')) {
            try {
                await deleteHospital(id);
                fetchHospitals();
            } catch (err) {
                alert('Failed to delete hospital');
            }
        }
    };

    const openAddModal = () => {
        setEditingHospital(null);
        setFormData({
            hospital_name: '',
            address: ''
        });
        setShowModal(true);
    };

    const openEditModal = (hospital) => {
        setEditingHospital(hospital);
        setFormData({
            hospital_name: hospital.hospital_name,
            address: hospital.address
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingHospital(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const filteredHospitals = hospitals.filter(hospital => {
        const searchLower = searchTerm.toLowerCase();
        return (
            hospital.hospital_name.toLowerCase().includes(searchLower) ||
            hospital.address.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return <div className="loading">Loading hospitals</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Hospitals</h2>
                <p>Total Hospitals: {hospitals.length}</p>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="controls-container">
                <input
                    type="text"
                    placeholder="Search by name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <button onClick={openAddModal} className="btn btn-primary">
                    + Add Hospital
                </button>
            </div>

            <div className="data-table">
                <h3 className="table-header">Hospitals</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hospital Name</th>
                            <th>Address</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHospitals.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="no-data">
                                    No hospitals found
                                </td>
                            </tr>
                        ) : (
                            filteredHospitals.map((hospital) => (
                                <tr key={hospital.hospital_id}>
                                    <td>#{hospital.hospital_id}</td>
                                    <td>
                                        <strong>{hospital.hospital_name}</strong>
                                    </td>
                                    <td>{hospital.address}</td>
                                    <td>
                                        <button
                                            onClick={() => openEditModal(hospital)}
                                            className="btn btn-primary btn-small"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(hospital.hospital_id)}
                                            className="btn btn-danger btn-small"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingHospital ? 'Edit Hospital' : 'Add New Hospital'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Hospital Name</label>
                                <input
                                    type="text"
                                    name="hospital_name"
                                    value={formData.hospital_name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., St. Mary's Hospital"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., 123 Main Street, New York, NY 10001"
                                    rows="3"
                                    className="form-textarea"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingHospital ? '✓ Update' : '+ Add'} Hospital
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Hospitals;