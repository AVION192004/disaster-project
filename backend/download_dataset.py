import kagglehub

# Download latest version
path = kagglehub.dataset_download("sarthaktandulje/disaster-damage-5class")

print("Path to dataset files:", path)