// src/components/Requests.jsx
import React, { useState, useEffect } from 'react';
import {
    getRequests,
    addRequest,
    updateRequest,
    deleteRequest,
    getHospitals,
    getBloodUnits,
    getDonors,
    getUrgentRequests
} from '../services/api';
import './requests.css';

function Requests() {
    const [requests, setRequests] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [bloodUnits, setBloodUnits] = useState([]);
    const [donors, setDonors] = useState([]);
    const [urgentRequests, setUrgentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);

    const [filterStatus, setFilterStatus] = useState('All');
    const [filterHospital, setFilterHospital] = useState('All');
    const [searchId, setSearchId] = useState('');

    const [formData, setFormData] = useState({
        hospital_id: '',
        unit_id: '',
        request_date: '',
        req_status: 'Pending',
        completed_date: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [requestsRes, hospitalsRes, unitsRes, donorsRes, urgentRes] = await Promise.all([
                getRequests(),
                getHospitals(),
                getBloodUnits(),
                getDonors(),
                getUrgentRequests()
            ]);

            setRequests(requestsRes.data);
            setHospitals(hospitalsRes.data);
            setBloodUnits(unitsRes.data);
            setDonors(donorsRes.data);
            setUrgentRequests(urgentRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load requests');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRequest) {
                await updateRequest(editingRequest.request_id, formData);
            } else {
                await addRequest(formData);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert('Failed to save request: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this request?')) {
            try {
                await deleteRequest(id);
                fetchData();
            } catch (err) {
                alert('Failed to delete request');
            }
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            const request = requests.find(r => r.request_id === requestId);
            const updateData = {
                hospital_id: request.hospital_id,
                unit_id: request.unit_id,
                request_date: request.request_date,
                req_status: newStatus,
                completed_date: newStatus === 'Completed' ? '2025-12-01' : request.completed_date
            };
            await updateRequest(requestId, updateData);
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const openAddModal = () => {
        setEditingRequest(null);
        setFormData({
            hospital_id: '',
            unit_id: '',
            request_date: '2025-12-01',
            req_status: 'Pending',
            completed_date: ''
        });
        setShowModal(true);
    };

    const openEditModal = (request) => {
        setEditingRequest(request);
        setFormData({
            hospital_id: request.hospital_id,
            unit_id: request.unit_id,
            request_date: request.request_date,
            req_status: request.req_status,
            completed_date: request.completed_date || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingRequest(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getHospitalName = (hospitalId) => {
        const hospital = hospitals.find(h => h.hospital_id === hospitalId);
        return hospital ? hospital.hospital_name : `Hospital #${hospitalId}`;
    };

    const getUnitInfo = (unitId) => {
        const unit = bloodUnits.find(u => u.unit_id === unitId);
        if (!unit) return { bloodType: 'Unknown', status: 'Unknown' };

        const donor = donors.find(d => d.donor_id === unit.donor_id);
        return {
            bloodType: donor ? donor.blood_type : 'Unknown',
            status: unit.unit_status
        };
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': '#f39c12',
            'Processing': '#3498db',
            'Approved': '#27ae60',
            'Transit': '#9b59b6',
            'Completed': '#27ae60',
            'Cancelled': '#e74c3c'
        };
        return colors[status] || '#95a5a6';
    };

    const filteredRequests = requests.filter(request => {
        const matchesStatus = filterStatus === 'All' || request.req_status === filterStatus;
        const matchesHospital = filterHospital === 'All' || request.hospital_id.toString() === filterHospital;
        const matchesSearch = searchId === '' ||
            request.request_id.toString().includes(searchId) ||
            request.unit_id.toString().includes(searchId);

        return matchesStatus && matchesHospital && matchesSearch;
    });

    const availableUnits = bloodUnits.filter(u => u.unit_status === 'Available');

    if (loading) {
        return <div className="loading">Loading requests...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Blood Requests</h2>
                <p>Total Requests: {requests.length} | Urgent: {urgentRequests.length}</p>
            </div>

            {error && <div className="error">{error}</div>}

            {urgentRequests.length > 0 && (
                <div className="alerts-section">
                    <h3>Urgent Requests</h3>
                    <div className="alert-item critical">
                        <span>
                            <strong>{urgentRequests.length}</strong> urgent requests require immediate attention
                        </span>
                        <span>Action needed</span>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card warning">
                    <h3>Pending</h3>
                    <div className="value">{requests.filter(r => r.req_status === 'Pending').length}</div>
                </div>
                <div className="stat-card info">
                    <h3>Processing</h3>
                    <div className="value">{requests.filter(r => r.req_status === 'Processing').length}</div>
                </div>
                <div className="stat-card info">
                    <h3>In Transit</h3>
                    <div className="value">{requests.filter(r => r.req_status === 'Transit').length}</div>
                </div>
                <div className="stat-card success">
                    <h3>Completed</h3>
                    <div className="value">{requests.filter(r => r.req_status === 'Completed').length}</div>
                </div>
            </div>

            <div className="controls-container">
                <input
                    type="text"
                    placeholder="Search by Request ID or Unit ID..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="search-input"
                />

                <select
                    value={filterHospital}
                    onChange={(e) => setFilterHospital(e.target.value)}
                    className="filter-select"
                >
                    <option value="All">All Hospitals</option>
                    {hospitals.map(hospital => (
                        <option key={hospital.hospital_id} value={hospital.hospital_id}>
                            {hospital.hospital_name}
                        </option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Approved">Approved</option>
                    <option value="Transit">In Transit</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>

                <button onClick={openAddModal} className="btn btn-primary">
                    + New Request
                </button>
            </div>

            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Hospital</th>
                            <th>Unit ID</th>
                            <th>Blood Type</th>
                            <th>Request Date</th>
                            <th>Status</th>
                            <th>Completed Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    No requests found
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => {
                                const unitInfo = getUnitInfo(request.unit_id);
                                const isUrgent = request.req_status === 'Pending' || request.req_status === 'Processing';

                                return (
                                    <tr
                                        key={request.request_id}
                                        className={isUrgent ? 'urgent-row' : ''}
                                    >
                                        <td>
                                            <strong>#{request.request_id}</strong>
                                        </td>
                                        <td>{getHospitalName(request.hospital_id)}</td>
                                        <td>#{request.unit_id}</td>
                                        <td>
                                            <span className="badge blood-type-badge">
                                                {unitInfo.bloodType}
                                            </span>
                                        </td>
                                        <td>{request.request_date}</td>
                                        <td>
                                            <select
                                                value={request.req_status}
                                                onChange={(e) => handleStatusChange(request.request_id, e.target.value)}
                                                className="status-select"
                                                style={{ backgroundColor: getStatusColor(request.req_status) }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Transit">Transit</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td>{request.completed_date || '-'}</td>
                                        <td>
                                            <button
                                                onClick={() => openEditModal(request)}
                                                className="btn btn-primary btn-small"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(request.request_id)}
                                                className="btn btn-danger btn-small"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingRequest ? 'Edit Request' : 'Create New Request'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Hospital</label>
                                <select
                                    name="hospital_id"
                                    value={formData.hospital_id}
                                    onChange={handleInputChange}
                                    required
                                    className="form-select"
                                >
                                    <option value="">Select Hospital</option>
                                    {hospitals.map(hospital => (
                                        <option key={hospital.hospital_id} value={hospital.hospital_id}>
                                            {hospital.hospital_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    Blood Unit {!editingRequest && `(${availableUnits.length} available)`}
                                </label>
                                <select
                                    name="unit_id"
                                    value={formData.unit_id}
                                    onChange={handleInputChange}
                                    required
                                    className="form-select"
                                >
                                    <option value="">Select Blood Unit</option>
                                    {(editingRequest ? bloodUnits : availableUnits).map(unit => {
                                        const donor = donors.find(d => d.donor_id === unit.donor_id);
                                        return (
                                            <option key={unit.unit_id} value={unit.unit_id}>
                                                Unit #{unit.unit_id} - {donor?.blood_type || 'Unknown'} ({unit.unit_status})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Request Date</label>
                                <input
                                    type="date"
                                    name="request_date"
                                    value={formData.request_date}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="req_status"
                                    value={formData.req_status}
                                    onChange={handleInputChange}
                                    required
                                    className="form-select"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Transit">In Transit</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {formData.req_status === 'Completed' && (
                                <div className="form-group">
                                    <label>Completed Date</label>
                                    <input
                                        type="date"
                                        name="completed_date"
                                        value={formData.completed_date}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRequest ? '✓ Update' : '+ Create'} Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Requests;