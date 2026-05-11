import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://selector.alis-is.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess

def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert "version" in data
    assert "message" in data

class TestDesigns:
    def test_design_full_lifecycle(self, s):
        payload = {
            "name": "TEST_design_1",
            "description": "test",
            "canvas_data": {"strokes": [{"x": 1, "y": 2}]},
            "thumbnail": "data:image/png;base64,AAAA",
            "width": 800,
            "height": 800,
            "colors": ["#ff0000", "#00ff00"],
        }
        r = s.post(f"{API}/designs", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "_id" not in d
        assert d["name"] == "TEST_design_1"
        assert d["colors"] == ["#ff0000", "#00ff00"]
        assert "id" in d and isinstance(d["id"], str)
        did = d["id"]

        r = s.get(f"{API}/designs")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(x["id"] == did for x in items)
        assert all("_id" not in x for x in items)

        r = s.get(f"{API}/designs/{did}")
        assert r.status_code == 200
        assert r.json()["id"] == did
        assert "_id" not in r.json()

        r = s.put(f"{API}/designs/{did}", json={"name": "TEST_design_renamed", "colors": ["#0000ff"]})
        assert r.status_code == 200
        upd = r.json()
        assert upd["name"] == "TEST_design_renamed"
        assert upd["colors"] == ["#0000ff"]

        r = s.get(f"{API}/designs/{did}")
        assert r.json()["name"] == "TEST_design_renamed"


        r = s.delete(f"{API}/designs/{did}")
        assert r.status_code == 200


        r = s.get(f"{API}/designs/{did}")
        assert r.status_code == 404

    def test_design_404(self, s):
        fake = "nonexistent-uuid-1234"
        assert s.get(f"{API}/designs/{fake}").status_code == 404
        assert s.put(f"{API}/designs/{fake}", json={"name": "x"}).status_code == 404
        assert s.delete(f"{API}/designs/{fake}").status_code == 404


class TestProjections:
    def test_projection_lifecycle(self, s):
        payload = {
            "name": "TEST_projection",
            "floor_material": 0,
            "symbol": 0,
            "optics": 5,
            "projector": 6,
            "floor_color": "rgb(75%, 75%, 75%)",
            "spot_illuminance_lx": 450,
            "projection_height_cm": 900,
            "projection_diameter_cm": 120.5,
            "illuminance_factor": 0.85,
        }
        r = s.post(f"{API}/projections", json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert "_id" not in p
        assert p["name"] == "TEST_projection"
        assert p["projection_diameter_cm"] == 120.5
        pid = p["id"]

        r = s.get(f"{API}/projections")
        assert r.status_code == 200
        items = r.json()
        assert any(x["id"] == pid for x in items)
        assert all("_id" not in x for x in items)

        r = s.delete(f"{API}/projections/{pid}")
        assert r.status_code == 200

        assert s.delete(f"{API}/projections/{pid}").status_code == 404


class TestRoomPhotos:
    def test_room_photo_lifecycle(self, s):
        payload = {"name": "TEST_room", "data_url": "data:image/png;base64,iVBORw0KGgo="}
        r = s.post(f"{API}/room-photos", json=payload)
        assert r.status_code == 200, r.text
        ph = r.json()
        assert "_id" not in ph
        assert ph["name"] == "TEST_room"
        assert ph["data_url"].startswith("data:image/png")
        rid = ph["id"]

        r = s.get(f"{API}/room-photos")
        assert r.status_code == 200
        assert any(x["id"] == rid for x in r.json())

        r = s.get(f"{API}/room-photos/{rid}")
        assert r.status_code == 200
        assert r.json()["id"] == rid

        r = s.delete(f"{API}/room-photos/{rid}")
        assert r.status_code == 200

        assert s.get(f"{API}/room-photos/{rid}").status_code == 404
        assert s.delete(f"{API}/room-photos/{rid}").status_code == 404
