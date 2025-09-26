import cv2
import base64
from deepface import DeepFace
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import numpy as np

# ---------------------------
# Config
# ---------------------------
FRONTEND_URL = "https://prescripto-full-stack-five.vercel.app"
MONGODB_URI = "mongodb+srv://manscientificks:12345678sh@cluster0.kjqvrc9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

app = FastAPI()

# ✅ Allow frontend + local dev
origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Database
# ---------------------------
client = MongoClient(MONGODB_URI)
db = client["waiting_room"]
users = db["users"]
doctors = db["doctors"]

# ---------------------------
# Helpers
# ---------------------------
def get_or_create_doctor(name: str):
    doctor = doctors.find_one({"name": name})
    if not doctor:
        new_doc = {"name": name, "waiting_count": 0}
        result = doctors.insert_one(new_doc)
        doctor = doctors.find_one({"_id": result.inserted_id})
    return doctor

def decode_base64_image(image_data: str):
    """Convert base64 string -> OpenCV frame"""
    header, encoded = image_data.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return frame

# ---------------------------
# Registration
# ---------------------------
@app.post("/register/")
async def register_user(data: dict):
    doctor_name = data.get("doctorName")
    doctor_id = data.get("doctorId")
    image_data = data.get("image")

    if not doctor_name:
        return {"status": "error", "message": "Doctor name required"}
    if not image_data:
        return {"status": "error", "message": "Image required"}

    doctor = get_or_create_doctor(doctor_name)
    frame = decode_base64_image(image_data)

    try:
        result = DeepFace.represent(
            frame,
            model_name="Facenet",
            detector_backend="opencv",
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

    return {"status": "success", "doctorName": updated["name"], "waiting_count": updated["waiting_count"]}

# ---------------------------
# Verification
# ---------------------------
@app.post("/verify/")
async def verify_user(data: dict):
    doctor_name = data.get("doctorName")
    image_data = data.get("image")

    if not doctor_name:
        return {"status": "error", "message": "Doctor name required"}
    if not image_data:
        return {"status": "error", "message": "Image required"}

    doctor = doctors.find_one({"name": doctor_name})
    if not doctor:
        return {"status": "error", "message": "Doctor not found"}

    frame = decode_base64_image(image_data)

    try:
        result = DeepFace.represent(
            frame,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=True
        )
        face_encoding = np.array(result[0]["embedding"])
    except Exception:
        return {"status": "error", "message": "No face found"}

    # Compare with stored users
    for user in users.find({"doctorId": doctor["_id"], "status": "waiting"}):
        stored_enc = np.array(user["encoding"])
        distance = np.linalg.norm(stored_enc - face_encoding)

        if distance < 0.6:  # threshold
            users.update_one({"_id": user["_id"]}, {"$set": {"status": "verified"}})
            doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": -1}})
            updated = doctors.find_one({"_id": doctor["_id"]})
            return {"status": "verified", "waiting_count": updated["waiting_count"]}

    updated = doctors.find_one({"_id": doctor["_id"]})
    return {"status": "not_found", "waiting_count": updated["waiting_count"]}

# ---------------------------
# Doctor Count
# ---------------------------
@app.get("/count/{doctor_name}")
def get_count(doctor_name: str):
    doctor = get_or_create_doctor(doctor_name)
    return {"doctorName": doctor["name"], "waiting_count": doctor["waiting_count"]}
