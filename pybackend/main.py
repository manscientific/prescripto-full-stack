from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from facenet_pytorch import InceptionResnetV1
import mediapipe as mp
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import cv2
import datetime
import torch

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

# Mediapipe face detection
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5)

# FaceNet embedding
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)

# Helpers
def get_or_create_doctor(name: str):
    doctor = doctors.find_one({"name": name})
    if not doctor:
        result = doctors.insert_one({"name": name, "waiting_count": 0})
        doctor = doctors.find_one({"_id": result.inserted_id})
    return doctor

def get_face_embedding(image: Image.Image):
    try:
        # PIL → OpenCV
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        results = face_detector.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if not results.detections:
            return None

        # Take first detected face
        bbox = results.detections[0].location_data.relative_bounding_box
        h, w, _ = img.shape
        x1 = int(bbox.xmin * w)
        y1 = int(bbox.ymin * h)
        x2 = int((bbox.xmin + bbox.width) * w)
        y2 = int((bbox.ymin + bbox.height) * h)
        face = img[y1:y2, x1:x2]

        # Resize and convert to PIL for FaceNet
        face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
        face_pil = Image.fromarray(cv2.resize(face, (160, 160)))

        # Convert to tensor
        face_tensor = np.array(face_pil).transpose((2, 0, 1)) / 255.0
        face_tensor = torch.tensor(face_tensor).unsqueeze(0).float().to(device)

        # Get embedding
        embedding = resnet(face_tensor).detach().cpu().numpy()[0]
        return embedding
    except Exception as e:
        print("Face embedding error:", e)
        return None

def is_face_match(embed1, embed2, threshold=0.8):
    return np.linalg.norm(embed1 - embed2) < threshold

# --- Registration ---
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

# --- Verification ---
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

# --- Doctor waiting count ---
@app.get("/count/{doctor_name}")
def get_count(doctor_name: str):
    doctor = get_or_create_doctor(doctor_name)
    return {"doctorName": doctor["name"], "waiting_count": doctor["waiting_count"]}

