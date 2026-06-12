# app.py
from flask import Flask, render_template, jsonify, send_file
import librosa
import os
import matplotlib
matplotlib.use('Agg')  # Use a non-GUI backend
import matplotlib.pyplot as plt
import numpy as np
import io
import base64
import joblib
from sklearn.metrics import accuracy_score

app = Flask(__name__)
AUDIO_FOLDER = "cats_dogs"

# Load ML model and scaler
model = joblib.load("cat_dog_model.pkl")
scaler = joblib.load("scaler.pkl")

@app.route("/predict_audio/<filename>")
def predict_audio(filename):  # Renamed function
    filepath = os.path.join(AUDIO_FOLDER, filename)
    
    # Extract features from selected audio file
    y, sr = librosa.load(filepath, sr=None)
    features = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).reshape(1, -1)
    
    # Scale features
    features = scaler.transform(features)
    
    # Predict probabilities
    prediction = model.predict_proba(features)
    
    return jsonify({
        "cat_probability": round(prediction[0][0] * 100, 2),
        "dog_probability": round(prediction[0][1] * 100, 2),
        "predicted_class": "Cat" if prediction[0][0] > prediction[0][1] else "Dog"
    })

@app.route("/model_accuracy")
def model_accuracy():
    # Load test data
    X_test, y_test = joblib.load("test_data.pkl")  # Ensure test data is saved beforehand
    model = joblib.load("cat_dog_model.pkl")
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred) * 100

    return jsonify({"accuracy": round(accuracy, 2)})


@app.route("/")
def index():
    files = [f for f in os.listdir(AUDIO_FOLDER) if f.endswith(".wav") or f.endswith(".mp3")]
    return render_template("va7.html", audio_files=files)

@app.route("/audio/<filename>")
def serve_audio(filename):
    filepath = os.path.join(AUDIO_FOLDER, filename)
    return send_file(filepath)

@app.route("/waveform/<filename>")
def waveform(filename):
    filepath = os.path.join(AUDIO_FOLDER, filename)
    y, sr = librosa.load(filepath, sr=None)
    return jsonify({"waveform": y.tolist(), "sr": sr})

@app.route("/oscillogram/<filename>")
def oscillogram(filename):
    filepath = os.path.join(AUDIO_FOLDER, filename)
    y, sr = librosa.load(filepath, sr=None)
    hop = int(sr * 0.01)
    osc = [float(np.mean(np.abs(y[i:i+hop]))) for i in range(0, len(y), hop)]  # Convert to Python float
    return jsonify({"oscillogram": osc, "sr": sr})


@app.route('/spectrogram/<filename>')
def spectrogram(filename):
    filepath = os.path.join(AUDIO_FOLDER, filename)
    y, sr = librosa.load(filepath)
    S = librosa.feature.melspectrogram(y=y, sr=sr)
    S_dB = librosa.power_to_db(S, ref=np.max)

    # Plot and convert to base64 image
    fig, ax = plt.subplots()
    img = librosa.display.specshow(S_dB, sr=sr, ax=ax, x_axis='time', y_axis='mel')
    fig.tight_layout(pad=0)

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')

    return jsonify({'image': image_base64})

@app.route("/predict/<filename>")
def predict(filename):
    if "cat" in filename.lower():
        prediction = "Cat"
    elif "dog" in filename.lower():
        prediction = "Dog"
    else:
        prediction = "Unknown"
    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    app.run(debug=True)
