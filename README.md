# Blood Bank Management System

A full-stack web application for managing blood bank operations, including donor management, inventory tracking, hospital requests, and blood drive coordination.

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **MySQL** (v8.0 or higher)

## Installation & Setup

### 1. Database Setup

1. Open MySQL and create the database:
   ```sql
   CREATE DATABASE blood_bank;
   ```

2. Run the schema creation script:
   ```sql
   SOURCE path/to/schema.sql;
   ```

3. Run the data population script:
   ```sql
   SOURCE path/to/data_population.sql;
   ```

### 2. Backend Setup (Flask)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Mac/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install Python dependencies:
   ```bash
   pip install flask flask-cors flask-restful flask-sqlalchemy pymysql python-dotenv
   ```

5. Create a `.env` file in the backend directory with your database credentials:
   ```
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   DB_NAME=blood_bank
   DB_PORT=3306
   ```

6. Start the Flask server:
   ```bash
   python api.py
   ```
   
   The backend server will run on `http://localhost:5000`

### 3. Frontend Setup (React)

1. Navigate to the frontend directory:
   ```bash
   cd dashboard
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   
   The application will open automatically in your browser at `http://localhost:3000`

## Running the Application

1. **Start the Backend (Terminal 1):**
   ```bash
   cd backend
   python api.py
   ```

2. **Start the Frontend (Terminal 2):**
   ```bash
   cd dashboard
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Features

- **Dashboard** - Overview of blood bank statistics and alerts
- **Donors** - Manage donor information and track donation history
- **Inventory** - Track blood units, expiration dates, and availability
- **Hospitals** - Manage hospital information and requests
- **Requests** - Process and track blood unit requests
- **Blood Drives** - Organize and manage blood donation events

## Default System Date

The system is configured to use **December 1, 2025** as the reference date for testing purposes.

## Troubleshooting

- If you get a database connection error, verify your `.env` file has the correct credentials
- If the frontend can't connect to the backend, ensure the Flask server is running on port 5000
- Clear your browser cache if you encounter any display issues

## Technology Stack

**Frontend:**
- React.js
- React Router
- Axios

**Backend:**
- Flask
- Flask-RESTful
- SQLAlchemy
- MySQL

---
