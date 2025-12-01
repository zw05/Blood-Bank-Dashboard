import React, { useState, useEffect } from 'react';
import { getDashboardSummary, getExpiringUnits, getLowStockAlerts } from '../services/api';

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [expiringUnits, setExpiringUnits] = useState([]);
    const [lowStock, setLowStock] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, expiringRes, lowStockRes] = await Promise.all([
                getDashboardSummary(),
                getExpiringUnits(7),
                getLowStockAlerts(5)
            ]);

            setSummary(summaryRes.data);
            setExpiringUnits(expiringRes.data);
            setLowStock(lowStockRes.data);
            setError(null);
        } catch (err) {
            setError("unavailable");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>System Date: {summary?.system_date}</p>
            </div>

            {/* stats grid */}
            <div className="stats-grid">
                <div className="stat-card info">
                    <h3>Total Donors</h3>
                    <div className="value">{summary?.total_donors || 0}</div>
                </div>

                <div className="stat-card success">
                    <h3>Eligible Donors (Last seen at least 60 days before)</h3>
                    <div className="value">{summary?.eligible_donors || 0}</div>
                </div>

                <div className="stat-card info">
                    <h3>Available Units</h3>
                    <div className="value">{summary?.available_units || 0}</div>
                </div>

                <div className="stat-card warning">
                    <h3>Expiring (Within 7 Days)</h3>
                    <div className="value">{summary?.expiring_7days || 0}</div>
                </div>

                <div className="stat-card alert">
                    <h3>Expired Units</h3>
                    <div className="value">{summary?.expired_units || 0}</div>
                </div>

                <div className="stat-card alert">
                    <h3>Urgent Requests</h3>
                    <div className="value">{summary?.urgent_requests || 0}</div>
                </div>

                <div className="stat-card success">
                    <h3>Request Completed Today</h3>
                    <div className="value">{summary?.completed_requests_today || 0}</div>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="alerts-section">
                <h3>Alerts</h3>

                {summary?.expired_units > 0 && (
                    <div className="alert-item critical">
                        <span><strong>{summary.expired_units}</strong> units have expired</span>
                        <span>Action required</span>
                    </div>
                )}

                {summary?.expiring_24h > 0 && (
                    <div className="alert-item critical">
                        <span><strong>{summary.expiring_24h}</strong> units expiring within 24 hours</span>
                        <span>Critical</span>
                    </div>
                )}

                {summary?.expiring_7days > 0 && (
                    <div className="alert-item warning">
                        <span><strong>{summary.expiring_7days}</strong> units expiring within 7 days</span>
                        <span>Warning</span>
                    </div>
                )}

                {Object.keys(lowStock).length > 0 && (
                    <div className="alert-item warning">
                        <span>
                            <strong>Low Stock Units:</strong> {Object.keys(lowStock).join(', ')}
                        </span>
                        <span>Restock needed</span>
                    </div>
                )}

                {summary?.urgent_requests > 0 && (
                    <div className="alert-item info">
                        <span><strong>{summary.urgent_requests}</strong> urgent requests pending</span>
                        <span>Review needed</span>
                    </div>
                )}
            </div>

            {/* blood inventory blood  */}
            {/* <div className="alerts-section">
                <h3>Blood Inventory</h3>
                <div className="inventory-grid">
                    {summary?.inventory_by_type && Object.entries(summary.inventory_by_type).map(([type, count]) => (
                        <div
                            key={type}
                            className="blood-type-card"
                            style={{
                                borderLeft: count < 5 ? '4px solid #e74c3c' : count < 10 ? '4px solid #f8b13eff' : '4px solid #27ae60'
                            }}
                        >
                            <div className="type">{type}</div>
                            <div className="count">{count}</div>
                            <div className="label">units</div>
                        </div>
                    ))}
                </div>
            </div> */}

            {/* expiring table */}
            {expiringUnits.length > 0 && (
                <div className="data-table">
                    <h3 style={{ padding: '15px', margin: 0 }}>Units Expiring Soon (7 Days)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Unit ID</th>
                                <th>Donor ID</th>
                                <th>Donation Date</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expiringUnits.slice(0, 10).map((unit) => (
                                <tr key={unit.unit_id}>
                                    <td>#{unit.unit_id}</td>
                                    <td>#{unit.donor_id}</td>
                                    <td>{unit.donation_date}</td>
                                    <td>{unit.expiry_date}</td>
                                    <td>
                                        <span className={`badge ${unit.unit_status.toLowerCase()}`}>
                                            {unit.unit_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Dashboard;