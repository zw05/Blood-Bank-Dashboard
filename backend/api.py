from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_restful import Resource, Api, marshal_with, reqparse, fields, abort
from database import db
import os
from functions import (
    get_expiring_units, 
    get_expired_units, 
    mark_expired_units,
    get_units_by_blood_type,
    get_inventory_by_blood_type,
    get_donors_by_blood_type,
    get_eligible_donors,
    get_urgent_requests,
    get_request_by_status,
    get_summary,
    get_low_stock,
    get_donors_by_drive
)

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False 

db.init_app(app)
api = Api(app)

from models import DonorModel, HospitalModel, BloodUnitInfoModel, RequestModel, BloodDriveModel

#json format fields

donor_fields = {
    "donor_id": fields.Integer,
    "first_name": fields.String,
    "last_name": fields.String,
    "blood_type": fields.String,
    "phone_num": fields.String,
    "last_donated_date": fields.String,
    "drive_id": fields.Integer
}

hospital_fields = {
    "hospital_id": fields.Integer,
    "hospital_name": fields.String,
    "address": fields.String
}

bloodunit_fields = {
    "unit_id": fields.Integer,
    "donor_id": fields.Integer,
    "donation_date": fields.String,
    "expiry_date": fields.String,
    "unit_status": fields.String
}

request_fields = {
    "request_id": fields.Integer,
    "hospital_id": fields.Integer,
    "unit_id": fields.Integer,
    "request_date": fields.String,
    "req_status": fields.String,
    "completed_date": fields.String
}

blooddrive_fields = {
    "drive_id": fields.Integer,
    "drive_name": fields.String,
    "drive_address": fields.String,
    "manager_last_name": fields.String,
    "manager_first_name": fields.String,
    "phone_num": fields.String,
    "last_drive_date": fields.String
}

