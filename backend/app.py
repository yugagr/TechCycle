from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from predict_component import predict_image
import shutil
import os

app = FastAPI()

# ✅ Enable CORS so frontend can access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can change "*" to ["http://localhost:3000"] if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "API is running"}

# 🔁 Renamed the route from /predict to /identify-ewaste
@app.post("/identify-ewaste")
async def identify_ewaste(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Predict using your model
        result = predict_image(file_path)

        # Clean up
        os.remove(file_path)

        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
