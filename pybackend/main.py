import cv2
import base64
import numpy as np
from deepface import DeepFace
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import os
import re

# ---------------------------
# Config
# ---------------------------
MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb+srv://manscientificks:12345678sh@cluster0.kjqvrc9.mongodb.net/?retryWrites=true&w=majority"

app = FastAPI()

# ---------------------------
# CORS - Fixed Configuration
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://prescripto-full-stack-.*-manscientifics-projects\.vercel\.app",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://prescripto-full-stack-ev9e1z15c-manscientifics-projects.vercel.app",
        "https://prescripto-full-stack-mw4rzksvj-manscientifics-projects.vercel.app"
    ],
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
    if "," in image_data:
        _, encoded = image_data.split(",", 1)
    else:
        encoded = image_data
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
    image_data = data.get("image")

    if not doctor_name or not image_data:
        raise HTTPException(status_code=400, detail="Doctor name and image are required.")

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
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No face found in the image. Error: {str(e)}")

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

    if not doctor_name or not image_data:
        raise HTTPException(status_code=400, detail="Doctor name and image are required.")

    doctor = doctors.find_one({"name": doctor_name})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    frame = decode_base64_image(image_data)

    try:
        result = DeepFace.represent(
            frame,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=True
        )
        face_encoding = np.array(result[0]["embedding"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No face found in the image. Error: {str(e)}")

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

# ---------------------------
# Health Check
# ---------------------------
@app.get("/")
def health_check():
    return {"status": "OK", "message": "Backend is running"}

# ---------------------------
# Get All Doctors
# ---------------------------
@app.get("/doctors/")
def get_all_doctors():
    all_doctors = list(doctors.find({}, {"_id": 0, "name": 1, "waiting_count": 1}))
    return {"doctors": all_doctors}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)