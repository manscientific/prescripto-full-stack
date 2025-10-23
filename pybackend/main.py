from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from facenet_pytorch import InceptionResnetV1
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import cv2
import datetime
import torch
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["waiting_room"]
users = db["users"]
doctors = db["doctors"]

# -------------------------------
# OpenCV DNN Face Detector
# -------------------------------
# Download these two files if you don't already have them:
#   1️⃣ deploy.prototxt
#   2️⃣ res10_300x300_ssd_iter_140000.caffemodel
#
# You can get them here:
#   https://github.com/opencv/opencv/tree/master/samples/dnn/face_detector
#
# Place both in the same directory as main.py

proto_path = "deploy.prototxt"
model_path = "res10_300x300_ssd_iter_140000.caffemodel"

if not os.path.exists(proto_path) or not os.path.exists(model_path):
    raise FileNotFoundError("Face detector model files missing. Please add deploy.prototxt and res10_300x300_ssd_iter_140000.caffemodel.")

face_net = cv2.dnn.readNetFromCaffe(proto_path, model_path)

# -------------------------------
# FaceNet (for embeddings)
# -------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)


# -------------------------------
# Helper functions
# -------------------------------
def get_or_create_doctor(name: str):
    doctor = doctors.find_one({"name": name})
    if not doctor:
        result = doctors.insert_one({"name": name, "waiting_count": 0})
        doctor = doctors.find_one({"_id": result.inserted_id})
    return doctor


def detect_face_opencv(image: np.ndarray):
    """Detect face using OpenCV DNN model. Returns cropped face if found."""
    h, w = image.shape[:2]
    blob = cv2.dnn.blobFromImage(
        cv2.resize(image, (300, 300)),
        1.0,
        (300, 300),
        (104.0, 177.0, 123.0),
    )
    face_net.setInput(blob)
    detections = face_net.forward()

    if detections.shape[2] == 0:
        return None

    # Take the most confident detection
    confidence = detections[0, 0, 0, 2]
    if confidence < 0.5:
        return None

    box = detections[0, 0, 0, 3:7] * np.array([w, h, w, h])
    (x1, y1, x2, y2) = box.astype("int")
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w - 1, x2), min(h - 1, y2)

    face = image[y1:y2, x1:x2]
    return face if face.size > 0 else None


def get_face_embedding(image: Image.Image):
    """Generate face embedding using OpenCV + FaceNet."""
    try:
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        face = detect_face_opencv(img)
        if face is None:
            return None

        face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
        face_resized = cv2.resize(face, (160, 160))
        face_tensor = (
            torch.tensor(face_resized.transpose((2, 0, 1))).unsqueeze(0).float().to(device) / 255.0
        )
        embedding = resnet(face_tensor).detach().cpu().numpy()[0]
        return embedding
    except Exception as e:
        print("Face embedding error:", e)
        return None


def is_face_match(embed1, embed2, threshold=0.8):
    return np.linalg.norm(embed1 - embed2) < threshold


# -------------------------------
# API Routes
# -------------------------------

@app.post("/register/")
async def register_user(data: dict):
    doctor_name = data.get("doctorName")
    image_base64 = data.get("image")

    if not doctor_name or not image_base64:
        return {"status": "error", "message": "Missing doctor name or image"}

    doctor = get_or_create_doctor(doctor_name)

    try:
        img_data = base64.b64decode(image_base64.split(",")[1])
        image = Image.open(BytesIO(img_data)).convert("RGB")
    except Exception as e:
        return {"status": "error", "message": f"Invalid image format: {e}"}

    embedding = get_face_embedding(image)
    if embedding is None:
        return {"status": "error", "message": "No face detected"}

    # Check duplicates
    for user in users.find({"doctorId": doctor["_id"]}):
        if is_face_match(np.array(user["encoding"]), embedding):
            return {"status": "error", "message": "Face already registered"}

    users.insert_one({
        "doctorId": doctor["_id"],
        "encoding": embedding.tolist(),
        "status": "waiting",
        "timestamp": datetime.datetime.now()
    })
    doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": 1}})
    updated = doctors.find_one({"_id": doctor["_id"]})

    return {"status": "success", "doctorName": updated["name"], "waiting_count": updated["waiting_count"]}


@app.post("/verify/")
async def verify_user(data: dict):
    doctor_name = data.get("doctorName")
    image_base64 = data.get("image")

    if not doctor_name or not image_base64:
        return {"status": "error", "message": "Missing doctor name or image"}

    doctor = doctors.find_one({"name": doctor_name})
    if not doctor:
        return {"status": "error", "message": "Doctor not found"}

    try:
        img_data = base64.b64decode(image_base64.split(",")[1])
        image = Image.open(BytesIO(img_data)).convert("RGB")
    except Exception as e:
        return {"status": "error", "message": f"Invalid image format: {e}"}

    embedding = get_face_embedding(image)
    if embedding is None:
        return {"status": "error", "message": "No face found"}

    for user in users.find({"doctorId": doctor["_id"], "status": "waiting"}):
        if is_face_match(np.array(user["encoding"]), embedding):
            users.delete_one({"_id": user["_id"]})
            doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"waiting_count": -1}})
            updated = doctors.find_one({"_id": doctor["_id"]})
            return {"status": "verified & deleted", "waiting_count": updated["waiting_count"]}

    updated = doctors.find_one({"_id": doctor["_id"]})
    return {"status": "not_found", "waiting_count": updated["waiting_count"]}


@app.get("/count/{doctor_name}")
def get_count(doctor_name: str):
    doctor = get_or_create_doctor(doctor_name)
    return {"doctorName": doctor["name"], "waiting_count": doctor["waiting_count"]}
