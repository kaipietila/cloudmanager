from fastapi import FastAPI
import requests
from fastapi.middleware.cors import CORSMiddleware
from cachetools import cached, TTLCache

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

URL = 'https://api.aiven.io/v1/clouds'

def get_aiven_clouds():
    response = requests.get(URL)
    if response.status_code == 200:
        return response.json()
    else:
        return {}

@cached(cache=TTLCache(maxsize=1024, ttl=600))
def get_all_clouds():
    available_clouds = []
    cloud_json = get_aiven_clouds()
    for cloud in cloud_json.get('clouds'):
        available_cloud = dict(
            cloud_description=cloud['cloud_description'],
            cloud_name=cloud['cloud_name'],
            geo_latitude=cloud['geo_latitude'],
            geo_longitude=cloud['geo_longitude']
        )
        available_clouds.append(available_cloud)
    return available_clouds

@app.get("/clouds")
def get_clouds():
    clouds = get_all_clouds()
    return clouds
