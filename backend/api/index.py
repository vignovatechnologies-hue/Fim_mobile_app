import sys
import os

# Ensure backend root directory is in python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import app
