"""
Mango Detection Model Training Script
Downloads dataset from Roboflow and trains YOLOv8 model

Usage:
    python mango_detection.py

Requirements:
    pip install roboflow ultralytics torch torchvision
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def install_dependencies():
    """Install required packages if not available"""
    import subprocess
    packages = ["roboflow", "ultralytics", "torch", "torchvision"]
    for package in packages:
        try:
            __import__(package)
        except ImportError:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Ensure dependencies are installed
install_dependencies()

from roboflow import Roboflow
from ultralytics import YOLO
from dotenv import load_dotenv

# Load environment variables from training_scripts/.env
load_dotenv(Path(__file__).parent / ".env")

# ==================== CONFIGURATION ====================

# Roboflow Configuration (reads from .env)
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "towppys-nest")
ROBOFLOW_PROJECT = os.getenv("ROBOFLOW_PROJECT", "mangodetect")
ROBOFLOW_VERSION = int(os.getenv("ROBOFLOW_VERSION", "7"))

# Training Configuration
MODEL_SIZE = "yolov8n"  # Options: yolov8n, yolov8s, yolov8m, yolov8l, yolov8x
EPOCHS = 100
IMAGE_SIZE = 640
BATCH_SIZE = 16
PATIENCE = 20  # Early stopping patience

# Paths
BASE_DIR = Path(__file__).parent.parent
DATASET_DIR = BASE_DIR / "datasets" / "roboflow_yolov8"
MODELS_DIR = BASE_DIR / "models"
RUNS_DIR = BASE_DIR / "training_scripts" / "runs"

# ===========================================================


def download_dataset():
    """Download dataset from Roboflow"""
    print("\n" + "="*50)
    print("📥 DOWNLOADING DATASET FROM ROBOFLOW")
    print("="*50)
    
    if not ROBOFLOW_API_KEY:
        print("❌ Error: ROBOFLOW_API_KEY not found in environment variables")
        print("   Set it in your .env file or as environment variable")
        print("   Get your API key from: https://app.roboflow.com/account/api")
        sys.exit(1)
    
    try:
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        project = rf.workspace(ROBOFLOW_WORKSPACE).project(ROBOFLOW_PROJECT)
        
        print(f"📁 Workspace: {ROBOFLOW_WORKSPACE}")
        print(f"📂 Project: {ROBOFLOW_PROJECT}")
        print(f"📌 Version: {ROBOFLOW_VERSION}")
        
        # Download in YOLOv8 format
        dataset = project.version(ROBOFLOW_VERSION).download(
            "yolov8",
            location=str(DATASET_DIR)
        )
        
        print(f"✅ Dataset downloaded to: {DATASET_DIR}")
        return dataset
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        print("\n💡 Tips:")
        print("   1. Check your API key is correct")
        print("   2. Verify workspace and project names")
        print("   3. Ensure you have access to the project")
        sys.exit(1)


def train_model(dataset_path: Path):
    """Train YOLOv8 model on the dataset"""
    print("\n" + "="*50)
    print("🚀 STARTING MODEL TRAINING")
    print("="*50)
    
    # Create output directories
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Find data.yaml file
    data_yaml = dataset_path / "data.yaml"
    if not data_yaml.exists():
        # Try to find it in subdirectories
        yaml_files = list(dataset_path.rglob("data.yaml"))
        if yaml_files:
            data_yaml = yaml_files[0]
        else:
            print(f"❌ Error: data.yaml not found in {dataset_path}")
            sys.exit(1)
    
    print(f"📄 Using config: {data_yaml}")
    print(f"🤖 Model: {MODEL_SIZE}")
    print(f"📊 Epochs: {EPOCHS}")
    print(f"🖼️  Image Size: {IMAGE_SIZE}")
    print(f"📦 Batch Size: {BATCH_SIZE}")
    
    # Load pretrained model
    model = YOLO(f"{MODEL_SIZE}.pt")
    
    # Train the model
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_name = f"mango_detection_{timestamp}"
    
    results = model.train(
        data=str(data_yaml),
        epochs=EPOCHS,
        imgsz=IMAGE_SIZE,
        batch=BATCH_SIZE,
        patience=PATIENCE,
        project=str(RUNS_DIR),
        name=run_name,
        exist_ok=True,
        pretrained=True,
        optimizer="auto",
        verbose=True,
        seed=42,
        deterministic=True,
        plots=True,
        save=True,
        save_period=10,  # Save checkpoint every 10 epochs
    )
    
    print("\n" + "="*50)
    print("✅ TRAINING COMPLETE!")
    print("="*50)
    
    return model, run_name


def validate_model(model, dataset_path: Path):
    """Validate the trained model"""
    print("\n" + "="*50)
    print("📊 VALIDATING MODEL")
    print("="*50)
    
    data_yaml = dataset_path / "data.yaml"
    if not data_yaml.exists():
        yaml_files = list(dataset_path.rglob("data.yaml"))
        if yaml_files:
            data_yaml = yaml_files[0]
    
    metrics = model.val(data=str(data_yaml))
    
    print(f"\n📈 Validation Results:")
    print(f"   mAP50: {metrics.box.map50:.4f}")
    print(f"   mAP50-95: {metrics.box.map:.4f}")
    print(f"   Precision: {metrics.box.mp:.4f}")
    print(f"   Recall: {metrics.box.mr:.4f}")
    
    return metrics


def export_model(model, run_name: str):
    """Export trained model to different formats"""
    print("\n" + "="*50)
    print("📦 EXPORTING MODEL")
    print("="*50)
    
    # Save best model to models directory
    best_model_src = RUNS_DIR / run_name / "weights" / "best.pt"
    best_model_dst = MODELS_DIR / f"mango_detector_{run_name}.pt"
    
    if best_model_src.exists():
        import shutil
        shutil.copy(best_model_src, best_model_dst)
        print(f"✅ Best model saved to: {best_model_dst}")
    
    # Export to ONNX for deployment
    try:
        onnx_path = model.export(format="onnx", imgsz=IMAGE_SIZE)
        print(f"✅ ONNX model exported to: {onnx_path}")
    except Exception as e:
        print(f"⚠️ ONNX export failed: {e}")
    
    # Export to TorchScript
    try:
        torchscript_path = model.export(format="torchscript", imgsz=IMAGE_SIZE)
        print(f"✅ TorchScript model exported to: {torchscript_path}")
    except Exception as e:
        print(f"⚠️ TorchScript export failed: {e}")
    
    return best_model_dst


def test_inference(model, dataset_path: Path):
    """Test inference on sample images"""
    print("\n" + "="*50)
    print("🔍 TESTING INFERENCE")
    print("="*50)
    
    # Find test images
    test_dirs = [
        dataset_path / "test" / "images",
        dataset_path / "valid" / "images",
        dataset_path / "val" / "images",
    ]
    
    test_images = []
    for test_dir in test_dirs:
        if test_dir.exists():
            test_images = list(test_dir.glob("*.jpg"))[:5]
            break
    
    if not test_images:
        print("⚠️ No test images found for inference testing")
        return
    
    print(f"Testing on {len(test_images)} sample images...")
    
    for img_path in test_images:
        results = model.predict(str(img_path), conf=0.25)
        detections = len(results[0].boxes)
        print(f"   📷 {img_path.name}: {detections} detection(s)")


def main():
    """Main training pipeline"""
    print("\n" + "="*60)
    print("MANGO DETECTION MODEL TRAINING PIPELINE")
    print("="*60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Download dataset
    dataset = download_dataset()
    dataset_path = DATASET_DIR
    
    # Step 2: Train model
    model, run_name = train_model(dataset_path)
    
    # Step 3: Validate model
    validate_model(model, dataset_path)
    
    # Step 4: Export model
    model_path = export_model(model, run_name)
    
    # Step 5: Test inference
    test_inference(model, dataset_path)
    
    print("\n" + "="*60)
    print("🎉 TRAINING PIPELINE COMPLETE!")
    print("="*60)
    print(f"📁 Dataset: {dataset_path}")
    print(f"📁 Training runs: {RUNS_DIR / run_name}")
    print(f"📁 Saved model: {model_path}")
    print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n💡 Next steps:")
    print("   1. Check training metrics in runs folder")
    print("   2. Use the exported model for inference")
    print("   3. Deploy to your application")


if __name__ == "__main__":
    main()
