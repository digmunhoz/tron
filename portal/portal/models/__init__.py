import os
from django.db import models
from importlib import import_module

models_dir = os.path.dirname(__file__)
for filename in os.listdir(models_dir):
    if filename.endswith(".py") and filename != "__init__.py":
        module_name = f"{__name__}.{filename[:-3]}"
        import_module(module_name)
