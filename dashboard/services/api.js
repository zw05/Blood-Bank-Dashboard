import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    if (['post', 'put', 'patch'].includes(config.method)) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
});

//  donors 
export const getDonors = () => api.get("/donors/");
export const getDonor = (id) => api.get(`/donors/${id}`);
export const addDonor = (donorData) => api.post("/donors/", donorData);
export const updateDonor = (id, donorData) => api.patch(`/donors/${id}`, donorData);
export const deleteDonor = (id) => api.delete(`/donors/${id}`);

// hospitals 
export const getHospitals = () => api.get("/hospitals/");
export const getHospital = (id) => api.get(`/hospitals/${id}`);
export const addHospital = (hospitalData) => api.post("/hospitals/", hospitalData);
export const updateHospital = (id, hospitalData) => api.patch(`/hospitals/${id}`, hospitalData);
export const deleteHospital = (id) => api.delete(`/hospitals/${id}`);

// blood units 
export const getBloodUnits = () => api.get("/bloodunits/");
export const getBloodUnit = (id) => api.get(`/bloodunits/${id}`);
export const addBloodUnit = (unitData) => api.post("/bloodunits/", unitData);
export const updateBloodUnit = (id, unitData) => api.patch(`/bloodunits/${id}`, unitData);
export const deleteBloodUnit = (id) => api.delete(`/bloodunits/${id}`);

// requests 
export const getRequests = () => api.get("/requests/");
export const getRequest = (id) => api.get(`/requests/${id}`);
export const addRequest = (requestData) => api.post("/requests/", requestData);
export const updateRequest = (id, requestData) => api.patch(`/requests/${id}`, requestData);
export const deleteRequest = (id) => api.delete(`/requests/${id}`);

// blood drive
// blood drive
export const getBloodDrives = () => api.get('/blooddrives/');
export const getBloodDrive = (id) => api.get(`/blooddrives/${id}`);
export const addBloodDrive = (data) => api.post('/blooddrives/', data);
export const updateBloodDrive = (id, data) => api.patch(`/blooddrives/${id}`, data);
export const deleteBloodDrive = (id) => api.delete(`/blooddrives/${id}`);
export const getDonorsByDrive = (driveId) => api.get(`/function/donors-by-drive?drive_id=${driveId}`);

// functions 
export const getDashboardSummary = () => api.get("/function/summary");
export const getExpiringUnits = (days = 20) => api.get(`/function/expiring?days=${days}`);
export const getExpiredUnits = () => api.get("/function/expired");
export const markExpiredUnits = () => api.post("/function/mark-expired");
export const getInventoryByType = () => api.get("/function/inventory");
export const getUnitsByBloodType = (bloodType, status = "Available") =>
    api.get(`/function/units-by-type?blood_type=${bloodType}&status=${status}`);
export const getDonorsByBloodType = (bloodType) =>
    api.get(`/function/donors-by-type?blood_type=${bloodType}`);
export const getEligibleDonors = () => api.get("/function/eligible-donors");
export const getUrgentRequests = () => api.get("/function/urgent-requests");
export const getRequestsByStatus = (status) =>
    api.get(`/function/requests-by-status?status=${status}`);
export const getLowStockAlerts = (amount = 5) =>
    api.get(`/function/low-stock?amount=${amount}`);

export default api;