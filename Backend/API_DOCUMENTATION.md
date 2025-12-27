# Homecare API — Endpoints & JSON Schemas

Generated from controllers in the repository (as of current workspace). For each endpoint: route, method, authorization, input schema (with required fields and restrictions), output schema, and common responses.

Notes:
- Date/time formats used in examples:
  - Date / DateTime: ISO 8601 (e.g. "2025-12-26" or "2025-12-26T14:30:00Z")
  - TimeOnly: use string "HH:mm" or "HH:mm:ss" (e.g. "14:30" or "14:30:00")
- File uploads require multipart/form-data (IFormFile).
- Image restrictions (applies to endpoints that accept `Image`):
  - Allowed content-types: `image/jpeg`, `image/png`, `image/jpg`
  - Max size: 1000 KB (≈ 1,024,000 bytes). Requests violating this return 400 BadRequest with message "Image Should be png, jpg or jpeg of Maximum 1000 KB Size".
- Common HTTP responses:
  - 200 OK (successful GET/DELETE or custom OK)
  - 201 Created (created resources)
  - 400 BadRequest (validation/business rule failure)
  - 404 NotFound (resource not found)
  - 401/403 when __Authorization__ required and missing/insufficient

---

## DTO / Model reference (short)

- AppointmentCreateDto
  - AppointmentDate: DateTime (ISO 8601)
  - StartTime: TimeOnly (string "HH:mm[:ss]") — [Required]
  - EndTime: TimeOnly — [Required]
  - patientId: int
  - PhysicianId: int
  - MeetingAddress: string
  - PhysicianNotes: string — [Required]
  - Business note: although `patientId` and `PhysicianId` are not annotated with [Required], they are used to create appointments and must be supplied for successful creation.

- AppointmentSendDto (response)
  - Id: GUID
  - AppointmentDate: DateTime
  - StartTime: TimeOnly
  - EndTime: TimeOnly
  - PatientName: string
  - PhysicianName: string
  - PhysicianNotes: string
  - MeetingAddress: string
  - Medications: List<MedicationSendAndCreateDto> (nullable)
  - PdfBase64: string (base64 PDF, empty string if none)

- MedicationSendAndCreateDto
  - Name: string — [Required]
  - Description: string (nullable)
  - DoseFrequency: int? (nullable)
  - Dose: decimal? (nullable)
  - UsageTimes: List<TimeOnly>? (each TimeOnly as "HH:mm" or "HH:mm:ss")

- ReportCreateDto (used to add a report)
  - Descritpion: string
  - patientId: int
  - PhysicianId: int
  - Medications: List<MedicationSendAndCreateDto>

- PatientCreateDto (used for creating/updating patients and signup)
  - Name: string
  - Phone: string (validated with [Phone] attribute)
  - Gender: string
  - Address: string
  - City: string
  - Email: string
  - Password: string
  - UserName: string
  - SubscriptionId: int? (nullable)
  - Image: IFormFile (multipart file)

- PatientSendDto (response)
  - Id: int?
  - Name: string
  - Phone: string
  - Gender: string
  - Address: string
  - City: string
  - Image: string (stored image string)
  - SubscriptionName: string
  - SubscriptionPrice: decimal

- PhysicianCreateDto
  - Name: string — [Required]
  - SpecializationId: int — [Required]
  - ClinicalAddress: string — [Required]
  - Email: string
  - Password: string
  - Phone: string
  - UserName: string
  - Image: IFormFile — [Required]

- PhysicianSendDto (response)
  - Id: int
  - Name: string
  - SpecializationName: string
  - ClinicalAddress: string
  - Image: string

- SpecializationSendDto
  - Id: int?
  - Name: string
  - Description: string

- LoginDto
  - Username: string
  - Password: string
  - RememberMe: bool
  - Response: JWT token string (plain string in body)

---

# Endpoints

### Base route pattern
All controllers use `[Route("api/[controller]")]`. Replace `[controller]` with `Appointments`, `Patient`, `Physician`, `Specialization`, `Account`.

---

## AppointmentsController

1) GET api/Appointments/GetAppointment/{id:guid}
- Authorization: none
- Path params:
  - `id` (GUID) — appointment id
