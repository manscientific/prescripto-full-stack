import cv2
from deepface import DeepFace
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import numpy as np
from bson import ObjectId
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
frontend = os.getenv("frontend")
mongo_uri = os.getenv("MONGODB_URI")   # <-- added

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use MongoDB from environment variable
client = MongoClient(mongo_uri)   # <-- replaced
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
    doctor_id = data.get("doctorId")

    if not doctor_name:
        return {"status": "error", "message": "Doctor name required"}

    doctor = get_or_create_doctor(doctor_name)

    # Capture face
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return {"status": "error", "message": "Camera error"}

    try:
        # 🔑 Force DeepFace to use OpenCV instead of RetinaFace
        result = DeepFace.represent(
            frame,
            model_name="Facenet",
            detector_backend="opencv",   # <--- added
            enforce_detection=True
        )
        face_encoding = result[0]["embedding"]
    except Exception:
        return {"status": "error", "message": "No face found"}

    users.insert_one({
        "doctorId": doctor["_id"],
        "encoding": face_encoding,
        "status": "waiting"
    })

    doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": 1}})
    updated = doctors.find_one({"_id": doctor["_id"]})

    return {
        "status": "success",
        "doctorName": updated["name"],
        "waiting_count": updated["waiting_count"]
    }

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

    try:
        # 🔑 Again force OpenCV
        result = DeepFace.represent(
            frame,
            model_name="Facenet",
            detector_backend="opencv",   # <--- added
            enforce_detection=True
        )
        face_encoding = np.array(result[0]["embedding"])
    except Exception:
        return {"status": "error", "message": "No face found"}

    # Compare with stored users
    for user in users.find({"doctorId": doctor["_id"], "status": "waiting"}):
        stored_enc = np.array(user["encoding"])
        distance = np.linalg.norm(stored_enc - face_encoding)

        if distance < 0.6:  # threshold for Facenet embeddings
            users.update_one({"_id": user["_id"]}, {"$set": {"status": "verified"}})
            doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": -1}})
            updated = doctors.find_one({"_id": doctor["_id"]})
            return {"status": "verified", "waiting_count": updated["waiting_count"]}

    updated = doctors.find_one({"_id": doctor["_id"]})
    return {"status": "not_found", "waiting_count": updated["waiting_count"]}

# ---- Doctor-specific Count ----
@app.get("/count/{doctor_name}")
def get_count(doctor_name: str):
    doctor = get_or_create_doctor(doctor_name)
    return {"doctorName": doctor["name"], "waiting_count": doctor["waiting_count"]}
# uvicorn main:app --reload
