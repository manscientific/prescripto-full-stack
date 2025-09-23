from pymongo import MongoClient

# MongoDB connection URI
MONGO_URI = "mongodb://localhost:27017/"

# Create a client
client = MongoClient(MONGO_URI)

# Select DB and collection
db = client["waiting_room"]
users = db["users"]
