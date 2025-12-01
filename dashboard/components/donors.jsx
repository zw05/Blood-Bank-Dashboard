import React, { useState, useEffect } from "react";
import { getDonors, addDonor, updateDonor, deleteDonor, getBloodDrives } from "../services/api";
import "../App.css";
import "./donors.css";

function Donors() {
    //state variables
    const [donors, setDonors] = useState([]);
    const [bloodDrives, setBloodDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingDonor, setEditingDonor] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBloodType, setFilterBloodType] = useState("All");
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        blood_type: "A+",
        phone_num: "",
        last_donated_date: "",
        drive_id: ""
    });

    //when the component load, run the fetchDonors()
    useEffect(() => {
        fetchData();
    }, []);

    // calls to the api(backend)
    const fetchData = async () => {
        try {
            setLoading(true);
            const [donorsRes, drivesRes] = await Promise.all([
                getDonors(),
                getBloodDrives()
            ]);
            setDonors(donorsRes.data);
            setBloodDrives(drivesRes.data);
            setError(null);
        } catch (err) {
            setError("Failed to load data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // editing and adding donors
    const handleSubmit = async (e) => {
        e.preventDefault(); //stops the form  refreshing the page and wiping the react states
        try {
            if (editingDonor) {
                await updateDonor(editingDonor.donor_id, formData);
            } else {
                await addDonor(formData);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert("donor save failed: " + (err.response?.data?.message || err.message));
        }
    };

    //deleting a donor
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this donor?")) {
            try {
                await deleteDonor(id);
                fetchData();
            } catch (err) {
                alert("Failed to delete donor");
            }
        }
    };

    //popup window for adding donor
    const openAddModal = () => {
        setEditingDonor(null);
        setFormData({
            first_name: "",
            last_name: "",
            blood_type: "A+",
            phone_num: "",
            last_donated_date: "",
            drive_id: ""
        });
        setShowModal(true);
    };

    //popup window for editing donor
    const openEditModal = (donor) => {
        setEditingDonor(donor);
        setFormData({
            first_name: donor.first_name,
            last_name: donor.last_name,
            blood_type: donor.blood_type,
            phone_num: donor.phone_num,
            last_donated_date: donor.last_donated_date,
            drive_id: donor.drive_id || ""
        });
        setShowModal(true);
    };

    //closing the windows
    const closeModal = () => {
        setShowModal(false);
        setEditingDonor(null);
    };

    // updates the form state whenever the user types in an input box.
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Get blood drive name
    const getDriveName = (driveId) => {
        if (!driveId) return "N/A";
        const drive = bloodDrives.find(d => d.drive_id === driveId);
        return drive ? drive.drive_name : `Drive #${driveId}`;
    };

    // filter donors based on search and blood type, name and id 
    const filteredDonors = donors.filter(donor => {
        const matchesSearch =
            donor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donor.donor_id.toString().includes(searchTerm);

        const matchesBloodType =
            filterBloodType === "All" || donor.blood_type === filterBloodType;

        return matchesSearch && matchesBloodType;
    });

    if (loading) {
        return <div className="loading">Loading donors</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Donors</h2>
                <p>Total Donors: {donors.length}</p>
            </div>

            {error && <div className="error">{error}</div>}

            {/* search bar */}
            <div className="donors-controls">
                <input
                    type="text"
                    placeholder="Search by name or ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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

                <button onClick={openAddModal} className="btn btn-primary">
                    + Add Donor
                </button>
            </div>

            {/* donors Table */}
            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Blood Type</th>
                            <th>Phone</th>
                            <th>Last Donated</th>
                            <th>Blood Drive</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDonors.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-message">
                                    No donors found
                                </td>
                            </tr>
                        ) : (
                            filteredDonors.map((donor) => (
                                <tr key={donor.donor_id}>
                                    <td>#{donor.donor_id}</td>
                                    <td>{donor.first_name} {donor.last_name}</td>
                                    <td>
                                        <span className="badge blood-type-badge">
                                            {donor.blood_type}
                                        </span>
                                    </td>
                                    <td>{donor.phone_num}</td>
                                    <td>{donor.last_donated_date || "Never"}</td>
                                    <td>{getDriveName(donor.drive_id)}</td>
                                    <td>
                                        <button
                                            onClick={() => openEditModal(donor)}
                                            className="btn btn-primary btn-small"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(donor.donor_id)}
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

            {/* add & edit form */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingDonor ? "Edit Donor" : "Add New Donor"}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Blood Type</label>
                                <select
                                    name="blood_type"
                                    value={formData.blood_type}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                >
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone_num"
                                    value={formData.phone_num}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Donated Date</label>
                                <input
                                    type="date"
                                    name="last_donated_date"
                                    value={formData.last_donated_date}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Blood Drive (Optional)</label>
                                <select
                                    name="drive_id"
                                    value={formData.drive_id}
                                    onChange={handleInputChange}
                                    className="form-input"
                                >
                                    <option value="">No Blood Drive</option>
                                    {bloodDrives.map(drive => (
                                        <option key={drive.drive_id} value={drive.drive_id}>
                                            {drive.drive_name} - {drive.last_drive_date}
                                        </option>
                                    ))}
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
                                    {editingDonor ? "Update" : "Add"} Donor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Donors;