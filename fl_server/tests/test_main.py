from fastapi.testclient import TestClient
from fl_server.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "101st Monkey Labs Federated Learning Server is running."}

def test_upload_model_delta():
    response = client.post("/api/v1/delta/upload", json={"apv": "test_apv", "model_delta": "test_delta"})
    assert response.status_code == 200
    assert response.json() == {"status": "success", "message": "Delta for test_apv received and queued for aggregation."}

def test_download_model():
    response = client.get("/api/v1/model/download/test_apv")
    assert response.status_code == 200
    assert response.json() == {"status": "success", "apv": "test_apv", "model_version": "0.1.0-alpha", "model_data": "..."}
