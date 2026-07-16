# MedLink AI - API Endpoints Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Currently no authentication middleware is implemented. Add JWT bearer token support before production deployment.

---

## Patients

### Create Patient
```
POST /patients
Content-Type: application/json

{
  "name": "Amara Okonkwo",
  "age": 34,
  "gender": "female",
  "phone": "+2348012345678",
  "medical_history": "Hypertension, Type 2 Diabetes",
  "clinic_id": "uuid-of-clinic"
}

Response: 201 Created
{
  "id": "patient-uuid",
  "name": "Amara Okonkwo",
  "age": 34,
  "gender": "female",
  "phone": "+2348012345678",
  "medical_history": "Hypertension, Type 2 Diabetes",
  "clinic_id": "uuid-of-clinic",
  "created_at": "2026-07-16T10:30:00Z",
  "updated_at": "2026-07-16T10:30:00Z"
}
```

### Get Patient by ID
```
GET /patients/:id

Response: 200 OK
{
  "id": "patient-uuid",
  "name": "Amara Okonkwo",
  ...referrals: [...]
}
```

### Get Patient by Phone
```
GET /patients/phone/:phone

Response: 200 OK
```

### Get Patients by Clinic
```
GET /patients?clinicId=uuid

Response: 200 OK
[...]
```

### Update Patient
```
PUT /patients/:id
Content-Type: application/json

{
  "medical_history": "Updated history"
}

Response: 200 OK
```

### Delete Patient
```
DELETE /patients/:id

Response: 204 No Content
```

---

## Facilities

### Create Facility
```
POST /facilities
Content-Type: application/json

{
  "name": "Kano General Hospital",
  "address": "Gida Quarters, Kano",
  "latitude": 11.9273,
  "longitude": 8.6753,
  "type": "tertiary_hospital",
  "phone": "+2348000000000",
  "contact_person": "Dr. Ibrahim Ahmed",
  "bed_capacity": 500,
  "ambulance_available": true
}

Response: 201 Created
```

### Get Facility by ID
```
GET /facilities/:id

Response: 200 OK
```

### Get All Facilities
```
GET /facilities

Response: 200 OK
[...]
```

### Get Facilities by Type
```
GET /facilities?type=tertiary_hospital

Response: 200 OK
```

### Get Nearest Facility (Offline-capable)
```
GET /facilities/nearest/location?latitude=11.9273&longitude=8.6753&type=secondary_hospital&specialtyId=uuid

Response: 200 OK
{
  "id": "facility-uuid",
  "name": "Nearest Hospital",
  ...
}
```

### Update Facility
```
PUT /facilities/:id
Content-Type: application/json