#request parsers: request parser validates and extracts data from incoming HTTP requests
donor_args = reqparse.RequestParser()
donor_args.add_argument("first_name", type=str, required=True, help="First name cannot be blank")
donor_args.add_argument("last_name", type=str, required=True, help="Last name cannot be blank")
donor_args.add_argument("blood_type", type=str, required=True, 
                       choices=["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                       help='Invalid blood type, must be one of: "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"')
donor_args.add_argument("phone_num", type=str, required=True, help="Phone number cannot be blank")
donor_args.add_argument("last_donated_date", type=str, required=True, help="Date required (YYYY-MM-DD)")
donor_args.add_argument("drive_id", type=int, required=False, help="Blood drive ID")
donor_args.add_argument("drive_id", type=int, required=False, help="Blood drive ID")

hospital_args = reqparse.RequestParser()
hospital_args.add_argument("hospital_name", type=str, required=True, help="Hospital name cannot be blank")
hospital_args.add_argument("address", type=str, required=True, help="Address cannot be blank")

bloodunit_args = reqparse.RequestParser()
bloodunit_args.add_argument("donor_id", type=int, required=False)
bloodunit_args.add_argument("donation_date", type=str, required=True, help="Donation date required")
bloodunit_args.add_argument("expiry_date", type=str, required=True, help="Expiry date required")
bloodunit_args.add_argument("unit_status", type=str, required=True,
                           choices=["Available", "Reserved", "Issued", "Transfused", "Expired", "Discarded"],
                           help='Invalid status, must be one of: "Available", "Reserved", "Issued", "Transfused", "Expired", "Discarded"')

request_args = reqparse.RequestParser()
request_args.add_argument("hospital_id", type=int, required=True)
request_args.add_argument("unit_id", type=int, required=True)
request_args.add_argument("request_date", type=str, required=True, help="Request date required (YYYY-MM-DD)")
request_args.add_argument("req_status", type=str, required=True,
                         choices=["Approved", "Pending", "Processing", "Transit", "Completed", "Cancelled"],
                         help="Invalid status")
request_args.add_argument("completed_date", type=str, required=False, help="Completion Date: (YYYY-MM-DD)")

blooddrive_args = reqparse.RequestParser()
blooddrive_args.add_argument("drive_name", type=str, required=True, help="Drive name cannot be blank")
blooddrive_args.add_argument("drive_address", type=str, required=True, help="Drive address cannot be blank")
blooddrive_args.add_argument("manager_last_name", type=str, required=True, help="Manager last name cannot be blank")
blooddrive_args.add_argument("manager_first_name", type=str, required=True, help="Manager first name cannot be blank")
blooddrive_args.add_argument("phone_num", type=str, required=True, help="Phone number cannot be blank")
blooddrive_args.add_argument("last_drive_date", type=str, required=True, help="Last drive date required (YYYY-MM-DD)")

# resources: class that represents a specific endpoint in your API. 
# It groups together all the HTTP methods (GET, POST, PUT, DELETE) for a particular type of data.
#----------------------------------------------------donors----------------------------------------#
class Donors(Resource):
    #get all donors
    @marshal_with(donor_fields)
    def get(self):
        donors = DonorModel.query.all()
        return donors
    
    #add a new donor
    @marshal_with(donor_fields)
    def post(self):
        args = donor_args.parse_args()
        donor = DonorModel(
            first_name=args["first_name"], 
            last_name=args["last_name"], 
            blood_type=args["blood_type"],
            phone_num=args["phone_num"],
            last_donated_date=args["last_donated_date"],
            drive_id=args["drive_id"]
        )
        db.session.add(donor)
        db.session.commit()

        donors = DonorModel.query.all()
        return donors, 201

class Donor(Resource):
    #get donor based on id
    @marshal_with(donor_fields)
    def get(self, id):
        donor = DonorModel.query.filter_by(donor_id=id).first()
        if not donor:
            abort(404, "Donor not found")
        return donor
    
    #edit a donor's detail with their id
    @marshal_with(donor_fields)
    def patch(self, id):
        args = donor_args.parse_args()
        donor = DonorModel.query.filter_by(donor_id=id).first()
        if not donor:
            abort(404, "Donor not found")
        donor.first_name = args["first_name"]
        donor.last_name = args["last_name"]
        donor.blood_type = args["blood_type"]
        donor.phone_num = args["phone_num"]
        donor.last_donated_date = args["last_donated_date"]
        donor.drive_id = args["drive_id"]

        db.session.commit()
        return donor
    
    #delete a donor with id, and returns all donors
    @marshal_with(donor_fields)
    def delete(self, id):
        donor = DonorModel.query.filter_by(donor_id=id).first()
        if not donor:
            abort(404, "Donor not found")
        db.session.delete(donor)
        db.session.commit()

        donors = DonorModel.query.all()
        return donors, 201

#----------------------------------------------hospitals-------------------------------------------#
class Hospitals(Resource):
    #get all hospitals
    @marshal_with(hospital_fields) 
    def get(self):
        hospitals = HospitalModel.query.all()
        return hospitals
    
    #add a new hospital
    @marshal_with(hospital_fields)
    def post(self):
        args = hospital_args.parse_args()
        hospital = HospitalModel(hospital_name = args["hospital_name"],
                                 address = args["address"])
        db.session.add(hospital)
        db.session.commit()

        hospitals = HospitalModel.query.all()
        return hospitals, 201 
    
class Hospital(Resource):
    #get a single hospital by id
    @marshal_with(hospital_fields)
    def get(self, id):
        hospital = HospitalModel.query.filter_by(hospital_id = id).first()
        if not hospital:
            abort(404, "Hospital not found")
        return hospital
    
    #edit a hospital's detail with their id
    @marshal_with(hospital_fields)
    def patch(self, id):
        args = hospital_args.parse_args()
        hospital = HospitalModel.query.filter_by(hospital_id=id).first()
        if not hospital:
            abort(404, "Hospital not found")
        hospital.hospital_name = args["hospital_name"]
        hospital.address = args["address"]
        
        db.session.commit()
        return hospital

    #delete a hospital with their id, returns all hospitals
    @marshal_with(hospital_fields)
    def delete(self, id):
        hospital = HospitalModel.query.filter_by(hospital_id=id).first()
        if not hospital:
            abort(404, "Hospital not found")
        db.session.delete(hospital)
        db.session.commit()

        hospitals = HospitalModel.query.all()
        return hospitals, 201

#----------------------------------------------bloodunits---------------------------------------------------#
class BloodUnits(Resource):
    #gets all blood unit informations
    @marshal_with(bloodunit_fields)
    def get(self):
        units = BloodUnitInfoModel.query.all()
        return units
    
    #adds a new blood unit
    @marshal_with(bloodunit_fields)
    def post(self):
        args = bloodunit_args.parse_args()
        blood_unit = BloodUnitInfoModel(donor_id = args["donor_id"],
                                        donation_date = args["donation_date"],
                                        expiry_date = args["expiry_date"],
                                        unit_status = args["unit_status"])
        db.session.add(blood_unit)
        db.session.commit()

        units = BloodUnitInfoModel.query.all()
        return units, 201

class BloodUnit(Resource):
    #gets a singular blood unit based on id
    @marshal_with(bloodunit_fields)
    def get(self, id):
        unit = BloodUnitInfoModel.query.filter_by(unit_id=id).first()
        if not unit:
            abort(404, "Blood Unit not Found")
        return unit

    #edit a bloodunit (unit status for now)
    @marshal_with(bloodunit_fields)
    def patch(self, id):
        args = bloodunit_args.parse_args()
        unit = BloodUnitInfoModel.query.filter_by(unit_id=id).first()
        
        if not unit:
            abort(404, "Blood Unit not Found")
        
        unit.unit_status = args["unit_status"]
        db.session.commit()
        return unit

    #delete a blood unit(for testing may remove)
    @marshal_with(bloodunit_fields)
    def delete(self, id):
        unit = BloodUnitInfoModel.query.filter_by(unit_id=id).first()
        if not unit:
            abort(404, "Blood Unit not Found")
        db.session.delete(unit)
        db.session.commit()

        units = BloodUnitInfoModel.query.all()
        return units, 201
    
#-----------------------------------------requests------------------------------------------------------#
class Requests(Resource):
    #gets all the requests
    @marshal_with(request_fields)
    def get(self):
        requests = RequestModel.query.all()
        return requests
    
    #adds a request
    @marshal_with(request_fields)
    def post(self):
        args = request_args.parse_args()
        request = RequestModel(hospital_id=args["hospital_id"],
                               unit_id=args["unit_id"],
                               request_date=args["request_date"],
                               req_status=args["req_status"],
                               completed_date=args["completed_date"])
        db.session.add(request)
        db.session.commit()

        requests = RequestModel.query.all()
        return requests, 201
    
class Request(Resource):
    #gets a single request
    @marshal_with(request_fields)
    def get(self, id):
        request = RequestModel.query.filter_by(request_id=id).first()
        if not request:
            abort(404, "Request not found")
        return request

    #edits a request
    @marshal_with(request_fields)
    def patch(self, id):
        args = request_args.parse_args()
        request = RequestModel.query.filter_by(request_id=id).first()
        if not request:
            abort(404, "Request not Found")
        
        request.request_date = args["request_date"]
        request.req_status = args["req_status"]
        request.completed_date = args["completed_date"]
        db.session.commit()
        return request

    #deletes a request
    @marshal_with(request_fields)
    def delete(self, id):
        request = RequestModel.query.filter_by(request_id=id).first()
        if not request:
            abort(404, "Request not found")
        db.session.delete(request)
        db.session.commit()

        requests = RequestModel.query.all()
        return requests, 201

#-----------------------------------------blood drives------------------------------------------------------#
class BloodDrives(Resource):
    #gets all blood drives
    @marshal_with(blooddrive_fields)
    def get(self):
        drives = BloodDriveModel.query.all()
        return drives
    
    #adds a new blood drive
    @marshal_with(blooddrive_fields)
    def post(self):
        args = blooddrive_args.parse_args()
        drive = BloodDriveModel(
            drive_name=args["drive_name"],
            drive_address=args["drive_address"],
            manager_last_name=args["manager_last_name"],
            manager_first_name=args["manager_first_name"],
            phone_num=args["phone_num"],
            last_drive_date=args["last_drive_date"]
        )
        db.session.add(drive)
        db.session.commit()

        drives = BloodDriveModel.query.all()
        return drives, 201

class BloodDrive(Resource):
    #gets a single blood drive
    @marshal_with(blooddrive_fields)
    def get(self, id):
        drive = BloodDriveModel.query.filter_by(drive_id=id).first()
        if not drive:
            abort(404, "Blood Drive not found")
        return drive
    
    #edits a blood drive
    @marshal_with(blooddrive_fields)
    def patch(self, id):
        args = blooddrive_args.parse_args()
        drive = BloodDriveModel.query.filter_by(drive_id=id).first()
        if not drive:
            abort(404, "Blood Drive not found")
        
        drive.drive_name = args["drive_name"]
        drive.drive_address = args["drive_address"]
        drive.manager_last_name = args["manager_last_name"]
        drive.manager_first_name = args["manager_first_name"]
        drive.phone_num = args["phone_num"]
        drive.last_drive_date = args["last_drive_date"]
        
        db.session.commit()
        return drive
    
    #deletes a blood drive
    @marshal_with(blooddrive_fields)
    def delete(self, id):
        drive = BloodDriveModel.query.filter_by(drive_id=id).first()
        if not drive:
            abort(404, "Blood Drive not found")
        db.session.delete(drive)
        db.session.commit()

        drives = BloodDriveModel.query.all()
        return drives, 201

#----------------------------------functions-----------------------------------------------#
class DashboardSummary(Resource):
    def get(self):
        summary = get_summary()
        return summary, 200

class ExpiringUnits(Resource):
    def get(self):
        days = request.args.get("days", default=20, type=int)
        units = get_expiring_units(days=days)
        return [unit.to_dict() for unit in units], 200

class ExpiredUnits(Resource):
    def get(self):
        units = get_expired_units()
        return [unit.to_dict() for unit in units], 200

class MarkExpired(Resource):
    def post(self):
        count = mark_expired_units()
        return {"message": f"{count} units marked as expired", "count": count}, 200

class InventoryByType(Resource):
    def get(self):
        inventory = get_inventory_by_blood_type()
        return inventory, 200

class UnitsByBloodType(Resource):
    def get(self):
        blood_type = request.args.get("blood_type", type=str)
        status = request.args.get("status", default="Available", type=str)
        
        if not blood_type:
            return {"message": "blood_type parameter is required"}, 400
        
        if blood_type not in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]:
            return {"message": "Invalid blood type"}, 400
        
        units = get_units_by_blood_type(blood_type, status)
        return [unit.to_dict() for unit in units], 200

class DonorsByBloodType(Resource):
    def get(self):
        blood_type = request.args.get("blood_type", type=str)
        
        if not blood_type:
            return {"message": "blood_type parameter is required"}, 400
            
        if blood_type not in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]:
            return {"message": "Invalid blood type"}, 400
        
        donors = get_donors_by_blood_type(blood_type)
        return [donor.to_dict() for donor in donors], 200

