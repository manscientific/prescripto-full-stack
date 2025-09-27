import cv2
import face_recognition
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import numpy as np
from bson import ObjectId
import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client["waiting_room"]
users = db["users"]
doctors = db["doctors"]


# ---- Helper ----
def get_or_create_doctor(name: str):
    doctor = doctors.find_one({"name": name})
    if not doctor:
        new_doc = {"name": name, "waiting_count": 0}
        result = doctors.insert_one(new_doc)
        doctor = doctors.find_one({"_id": result.inserted_id})
    return doctor


# ---- Registration ----
@app.post("/register/")
async def register_user(data: dict):
    doctor_name = data.get("doctorName")
    if not doctor_name:
        return {"status": "error", "message": "Doctor name required"}

    doctor = get_or_create_doctor(doctor_name)

    # Capture face from camera
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return {"status": "error", "message": "Camera error"}

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_frame)
    if not encodings:
        return {"status": "error", "message": "No face found"}

    face_encoding = encodings[0]

    # Check if face already registered for this doctor
    for user in users.find({"doctorId": doctor["_id"]}):
        stored_enc = np.array(user["encoding"])
        match = face_recognition.compare_faces([stored_enc], face_encoding)[0]
        if match:
            return {"status": "error", "message": "Face already registered for this doctor"}

    # Insert new user
    users.insert_one({
        "doctorId": doctor["_id"],
        "encoding": face_encoding.tolist(),
        "status": "waiting",
        "timestamp": datetime.datetime.now()
    })

    # Update doctor's waiting count
    doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": 1}})
    updated = doctors.find_one({"_id": doctor["_id"]})

    return {"status": "success", "doctorName": updated["name"], "waiting_count": updated["waiting_count"]}


# ---- Verification ----
@app.post("/verify/")
async def verify_user(data: dict):
    doctor_name = data.get("doctorName")
    if not doctor_name:
        return {"status": "error", "message": "Doctor name required"}

    doctor = doctors.find_one({"name": doctor_name})
    if not doctor:
        return {"status": "error", "message": "Doctor not found"}

    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return {"status": "error", "message": "Camera error"}

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_frame)
    if not encodings:
        return {"status": "error", "message": "No face found"}

    face_encoding = encodings[0]

    for user in users.find({"doctorId": doctor["_id"], "status": "waiting"}):
        stored_enc = np.array(user["encoding"])
        match = face_recognition.compare_faces([stored_enc], face_encoding)[0]
        if match:
            # Delete user after successful verification
            users.delete_one({"_id": user["_id"]})
            # Decrease doctor's waiting count
            doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": -1}})
            updated = doctors.find_one({"_id": doctor["_id"]})
            return {"status": "verified & deleted", "waiting_count": updated["waiting_count"]}

    updated = doctors.find_one({"_id": doctor["_id"]})
    return {"status": "not_found", "waiting_count": updated["waiting_count"]}


# ---- Doctor-specific Count ----
@app.get("/count/{doctor_name}")
def get_count(doctor_name: str):
    doctor = get_or_create_doctor(doctor_name)
    return {"doctorName": doctor["name"], "waiting_count": doctor["waiting_count"]}
