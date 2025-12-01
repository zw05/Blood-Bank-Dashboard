from datetime import datetime, timedelta
from models import BloodUnitInfoModel, DonorModel, RequestModel, HospitalModel
from database import db
from sqlalchemy import func

#----------functions for blood units -------------#
#we are using December 1st, 2025 for reference

#get units that are nearing expiration 20(default) days prior to today (12/1/2025)
def get_expiring_units(days = 20):
    
    today = datetime(2025, 12, 1).date()
    cutoff_date = today + timedelta(days=days)

    return BloodUnitInfoModel.query.filter(
        BloodUnitInfoModel.expiry_date <= cutoff_date,
        BloodUnitInfoModel.expiry_date >= today,
        BloodUnitInfoModel.unit_status == "Available"
    ).all()


#get all units that expired that are not marked as expired
def get_expired_units():
    today = datetime(2025, 12, 1).date()

    return BloodUnitInfoModel.query.filter(
        BloodUnitInfoModel.expiry_date < today,
        BloodUnitInfoModel.unit_status != "Expired"
    ).all()


#marking all units that has passed the date and returns the # of marked
def mark_expired_units():
    today = datetime(2025, 12, 1).date()
    expired_units = BloodUnitInfoModel.query.filter(
        BloodUnitInfoModel.expiry_date < today,
        BloodUnitInfoModel.unit_status.in_(["Available", "Reserved"])
    ).all()
    
    count = 0
    for unit in expired_units:
        unit.unit_status = "Expired"
        count += 1
    
    db.session.commit()
    return count


#get all the units that have a specific blood type (default status: available)
def get_units_by_blood_type(blood_type, status="Available"):
    return db.session.query(BloodUnitInfoModel).join(
        DonorModel, 
        BloodUnitInfoModel.donor_id == DonorModel.donor_id
    ).filter(
        DonorModel.blood_type == blood_type,
        BloodUnitInfoModel.unit_status == status
    ).all()


#get the inventory of all blood types
def get_inventory_by_blood_type():
    results = db.session.query(
        DonorModel.blood_type,
        func.count(BloodUnitInfoModel.unit_id).label("count")
    ).join(
        BloodUnitInfoModel,
        DonorModel.donor_id == BloodUnitInfoModel.donor_id
    ).filter(
        BloodUnitInfoModel.unit_status == "Available"
    ).group_by(DonorModel.blood_type).all()
    
    # all blood types start with 0
    inventory = {
        "A+": 0, "A-": 0, "B+": 0, "B-": 0,
        "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    }
    
    for blood_type, count in results:
        inventory[blood_type] = count
    
    return inventory
    


#------------------------------------donor functions-----------------------------------#

#get donors by their blood type
def get_donors_by_blood_type(blood_type):
    return DonorModel.query.filter_by(blood_type=blood_type).all()

#get all donors who havent donated from 60 days ago
def get_eligible_donors():
    today = datetime(2025, 12, 1).date()
    cutoff_date = today - timedelta(days=60)
    
    return DonorModel.query.filter(
        (DonorModel.last_donated_date <= cutoff_date) | 
        (DonorModel.last_donated_date == None)
    ).all()

#------------------------------------request functions-----------------------------------#

#get all urgent requests that are pending or processing
def get_urgent_requests():
    return RequestModel.query.filter(
        RequestModel.req_status.in_(["Pending", "Processing"])
    ).all()

#gets the requests based on what status they are at
def get_request_by_status(status):
    return RequestModel.query.filter_by(req_status=status).all()

#-----------------------------------blood drive functions-----------------------------#
#get number of donors from a specific blood drive
def get_donors_by_drive(drive_id):
    count = DonorModel.query.filter_by(drive_id=drive_id).count()
    donors = DonorModel.query.filter_by(drive_id=drive_id).all()
    
    return {
        "drive_id": drive_id,
        "donor_count": count,
        "donors": donors
    }

#-------------------------------analytics-------------------------------------------#

#generating a quick summary of all alerts
def get_summary():
    today = datetime(2025, 12, 1).date()
    
    stats = {
        "system_date": str(today),
        "total_donors": DonorModel.query.count(),
        "eligible_donors": len(get_eligible_donors()),
        "total_hospitals": HospitalModel.query.count(),
        "total_units": BloodUnitInfoModel.query.count(),
        "available_units": BloodUnitInfoModel.query.filter_by(unit_status="Available").count(),
        "expiring_24h": len(get_expiring_units(days=1)),
        "expiring_7days": len(get_expiring_units(days=7)),
        "expired_units": len(get_expired_units()),
        "urgent_requests": len(get_urgent_requests()),
        "pending_requests": RequestModel.query.filter_by(req_status="Pending").count(),
        "completed_requests_today": RequestModel.query.filter(
            RequestModel.completed_date == today
        ).count(),
        "inventory_by_type": get_inventory_by_blood_type()
    }
    
    return stats


#get units that are low on stock (threshold is 5)
def get_low_stock(amount = 5):
    inventory = get_inventory_by_blood_type()
    return {bt: count for bt, count in inventory.items() if count < amount}

    