class EligibleDonors(Resource):
    def get(self):
        donors = get_eligible_donors()
        return [donor.to_dict() for donor in donors], 200

class UrgentRequests(Resource):
    def get(self):
        requests = get_urgent_requests()
        return [req.to_dict() for req in requests], 200

class RequestsByStatus(Resource):
    def get(self):
        status = request.args.get("status", type=str)
        
        if not status:
            return {"message": "status parameter is required"}, 400
            
        if status not in ["Approved", "Pending", "Processing", "Transit", "Completed", "Cancelled"]:
            return {"message": "Invalid status"}, 400
        
        requests = get_request_by_status(status)
        return [req.to_dict() for req in requests], 200

class LowStockAlerts(Resource):
    def get(self):
        amount = request.args.get("amount", default=5, type=int)
        low_stock = get_low_stock(amount=amount)
        return low_stock, 200

class DonorsByDrive(Resource):
    def get(self):
        drive_id = request.args.get("drive_id", type=int)
        
        if not drive_id:
            return {"message": "drive_id parameter is required"}, 400
        
        result = get_donors_by_drive(drive_id)
        return {
            "drive_id": result["drive_id"],
            "donor_count": result["donor_count"],
            "donors": [donor.to_dict() for donor in result["donors"]]
        }, 200

