from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Projector Calculator Pro API")
api_router = APIRouter(prefix="/api")



def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DesignBase(BaseModel):
    name: str
    description: Optional[str] = ""
    canvas_data: Dict[str, Any] = Field(default_factory=dict)
    thumbnail: Optional[str] = None
    width: int = 800
    height: int = 800
    colors: List[str] = Field(default_factory=list)


class DesignCreate(DesignBase):
    pass


class DesignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    canvas_data: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    colors: Optional[List[str]] = None


class Design(DesignBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class ProjectionCalcBase(BaseModel):
    name: Optional[str] = None
    floor_material: int = 0
    symbol: int = 0
    optics: int = 5
    projector: int = 6
    floor_color: str = "rgb(75%, 75%, 75%)"
    spot_illuminance_lx: int = 450
    projection_height_cm: int = 900
    custom_symbol_id: Optional[str] = None
    room_photo_id: Optional[str] = None
    projection_diameter_cm: Optional[float] = None
    illuminance_factor: Optional[float] = None


class ProjectionCalcCreate(ProjectionCalcBase):
    pass


class ProjectionCalc(ProjectionCalcBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class RoomPhoto(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    data_url: str
    created_at: str = Field(default_factory=now_iso)


class RoomPhotoCreate(BaseModel):
    name: str
    data_url: str



@api_router.get("/")
async def root():
    return {"message": "Projector Calculator Pro API", "version": "1.0.0"}


@api_router.post("/designs", response_model=Design)
async def create_design(payload: DesignCreate):
    design = Design(**payload.model_dump())
    await db.designs.insert_one(design.model_dump())
    return design


@api_router.get("/designs", response_model=List[Design])
async def list_designs():
    docs = await db.designs.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return docs


@api_router.get("/designs/{design_id}", response_model=Design)
async def get_design(design_id: str):
    doc = await db.designs.find_one({"id": design_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Design not found")
    return doc


@api_router.put("/designs/{design_id}", response_model=Design)
async def update_design(design_id: str, payload: DesignUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    res = await db.designs.find_one_and_update(
        {"id": design_id}, {"$set": update}, return_document=True, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(404, "Design not found")
    return res


@api_router.delete("/designs/{design_id}")
async def delete_design(design_id: str):
    res = await db.designs.delete_one({"id": design_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Design not found")
    return {"ok": True}


@api_router.post("/projections", response_model=ProjectionCalc)
async def create_projection(payload: ProjectionCalcCreate):
    proj = ProjectionCalc(**payload.model_dump())
    await db.projections.insert_one(proj.model_dump())
    return proj


@api_router.get("/projections", response_model=List[ProjectionCalc])
async def list_projections():
    docs = await db.projections.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.delete("/projections/{proj_id}")
async def delete_projection(proj_id: str):
    res = await db.projections.delete_one({"id": proj_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api_router.post("/room-photos", response_model=RoomPhoto)
async def create_room_photo(payload: RoomPhotoCreate):
    photo = RoomPhoto(**payload.model_dump())
    await db.room_photos.insert_one(photo.model_dump())
    return photo


@api_router.get("/room-photos", response_model=List[RoomPhoto])
async def list_room_photos():
    docs = await db.room_photos.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.get("/room-photos/{photo_id}", response_model=RoomPhoto)
async def get_room_photo(photo_id: str):
    doc = await db.room_photos.find_one({"id": photo_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return doc


@api_router.delete("/room-photos/{photo_id}")
async def delete_room_photo(photo_id: str):
    res = await db.room_photos.delete_one({"id": photo_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
