import React, { useState, useEffect } from 'react';
import { getBloodDrives, addBloodDrive, updateBloodDrive, deleteBloodDrive, getDonorsByDrive } from '../services/api';
import './blooddrive.css';

function BloodDrive() {
    const [bloodDrives, setBloodDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDonorsModal, setShowDonorsModal] = useState(false);
    const [editingDrive, setEditingDrive] = useState(null);
    const [selectedDriveDonors, setSelectedDriveDonors] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        drive_name: '',
        drive_address: '',
        manager_last_name: '',
        manager_first_name: '',
        phone_num: '',
        last_drive_date: ''
    });

    useEffect(() => {
        fetchBloodDrives();
    }, []);

    const fetchBloodDrives = async () => {
        try {
            setLoading(true);
            const response = await getBloodDrives();
            setBloodDrives(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load blood drives');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDrive) {
                await updateBloodDrive(editingDrive.drive_id, formData);
            } else {
                await addBloodDrive(formData);
            }
            fetchBloodDrives();
            closeModal();
        } catch (err) {
            alert('Failed to save blood drive: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this blood drive?')) {
            try {
                await deleteBloodDrive(id);
                fetchBloodDrives();
            } catch (err) {
                alert('Failed to delete blood drive');
            }
        }
    };

    const handleViewDonors = async (driveId) => {
        try {
            const response = await getDonorsByDrive(driveId);
            setSelectedDriveDonors(response.data);
            setShowDonorsModal(true);
        } catch (err) {
            alert('Failed to load donors for this drive');
        }
    };

    const openAddModal = () => {
        setEditingDrive(null);
        setFormData({
            drive_name: '',
            drive_address: '',
            manager_last_name: '',
            manager_first_name: '',
            phone_num: '',
            last_drive_date: ''
        });
        setShowModal(true);
    };

    const openEditModal = (drive) => {
        setEditingDrive(drive);
        setFormData({
            drive_name: drive.drive_name,
            drive_address: drive.drive_address,
            manager_last_name: drive.manager_last_name,
            manager_first_name: drive.manager_first_name,
            phone_num: drive.phone_num,
            last_drive_date: drive.last_drive_date
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDrive(null);
    };

    const closeDonorsModal = () => {
        setShowDonorsModal(false);
        setSelectedDriveDonors(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const filteredDrives = bloodDrives.filter(drive => {
        const searchLower = searchTerm.toLowerCase();
        return (
            drive.drive_name.toLowerCase().includes(searchLower) ||
            drive.drive_address.toLowerCase().includes(searchLower) ||
            drive.manager_last_name.toLowerCase().includes(searchLower) ||
            drive.manager_first_name.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return <div className="loading">Loading blood drives...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Blood Drives</h2>
                <p>Total Drives: {bloodDrives.length}</p>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="controls-container">
                <input
                    type="text"
                    placeholder="Search by drive name, address, or manager..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <button onClick={openAddModal} className="btn btn-primary">
                    + Add Blood Drive
                </button>
            </div>

            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Drive ID</th>
                            <th>Drive Name</th>
                            <th>Address</th>
                            <th>Manager</th>
                            <th>Phone</th>
                            <th>Last Drive Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDrives.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="no-data">
                                    No blood drives found
                                </td>
                            </tr>
                        ) : (
                            filteredDrives.map((drive) => (
                                <tr key={drive.drive_id}>
                                    <td>#{drive.drive_id}</td>
                                    <td>
                                        <strong>{drive.drive_name}</strong>
                                    </td>
                                    <td>{drive.drive_address}</td>
                                    <td>
                                        {drive.manager_first_name} {drive.manager_last_name}
                                    </td>
                                    <td>{drive.phone_num}</td>
                                    <td>{drive.last_drive_date}</td>
                                    <td>
                                        <button
                                            onClick={() => handleViewDonors(drive.drive_id)}
                                            className="btn btn-success btn-small"
                                        >
                                            View Donors
                                        </button>
                                        <button
                                            onClick={() => openEditModal(drive)}
                                            className="btn btn-primary btn-small"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(drive.drive_id)}
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingDrive ? 'Edit Blood Drive' : 'Add New Blood Drive'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Drive Name</label>
                                <input
                                    type="text"
                                    name="drive_name"
                                    value={formData.drive_name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Downtown Blood Drive"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    name="drive_address"
                                    value={formData.drive_address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., 123 Main Street, New York, NY 10001"
                                    rows="3"
                                    className="form-textarea"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Manager First Name</label>
                                    <input
                                        type="text"
                                        name="manager_first_name"
                                        value={formData.manager_first_name}
                                        onChange={handleInputChange}
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Manager Last Name</label>
                                    <input
                                        type="text"
                                        name="manager_last_name"
                                        value={formData.manager_last_name}
                                        onChange={handleInputChange}
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone_num"
                                    value={formData.phone_num}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="555-123-4567"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Drive Date</label>
                                <input
                                    type="date"
                                    name="last_drive_date"
                                    value={formData.last_drive_date}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
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
                                    {editingDrive ? '✓ Update' : '+ Add'} Blood Drive
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Donors Modal */}
            {showDonorsModal && selectedDriveDonors && (
                <div className="modal-overlay">
                    <div className="modal-content donors-modal">
                        <h3>Donors from Drive #{selectedDriveDonors.drive_id}</h3>
                        <p className="donor-count">Total Donors: {selectedDriveDonors.donor_count}</p>

                        {selectedDriveDonors.donor_count > 0 ? (
                            <div className="donors-list">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Donor ID</th>
                                            <th>Name</th>
                                            <th>Blood Type</th>
                                            <th>Phone</th>
                                            <th>Last Donated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedDriveDonors.donors.map((donor) => (
                                            <tr key={donor.donor_id}>
                                                <td>#{donor.donor_id}</td>
                                                <td>{donor.first_name} {donor.last_name}</td>
                                                <td>
                                                    <span className="badge blood-type-badge">
                                                        {donor.blood_type}
                                                    </span>
                                                </td>
                                                <td>{donor.phone_num}</td>
                                                <td>{donor.last_donated_date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-donors">No donors found for this drive</p>
                        )}

                        <div className="form-actions">
                            <button
                                onClick={closeDonorsModal}
                                className="btn btn-primary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BloodDrive;