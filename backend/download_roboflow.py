from roboflow import Roboflow

rf = Roboflow(api_key="is0xntYjzXQW5sHhnTy9")

project = rf.workspace("model-1-jwssw").project("natural-disaster-damage")
dataset = project.version(1).download("yolov8")  # best format for detection