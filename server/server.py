from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from svm import train_student, infer, evaluate_model
import subprocess



app = Flask(__name__)
CORS(app)


def decode_base64_image(base64_string):
    """Decodes a base64-encoded image into an OpenCV image (numpy array)."""
    try:
        image_data = base64.b64decode(base64_string.split(',')[1])
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        return None


def start_caddy():
    """Starts Caddy server in the background."""
    command = ["caddy", "run", "--config", "./Caddyfile"]
    subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


start_caddy()


@app.route("/register", methods=["POST"])
def process_registration():
    """Receives student details and images, then trains the model"""
    data = request.json
    student_name = data.get("name")
    student_id = data.get("id")
    images_base64 = data.get("images", [])

    if not student_name or not student_id or len(images_base64) < 5:
        return jsonify({"error": "Insufficient data"}), 400

    images = [decode_base64_image(img) for img in images_base64]

    # Call training function
    res = train_student(images, student_name, student_id)

    return jsonify(res)


@app.route("/infer", methods=["POST"])
def process_inference():
    """Receives a base64 image, identifies students, and returns results."""
    data = request.json
    image_base64 = data.get("image")

    if not image_base64:
        return jsonify({"error": "Image not provided"}), 400

    image = decode_base64_image(image_base64)
    if image is None:
        return jsonify({"error": "Failed to decode image"}), 400

    # Call inference function
    result = infer(image)

    return jsonify(result)


@app.route("/evals", methods=["GET"])
def process_evals():
    """Triggers model evaluation and returns results."""
    result = evaluate_model()
    if not result:
        return jsonify({"error": "Not enough data to evaluate."}), 400

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)


# from flask import Flask, request, jsonify
# from flask_cors import CORS


# app = Flask(__name__)
# CORS(app)


# @app.route("/")
# def home():
#     """Simple GET route for testing in the browser"""
#     return "Welcome to the Flask API!"


# @app.route("/register", methods=["POST"])
# def register():
#     """Receives student details and prints to console"""
#     data = request.json
#     student_name = data.get("name")
#     student_id = data.get("id")
#     images_base64 = data.get("images", [])

#     # Just print the incoming data to the console
#     print("Received Data:")
#     print(f"Name: {student_name}")
#     print(f"ID: {student_id}")
#     print(f"Images: {len(images_base64)} images received")

#     if not student_name or not student_id or len(images_base64) < 5:
#         return jsonify({"error": "Insufficient data"}), 400

#     return jsonify({"message": f"Student {student_name} registered successfully!"})


# if __name__ == "__main__":
    # app.run(debug=True, host="0.0.0.0", port=5001)