- Response (200 OK): `AppointmentSendDto`
  - Example:
    {
      "id": "b2a3f8e1-....",
      "appointmentDate": "2025-12-26T00:00:00Z",
      "startTime": "14:00",
      "endTime": "14:30",
      "patientName": "John Doe",
      "physicianName": "Dr. Smith",
      "physicianNotes": "Notes here",
      "meetingAddress": "123 Main St",
      "medications": [
        { "name": "Med A", "description": "...", "doseFrequency": 3, "dose": 2.5, "usageTimes": ["08:00","20:00"] }
      ],
      "pdfBase64": "<base64 string or empty string>"
    }
- 404 NotFound if id not found.

2) GET api/Appointments/AtDay?date={date}&patientId={int}
- Authorization: none
- Query params:
  - `date` (DateTime ISO string)
  - `patientId` (int)
- Response (200 OK): array of `AppointmentSendDto` (fields filled as in listing; `PhysicianName` present)

3) GET api/Appointments/Medications?date={date}&patientId={int}
- Authorization: none
- Query params:
  - `date`, `patientId`
- Response (200 OK): array of `MedicationSendAndCreateDto` (patient's medications). Note: the controller reads patient.Medications ignoring `date` in current implementation (date param isn't used to filter medications).

4) GET api/Appointments/GetAllAppointments
- Authorization: none
- Response (200 OK): array of `AppointmentSendDto` (all appointments ordered by date)

5) POST api/Appointments/BookAppointment
- Authorization: none
- Body: JSON `AppointmentCreateDto`
  - Required (by DTO attributes and business logic):
    - `startTime` (string "HH:mm" or "HH:mm:ss") — [Required]
    - `endTime` (string) — [Required]
    - `physicianNotes` (string) — [Required]
  - Important for successful creation:
    - `patientId` (int) — must refer to existing patient
    - `physicianId` (int) — must refer to existing physician
    - `appointmentDate` (date)
    - `meetingAddress` (string)
  - Business restrictions:
    - The controller checks for time overlap. If a physician or patient has an overlapping appointment, returns 400 BadRequest with message:
      - "This Physician Has an Appointment At The same time"
      - or "This Patient Has an Appointment At The same time"
- Responses:
  - 201 Created — Created location points to `GetAppointment` with id
  - 400 BadRequest — on overlap or other validation

6) POST api/Appointments/Add/Appointment/Report/{appointmentId:guid}
- Authorization: none
- Path params: `appointmentId` (GUID)
- Body: JSON `ReportCreateDto`
  - Fields:
    - `descritpion`: string
    - `patientId`: int (must exist)
    - `physicianId`: int
    - `medications`: array of `MedicationSendAndCreateDto` (each `name` required)
- Behavior:
  - If appointment not found → 404 "Wrong ID"
  - If appointment already has a report → 400 "This Appointment Already Has A Report"
  - Generates PDF (byte[]) and returns Created with body:
    {
      "pdfBase64": "<base64 string>"
    }
  - Also adds medications to patient record.
- Responses:
  - 201 Created (body contains `pdfBase64`)
  - 400 BadRequest, 404 NotFound

7) DELETE api/Appointments/{id:guid}
- Authorization: none
- Path param: `id` GUID
- Response:
  - 200 OK on success
  - 404 NotFound if id missing

8) PUT api/Appointments/{id:guid}
- Authorization: none
- Path param: `id` GUID
- Body: JSON `AppointmentCreateDto` (same fields as Book)
- Response:
  - 201 Created (points to GetAppointment)
  - 404 NotFound if appointment not found

---

## PhysicianController

1) GET api/Physician/GetPhysician/{id:int}
- Authorization: none
- Response (200): `PhysicianSendDto`
  - Example:
    {
      "id": 5,
      "name": "Dr. Smith",
      "specializationName": "Cardiology",
      "clinicalAddress": "Clinic A",
      "image": "<stored image string>"
    }
- 404 if not found

2) GET api/Physician/GetAllPhysicians
- Authorization: none
- Response (200): array of `PhysicianSendDto`

