import os
from bson.objectid import ObjectId
from pathlib import Path

from flask import Flask, request
from flask_cors import CORS
from pymongo.mongo_client import MongoClient

from argon2 import PasswordHasher
from dotenv import load_dotenv
import jwt

load_dotenv('.env')


SECRET = os.getenv('SECRET')

db_uri = f"mongodb+srv://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}@cluster0.w3vpkf7.mongodb.net/?retryWrites=true&w=majority"
db_uri = "mongodb://localhost:27017"
          
client = MongoClient(db_uri)
db = client.test
Users = db.user
Workspaces = db.workspace

workspace_dir = Path('./workspaces')

ph = PasswordHasher()


app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'https://rollingrocky360.github.io'], supports_credentials=True)

@app.get('/ping')
def ping():
    return "pong"

@app.get('/auth')
def auth_get():
    token = request.headers.get('Authorization').split()[1]
    user_id = jwt.decode(token, SECRET, algorithms=["HS256"])
    user = Users.find_one({'_id': ObjectId(user_id['_id'])})
    user['_id'] = str(user['_id'])
    return user


@app.get('/user')
def user_get():
    email, password = request.headers.get('Authorization').split()[1].split(':')
    user = Users.find_one({ 'email': email })
    user['_id'] = str(user['_id'])
    user['token'] = jwt.encode({'_id': user['_id']}, SECRET)
    if ph.verify(user['password'], password):
        return user
    return { 'error': 'Invalid credentials' }


@app.post('/user')
def user_post():
    creds = request.json
    if Users.find_one({ 'email': creds['email'] }):
        return { 'error': 'User Already Exists' }
    
    creds['password'] = ph.hash(creds['password'])
    id = str(Users.insert_one(creds).inserted_id)
    creds['_id'] = id
    creds['token'] = jwt.encode({'_id': id}, SECRET)
    Workspaces.insert_one({ 'user_id': id, 'workspaces': [] })
    return creds


@app.get('/workspace')
def workspace_get():
    user_id = jwt.decode(request.headers.get('Authorization').split()[1], SECRET, algorithms=['HS256'])
    return Workspaces.find_one({ 'user_id': user_id['_id'] })['workspaces']

@app.post('/workspace')
def workspace_post():
    user_id = jwt.decode(request.headers.get('Authorization').split()[1], SECRET, algorithms=['HS256'])
    workspace_name = request.json['name']
    Workspaces.update_one({ 'user_id': user_id['_id'] }, { '$push': { 'workspaces': workspace_name}})
    (workspace_dir / workspace_name).mkdir()
    return Workspaces.find_one({'user_id': user_id['_id']})['workspaces']
