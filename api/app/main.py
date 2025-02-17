import importlib
import os
from fastapi import FastAPI
from .routers import *
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tron",
    summary="Platform as a Service built on top of kubernetes",
    version="1.0.0",
)

ROUTERS_PATH = "./app/routers"


def include_all_routers(app: FastAPI):
    for file in os.listdir(ROUTERS_PATH):
        if file.endswith(".py") and file != "__init__.py":
            module_name = file[:-3]
            module_path = f"app.routers.{module_name}"

            module = importlib.import_module(module_path)

            if hasattr(module, "router"):
                app.include_router(module.router, tags=[module_name])


include_all_routers(app)