#------------------------------------------------------------------------------------------#
api.add_resource(Donors, "/api/donors/")
api.add_resource(Donor, "/api/donors/<int:id>")
api.add_resource(Hospitals, "/api/hospitals/")
api.add_resource(Hospital, "/api/hospitals/<int:id>")
api.add_resource(BloodUnits, "/api/bloodunits/")
api.add_resource(BloodUnit, "/api/bloodunits/<int:id>")
api.add_resource(Requests, "/api/requests/")
api.add_resource(Request, "/api/requests/<int:id>")
api.add_resource(BloodDrives, "/api/blooddrives/")
api.add_resource(BloodDrive, "/api/blooddrives/<int:id>")
api.add_resource(DashboardSummary, "/api/function/summary")
api.add_resource(ExpiringUnits, "/api/function/expiring")
api.add_resource(ExpiredUnits, "/api/function/expired")
api.add_resource(MarkExpired, "/api/function/mark-expired")
api.add_resource(InventoryByType, "/api/function/inventory")
api.add_resource(UnitsByBloodType, "/api/function/units-by-type")
api.add_resource(DonorsByBloodType, "/api/function/donors-by-type")
api.add_resource(EligibleDonors, "/api/function/eligible-donors")
api.add_resource(UrgentRequests, "/api/function/urgent-requests")
api.add_resource(RequestsByStatus, "/api/function/requests-by-status")
api.add_resource(LowStockAlerts, "/api/function/low-stock")
api.add_resource(DonorsByDrive, "/api/function/donors-by-drive")

@app.route("/")
def home():
    return "<h1>Blood Bank REST API</h1>"

if __name__ == '__main__':
    app.run(debug=True)
