import librosa
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os
from sklearn.metrics import confusion_matrix
from sklearn.metrics import accuracy_score
from sklearn.model_selection import StratifiedShuffleSplit

# Define folder where ALL audio files are stored
AUDIO_FOLDER = "cats_dogs"

# Function to extract MFCC features
def extract_features(file_path):
    y, sr = librosa.load(file_path, sr=None)
    return librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1)

# Get all audio files
files = [os.path.join(AUDIO_FOLDER, f) for f in os.listdir(AUDIO_FOLDER) if f.endswith(".wav")]

# Label audio files based on filenames
data, labels = [], []
for file in files:
    data.append(extract_features(file))
    
    if "cat" in file.lower():
        labels.append(0)  # Cat label
    elif "dog" in file.lower():
        labels.append(1)  # Dog label
    else:
        print(f"Skipping unknown file: {file}")

# Convert to NumPy array
X = np.array(data)
y = np.array(labels)

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Normalize data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model & scaler
joblib.dump(model, "cat_dog_model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("Model trained and saved successfully.")
# Make predictions on the test set
y_pred = model.predict(X_test)

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred) * 100

# Save test dataset for accuracy calculation in Flask
joblib.dump((X_test, y_test), "test_data.pkl")
# Save model & scaler
joblib.dump(model, "cat_dog_model.pkl")
joblib.dump(scaler, "scaler.pkl")

#print("Training set size:", X_train.shape[0])
#print("Test set size:", X_test.shape[0])

labels = [0, 1]  # Ensure both cat (0) and dog (1) are included
cm = confusion_matrix(y_test, y_pred, labels=labels)
#print("Confusion Matrix:\n", cm)
sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(sss.split(X, y))
X_train, X_test = X[train_idx], X[test_idx]
y_train, y_test = y[train_idx], y[test_idx]


























#print(f"Model trained successfully with an accuracy of: {accuracy:.2f}%")



