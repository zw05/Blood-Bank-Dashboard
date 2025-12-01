// src/components/Inventory.jsx
import React, { useState, useEffect } from 'react';
import {
    getBloodUnits,
    addBloodUnit,
    updateBloodUnit,
    deleteBloodUnit,
    getInventoryByType,
    getExpiringUnits,
    getDonors
} from '../services/api';
import '../App.css';
import './inventory.css';

function Inventory() {
    const [units, setUnits] = useState([]);
    const [donors, setDonors] = useState([]);
    const [inventory, setInventory] = useState({});
    const [expiringUnits, setExpiringUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterBloodType, setFilterBloodType] = useState('All');
    const [searchUnitId, setSearchUnitId] = useState('');

    const [formData, setFormData] = useState({
        donor_id: '',
        donation_date: '',
        expiry_date: '',
        unit_status: 'Available'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [unitsRes, inventoryRes, expiringRes, donorsRes] = await Promise.all([
                getBloodUnits(),
                getInventoryByType(),
                getExpiringUnits(20),
                getDonors()
            ]);

            setUnits(unitsRes.data);
            setInventory(inventoryRes.data);
            setExpiringUnits(expiringRes.data);
            setDonors(donorsRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load inventory');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUnit) {
                await updateBloodUnit(editingUnit.unit_id, formData);
            } else {
                await addBloodUnit(formData);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert('Failed to save blood unit: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this blood unit?')) {
            try {
                await deleteBloodUnit(id);
                fetchData();
            } catch (err) {
                alert('Failed to delete blood unit');
            }
        }
    };

    const handleStatusChange = async (unitId, newStatus) => {
        try {
            await updateBloodUnit(unitId, { unit_status: newStatus });
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const openAddModal = () => {
        setEditingUnit(null);
        setFormData({
            donor_id: '',
            donation_date: '',
            expiry_date: '',
            unit_status: 'Available'
        });
        setShowModal(true);
    };

    const openEditModal = (unit) => {
        setEditingUnit(unit);
        setFormData({
            donor_id: unit.donor_id,
            donation_date: unit.donation_date,
            expiry_date: unit.expiry_date,
            unit_status: unit.unit_status
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUnit(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Get donor blood type
    const getDonorBloodType = (donorId) => {
        const donor = donors.find(d => d.donor_id === donorId);
        return donor ? donor.blood_type : 'Unknown';
    };

    // Calculate days until expiry
    const getDaysUntilExpiry = (expiryDate) => {
        const today = new Date('2025-12-01');
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Get expiry status
    const getExpiryStatus = (expiryDate) => {
        const days = getDaysUntilExpiry(expiryDate);
        if (days < 0) return 'expired';
        if (days <= 1) return 'critical';
        if (days <= 7) return 'warning';
        return 'good';
    };

    // Filter units
    const filteredUnits = units.filter(unit => {
        const matchesStatus = filterStatus === 'All' || unit.unit_status === filterStatus;
        const matchesBloodType = filterBloodType === 'All' || getDonorBloodType(unit.donor_id) === filterBloodType;
        const matchesSearch = searchUnitId === '' || unit.unit_id.toString().includes(searchUnitId);

        return matchesStatus && matchesBloodType && matchesSearch;
    });

    if (loading) {
        return <div className="loading">Loading inventory...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Blood Inventory</h2>
                <p>Total Units: {units.length} | Available: {units.filter(u => u.unit_status === 'Available').length}</p>
            </div>

            {error && <div className="error">{error}</div>}

            {/* Inventory Summary */}
            <div className="alerts-section">
                <h3>Inventory by Blood Type</h3>
                <div className="inventory-grid">
                    {Object.entries(inventory).map(([type, count]) => (
                        <div
                            key={type}
                            className={`blood-type-card ${count < 5 ? 'low-stock' : count < 10 ? 'medium-stock' : 'good-stock'
                                }`}
                        >
                            <div className="type">{type}</div>
                            <div className="count">{count}</div>
                            <div className="label">available</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expiring Soon Alert */}
            {expiringUnits.length > 0 && (
                <div className="alerts-section">
                    <h3>Units Expiring Soon (20 Days)</h3>
                    <div className="alert-item warning">
                        <span><strong>{expiringUnits.length}</strong> units will expire in the next 20 days</span>
                        <span>Review inventory</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="inventory-controls">
                <input
                    type="text"
                    placeholder="Search by Unit ID..."
                    value={searchUnitId}
                    onChange={(e) => setSearchUnitId(e.target.value)}
                    className="search-input"
                />

                <select
                    value={filterBloodType}
                    onChange={(e) => setFilterBloodType(e.target.value)}
                    className="filter-select"
                >
                    <option value="All">All Blood Types</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="All">All Status</option>
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Issued">Issued</option>
                    <option value="Transfused">Transfused</option>
                    <option value="Expired">Expired</option>
                    <option value="Discarded">Discarded</option>
                </select>

                <button onClick={openAddModal} className="btn btn-primary">
                    + Add Blood Unit
                </button>
            </div>

            {/* Units Table */}
            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Unit ID</th>
                            <th>Blood Type</th>
                            <th>Donor ID</th>
                            <th>Donation Date</th>
                            <th>Expiry Date</th>
                            <th>Days Left</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUnits.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-message">
                                    No blood units found
                                </td>
                            </tr>
                        ) : (
                            filteredUnits.map((unit) => {
                                const expiryStatus = getExpiryStatus(unit.expiry_date);
                                const daysLeft = getDaysUntilExpiry(unit.expiry_date);

                                return (
                                    <tr key={unit.unit_id} className={`unit-row ${expiryStatus}`}>
                                        <td>#{unit.unit_id}</td>
                                        <td>
                                            <span className="badge blood-type-badge">
                                                {getDonorBloodType(unit.donor_id)}
                                            </span>
                                        </td>
                                        <td>#{unit.donor_id}</td>
                                        <td>{unit.donation_date}</td>
                                        <td>{unit.expiry_date}</td>
                                        <td>
                                            <span className={`days-left ${daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good'
                                                }`}>
                                                {daysLeft < 0 ? 'EXPIRED' : `${daysLeft} days`}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={unit.unit_status}
                                                onChange={(e) => handleStatusChange(unit.unit_id, e.target.value)}
                                                className={`badge status-select ${unit.unit_status.toLowerCase()}`}
                                            >
                                                <option value="Available">Available</option>
                                                <option value="Reserved">Reserved</option>
                                                <option value="Issued">Issued</option>
                                                <option value="Transfused">Transfused</option>
                                                <option value="Expired">Expired</option>
                                                <option value="Discarded">Discarded</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => openEditModal(unit)}
                                                className="btn btn-primary btn-small"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(unit.unit_id)}
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingUnit ? 'Edit Blood Unit' : 'Add New Blood Unit'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Donor ID</label>
                                <select
                                    name="donor_id"
                                    value={formData.donor_id}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                >
                                    <option value="">Select Donor</option>
                                    {donors.map(donor => (
                                        <option key={donor.donor_id} value={donor.donor_id}>
                                            #{donor.donor_id} - {donor.first_name} {donor.last_name} ({donor.blood_type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Donation Date</label>
                                <input
                                    type="date"
                                    name="donation_date"
                                    value={formData.donation_date}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Unit Status</label>
                                <select
                                    name="unit_status"
                                    value={formData.unit_status}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Reserved">Reserved</option>
                                    <option value="Issued">Issued</option>
                                    <option value="Transfused">Transfused</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Discarded">Discarded</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUnit ? 'Update' : 'Add'} Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Inventory;