import asyncio
import json
from pathlib import Path

from websockets import server
from websockets.exceptions import ConnectionClosedError
import websockets

ROOT = Path('D://Projects/Distributed File System/Backend/files/')
CONNECTED = set()

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

                response = {
                    'type': 'create',
                    'filename': filename
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response))
            
            elif evt_type == 'read':
                filename = event['filename']
                with (ROOT / filename).open() as file:
                    response = {
                        'type': 'read',
                        'filename': filename,
                        'payload': file.read()
                    }
                    await sock.send(json.dumps(response))
            
            elif evt_type == 'write':
                filename = event['filename']
                data = event['data']

                with (ROOT / filename).open('w') as file:
                    file.write(data)

                response = {
                    'type': 'update',
                    'filename': filename,
                    'payload': data,
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response)) 
            
            elif evt_type == 'close':
                filename = event['filename']

                response = {
                    'type': 'unlock',
                    'filename': filename,
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response))
            
            elif evt_type == 'delete':
                filename = event['filename']
                (ROOT / filename).unlink()

                response = {
                    'type': 'delete',
                    'filename': filename,
                }
                websockets.broadcast(CONNECTED - {sock}, json.dumps(response))

            elif evt_type == 'lock' or evt_type == 'unlock':
                websockets.broadcast(CONNECTED - {sock}, msg)
            
            elif evt_type == 'init':
                files = sorted([file.name for file in ROOT.iterdir()])

                response = {
                    'type': 'init',
                    'files': files
                }
                await sock.send(json.dumps(response))

    except ConnectionClosedError:
        print("Disconnected abruptly.")
    
    else:
        print("Disconnected.")
    
    finally:
        CONNECTED.remove(sock)

            

async def main():
    async with server.serve(handler, 'localhost', 8000):
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
