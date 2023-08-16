import asyncio
import json
from pathlib import Path

from websockets import server
from websockets.exceptions import ConnectionClosedError
import websockets

ROOT = Path('./workspaces/')
CONNECTED = set()
LOCKED = set()

async def handler(sock):    
    CONNECTED.add(sock)
    print("connected")

    try:
        async for msg in sock:
            print(msg)
            event = json.loads(msg)
            evt_type = event['type']

            if evt_type == 'create':
                filename = event['filename']
                new_file_path = ROOT / Path(filename)
                new_file_path.touch()

                LOCKED.add(filename)

                response = {
                    'type': 'create',
                    'filename': filename
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response))
            
            elif evt_type == 'read':
                filename = Path(event['filename'])
                with (ROOT / filename).open() as file:
                    response = {
                        'type': 'read',
                        'filename': filename.name,
                        'payload': file.read()
                    }
                    await sock.send(json.dumps(response))
            
            elif evt_type == 'write':
                filename = Path(event['filename'])
                data = event['data']

                with (ROOT / filename).open('w') as file:
                    file.write(data)

                response = {
                    'type': 'update',
                    'filename': filename.name,
                    'payload': data,
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response)) 
            
            elif evt_type == 'close':
                filename = Path(event['filename'])
                LOCKED.discard(filename.name)

                response = {
                    'type': 'unlock',
                    'filename': filename.name,
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response))
            
            elif evt_type == 'delete':
                filename = Path(event['filename'])
                (ROOT / filename).unlink()
                LOCKED.discard(filename.name)

                response = {
                    'type': 'delete',
                    'filename': filename.name,
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response))

            elif evt_type in ('lock', 'unlock', 'message'):
                if evt_type == 'lock': LOCKED.add(event['filename'])
                elif evt_type == 'unlock': LOCKED.discard(event['filename'])
                websockets.broadcast(CONNECTED - {sock}, msg)
            
            elif evt_type == 'init':
                workspace_path = ROOT / Path(event['workspace'])
                files = sorted([file.name for file in workspace_path.iterdir()])

                response = {
                    'type': 'init',
                    'files': files,
                    'locked': list(LOCKED),
                }
                await sock.send(json.dumps(response))
            
            elif evt_type == 'ping':
                await sock.send('pong')

    except ConnectionClosedError:
        print("Disconnected abruptly.")
    
    else:
        print("Disconnected.")
    
    finally:
        CONNECTED.remove(sock)


async def run_socketserver():
    async with server.serve(handler):
        await asyncio.Future()

if __name__ == '__main__':
    asyncio.run(run_socketserver())