3) GET api/Physician/GetPhysicianAppointments/{physicianId:int}
- Authorization: __Authorize(Roles = "admin,physician")__ — token with role required
- Response (200): array of `AppointmentSendDto` (medications empty, pdfBase64 empty in this listing)
- 404 if no appointments (controller checks null — typically returns empty list)

4) POST api/Physician/AddPhysician
- Authorization: __Authorize(Roles = "admin")__
- Content-Type: multipart/form-data
- Form fields (from `PhysicianCreateDto`):
  - `name` (string) — [Required]
  - `specializationId` (int) — [Required]
  - `clinicalAddress` (string) — [Required]
  - `email` (string)
  - `password` (string)
  - `phone` (string)
  - `userName` (string)
  - `image` (file) — [IFormFile] — [Required]
- Image restrictions: allowed types and max size (see top)
- Response:
  - 201 Created -> CreatedAtAction GetPhysician
  - 400 BadRequest if image invalid

5) PUT api/Physician/{id:int}
- Authorization: none (no attribute)
- Content-Type: multipart/form-data recommended (because `Image` is IFormFile)
- Body: `PhysicianCreateDto` (same as Add)
  - All `[Required]` fields in DTO will be used; `Image` is read via `imageServices.ReadImage(updated.Image)`, so include if updating photo.
- Response:
  - 201 Created -> GetPhysician
  - 404 if not found

6) DELETE api/Physician/{id:int}
- Authorization: __Authorize(Roles = "admin")__
- Response: 200 OK on success, 404 if not found

---

## PatientController

1) GET api/Patient/GetPatient/{id:int}
- Authorization: none
- Response (200): `PatientSendDto`
  - Example:
    {
      "id": 12,
      "name": "Alice",
      "phone": "+2012345",
      "address": "Addr",
      "city": "City",
      "gender": "Female",
      "image": "<string>",
      "subscriptionName": "Silver",
      "subscriptionPrice": 49.99
    }
- 404 if not found

2) GET api/Patient/GetAllPatients
- Authorization: none
- Response (200): array of `PatientSendDto` (ordered desc by subscription price)

3) GET api/Patient/GetPatientAppointments/{patientId:int}
- Authorization: none
- Response (200): array of `AppointmentSendDto` (medications empty, pdfBase64 empty)

4) POST api/Patient/AddPatient
- Authorization: none
- Content-Type: multipart/form-data
- Form fields (PatientCreateDto):
  - `name`, `phone` (validated), `gender`, `address`, `city`
  - `email`, `password`, `userName` (used by Account signup in other flows; AddPatient only persists Patient entity)
  - `subscriptionId` (optional)
  - `image` (IFormFile) — optional but if provided must follow allowed content types and size
- Response:
  - 201 Created -> GetPatient (returns created Patient entity)
  - 400 BadRequest if invalid image

5) PUT api/Patient/{id:int}
- Authorization: none
- Content-Type: multipart/form-data (if updating image)
- Body: `PatientCreateDto`
  - `Image` is optional for update — controller checks `if(updated.Image is not null) old.Image = await imageServices.ReadImage(updated.Image);`
  - `SubscriptionId` may be null; if provided it's applied.
- Response:
  - 201 Created -> GetPatient
  - 404 NotFound if patient missing

6) DELETE api/Patient/{id:int}
- Authorization: none
- Response: 200 OK, or 404 if not found

---

## SpecializationController

1) GET api/Specialization/GetSpecialization/{id:int}
- Authorization: none
- Response: `SpecializationSendDto`
- 404 if not found

2) GET api/Specialization/GetAllSpecializations
- Authorization: none
- Response: array of `SpecializationSendDto`

3) GET api/Specialization/GetPhysicians/{id:int}
- Authorization: none
- Response: array of `PhysicianSendDto` (physicians in that specialization)
- 404 if specialization id invalid

4) POST api/Specialization/AddSpecialization
- Authorization: __Authorize(Roles = "admin")__
- Body: JSON `SpecializationSendDto` (Name & Description recommended)
- Response:
  - 201 Created -> GetSpecialization

5) PUT api/Specialization/{id:int}
- Authorization: __Authorize(Roles = "admin")__
- Body: `SpecializationSendDto`
- Response:
  - 201 Created -> GetSpecialization
  - 404 NotFound if id invalid

