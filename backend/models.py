from database import db
from sqlalchemy import Integer, String, Date, Enum

class DonorModel(db.Model):
    __tablename__ = 'donors'
    
    donor_id = db.Column(Integer, primary_key=True)
    first_name = db.Column(String(50))
    last_name = db.Column(String(50))
    blood_type = db.Column(String(5))
    phone_num = db.Column(String(20))
    last_donated_date = db.Column(Date)
    drive_id = db.Column(String(50))
    
    def to_dict(self):
        return {
            'donor_id': self.donor_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'blood_type': self.blood_type,
            'phone_num': self.phone_num,
            'last_donated_date': str(self.last_donated_date) if self.last_donated_date else None,
            'drive_id': self.drive_id
        }

class HospitalModel(db.Model):
    __tablename__ = 'hospitals'
    
    hospital_id = db.Column(Integer, primary_key=True)
    hospital_name = db.Column(String(100))
    address = db.Column(String(200))
    
    def to_dict(self):
        return {
            'hospital_id': self.hospital_id,
            'hospital_name': self.hospital_name,
            'address': self.address
        }

class BloodUnitInfoModel(db.Model):
    __tablename__ = 'bloodunit_info'
    
    unit_id = db.Column(Integer, primary_key=True)
    donor_id = db.Column(Integer)
    donation_date = db.Column(Date)
    expiry_date = db.Column(Date)
    unit_status = db.Column(String(20))
    
    def to_dict(self):
        return {
            'unit_id': self.unit_id,
            'donor_id': self.donor_id,
            'donation_date': str(self.donation_date) if self.donation_date else None,
            'expiry_date': str(self.expiry_date) if self.expiry_date else None,
            'unit_status': self.unit_status
        }

class RequestModel(db.Model):
    __tablename__ = 'requests'
    
    request_id = db.Column(Integer, primary_key=True)
    hospital_id = db.Column(Integer)
    unit_id = db.Column(Integer)
    request_date = db.Column(Date)
    req_status = db.Column(String(20))
    completed_date = db.Column(Date, nullable=True)
    
    def to_dict(self):
        return {
            'request_id': self.request_id,
            'hospital_id': self.hospital_id,
            'unit_id': self.unit_id,
            'request_date': str(self.request_date) if self.request_date else None,
            'req_status': self.req_status,
            'completed_date': self.completed_date
        }
    
class BloodDriveModel(db.Model):
    __tablename__ = 'blooddrive'

    drive_id = db.Column(Integer, primary_key=True)
    drive_name = db.Column(String(20))
    drive_address = db.Column(String(200))
    manager_last_name = db.Column(String(20))
    manager_first_name = db.Column(String(20))
    phone_num = db.Column(String(20))
    last_drive_date = db.Column(Date)

    def to_dict(self):
        return{
            'drive_id': self.drive_id,
            'drive_name': self.drive_name,
            'drive_address': self.drive_address,
            'manager_last_name': self.manager_last_name,
            'manager_first_name': self.manager_first_name,
            'phone_num': self.phone_num,
            'last_drive_date': self.last_drive_date
        }
    
    

