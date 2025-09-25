from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()
MONGO_URI=os.getenv("MONGO_URI")

# MongoDB connection URI


# Create a client
client = MongoClient(MONGO_URI)

# Select DB and collection
db = client["waiting_room"]
users = db["users"]
