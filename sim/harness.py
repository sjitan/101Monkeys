import asyncio
import json
import random
import time
import websockets

# This harness is designed to simulate a client interacting with the fl_server.
# It can be expanded to generate more realistic F_t vector data.

async def send_mock_data(apv="test_apv"):
    """
    Connects to the WebSocket and sends simulated physiological data.
    """
    uri = f"ws://localhost:8000/ws/group_sync/{apv}"
    async with websockets.connect(uri) as websocket:
        print(f"Connected to {uri}")
        while True:
            # Simulate a "flinch" or other physiological event
            mock_vector = {
                "timestamp": time.time(),
                "z_rmssd": round(random.uniform(-2.0, 2.0), 4),
                "delta_pv": round(random.uniform(-1.5, 3.0), 4),
                "gaze_stability": round(random.uniform(0.5, 1.0), 4),
                "rf_bracing": round(random.uniform(0.0, 1.0), 4),
            }

            await websocket.send(json.dumps(mock_vector))
            print(f"Sent: {mock_vector}")

            # Wait for a response from the "conductor"
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                print(f"Received: {response}")
            except asyncio.TimeoutError:
                print("No message from conductor in 1s.")

            await asyncio.sleep(3) # Send data every 3 seconds

if __name__ == "__main__":
    print("Starting simulation harness...")
    # To run this, make sure the fl_server is running first.
    # Example: python3 fl_server/main.py
    # Then run this script: python3 sim/harness.py
    asyncio.run(send_mock_data())