6) DELETE api/Specialization/{id:int}
- Authorization: __Authorize(Roles = "admin")__
- Response: 200 OK or 404

---

## AccountController

1) POST api/Account/New/Role
- Authorization: none (no role check)
- Body: raw string in JSON body (example: `"admin"`) or posted as text — controller accepts `[FromBody] string role`
- Response: 200 OK on success, 400 BadRequest with errors otherwise

2) POST api/Account/Signup/Patient
- Authorization: none
- Content-Type: multipart/form-data
- Form fields: `PatientCreateDto` (same as Patient Add)
  - `email`, `userName` and `password` are used to create Identity user — they should be provided
  - `image` allowed as above
- Behavior:
  - Creates Identity ApplicationUser, assigns "patient" role, creates Patient entity and links user's PatientId
  - Response: 200 OK with created Patient (controller returns `Ok(p)` on success)
  - 400 BadRequest with Identity errors or image validation message

3) POST api/Account/Signup/Physician
- Authorization: none
- Content-Type: multipart/form-data
- Form fields: `PhysicianCreateDto` (required `name`, `specializationId`, `clinicalAddress`, `image`, and `email`, `userName`, `password` used for Identity)
- Behavior:
  - Creates ApplicationUser with "physician" role, creates Physician record, links PhysicianId
  - Response: 200 OK with created Physician
  - 400 BadRequest for Identity errors or image validation

4) POST api/Account/Login
- Authorization: none
- Body: JSON `LoginDto`
  - `username`: string (required for successful login)
  - `password`: string (required)
  - `rememberMe`: boolean
- Response:
  - 200 OK: plain string JWT token (returned in response body)
    - The token includes claims: Name, NameIdentifier, Jti, Exp, and optional PatientId / PhysicianId and roles
  - 404 NotFound with message "Username or Password is invalid" when authentication fails

---

# Examples

Appointment create (JSON body for `POST /api/Appointments/BookAppointment`):
{
  "appointmentDate": "2025-12-26T00:00:00Z",
  "startTime": "14:00",
  "endTime": "14:30",
  "patientId": 12,
  "physicianId": 5,
  "meetingAddress": "123 Main St",
  "physicianNotes": "Visit for follow-up"
}

Add report (JSON `POST /api/Appointments/Add/Appointment/Report/{appointmentId}`):
{
  "descritpion": "Patient shows improvement.",
  "patientId": 12,
  "physicianId": 5,
  "medications": [
    { "name": "Med A", "description": "Take with food", "doseFrequency": 2, "dose": 1.5, "usageTimes": ["08:00","20:00"] }
  ]
}

Login (JSON `POST /api/Account/Login`):
{
  "username": "adminuser",
  "password": "P@ssw0rd",
  "rememberMe": false
}

Multipart/form-data example for `POST /api/Patient/AddPatient` (pseudo):
- form field `name`: "Alice"
- form field `phone`: "+2012345"
- form field `email`: "alice@example.com"
- form field `password`: "secret"
- form field `userName`: "alice"
- file field `image`: (file.jpg, content-type image/jpeg, size <= 1000 KB)

---

# Extra notes / edge cases found in code
- Many DTOs do not have [Required] on fields that are logically required for operations (e.g., patientId/physicianId). Clients should supply all fields used in the controller logic.
- `TimeOnly` fields are used throughout — when serializing/deserializing JSON, ensure your client uses the server's expected format (string "HH:mm" or "HH:mm:ss") or configure serializer to support `TimeOnly`.
- `POST /api/Appointments/Medications` accepts `date` param but controller implementation ignores the date when returning patient medications (it fetches patient and returns all medications). Consider this when consuming.
- `Account/New/Role` expects a raw string body (e.g., `"admin"`). Many clients send an object — send plain string or adjust client to post a JSON string.

---

If you want, I can:
- Generate a machine-readable OpenAPI/Swagger spec (JSON/YAML) from the code above.
- Create an `API_DOCUMENTATION.md` file in the repository with this content (I can add it to the repo).
Which would you prefer?  