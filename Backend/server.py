import os
from bson.objectid import ObjectId
from pathlib import Path
import json

from flask import Flask, request
from flask_cors import CORS
from flask_sock import Sock, ConnectionClosed
from pymongo.mongo_client import MongoClient

from argon2 import PasswordHasher
from dotenv import load_dotenv
import jwt

load_dotenv('.env')


SECRET = os.environ('SECRET')

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


CONNECTED = set()
LOCKED = set()

websock = Sock(app)


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


@websock.route('/')
def websocket_handler(sock):
    CONNECTED.add(sock)
    print("connected")

    try:
        while True:
            msg = sock.receive()
            print(msg)
            event = json.loads(msg)
            evt_type = event['type']

            if evt_type == 'create':
                filename = event['filename']
                new_file_path = workspace_dir / Path(filename)
                new_file_path.touch()

                LOCKED.add(filename)

                response = {
                    'type': 'create',
                    'filename': filename
                }
                wsresp = json.dumps(response)
                for outbound_sock in CONNECTED - {sock}:
                    outbound_sock.send(wsresp)

            elif evt_type == 'read':
                filename = Path(event['filename'])
                with (workspace_dir / filename).open() as file:
                    response = {
                        'type': 'read',
                        'filename': filename.name,
                        'payload': file.read()
                    }
                    sock.send(json.dumps(response))

            elif evt_type == 'write':
                filename = Path(event['filename'])
                data = event['data']

                with (workspace_dir / filename).open('w') as file:
                    file.write(data)

                response = {
                    'type': 'update',
                    'filename': filename.name,
                    'payload': data,
                }
                wsresp = json.dumps(response)
                for outbound_sock in CONNECTED - {sock}:
                    outbound_sock.send(wsresp)

            elif evt_type == 'close':
                filename = Path(event['filename'])
                LOCKED.discard(filename.name)

                response = {
                    'type': 'unlock',
                    'filename': filename.name,
                }
                wsresp = json.dumps(response)
                for outbound_sock in CONNECTED - {sock}:
                    outbound_sock.send(wsresp)

            elif evt_type == 'delete':
                filename = Path(event['filename'])
                (workspace_dir / filename).unlink()
                LOCKED.discard(filename.name)

                response = {
                    'type': 'delete',
                    'filename': filename.name,
                }
                wsresp = json.dumps(response)
                for outbound_sock in CONNECTED - {sock}:
                    outbound_sock.send(wsresp)

            elif evt_type in ('lock', 'unlock', 'message'):
                if evt_type == 'lock':
                    LOCKED.add(event['filename'])
                elif evt_type == 'unlock':
                    LOCKED.discard(event['filename'])
                for outbound_sock in CONNECTED - {sock}:
                    outbound_sock.send(msg)

            elif evt_type == 'init':
                workspace_path = workspace_dir / Path(event['workspace'])
                files = sorted(
                    [file.name for file in workspace_path.iterdir()])

                response = {
                    'type': 'init',
                    'files': files,
                    'locked': list(LOCKED),
                }
                sock.send(json.dumps(response))

            elif evt_type == 'ping':
                sock.send('pong')

    except ConnectionClosed:
        print("Disconnected abruptly.")

    finally:
        CONNECTED.remove(sock)
