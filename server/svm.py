import os
import numpy as np
import pickle
from deepface import DeepFace
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, roc_auc_score
import cv2

# Paths
DATASET_PATH = "dataset/train/"
MODEL_PATH = "models/face_recognizer.pkl"


def load_model():
    """Loads the latest trained model, or initializes a new one if not found."""
    if os.path.exists(MODEL_PATH):
        print("Model found, loading existing model.")
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    else:
        print("Model not found, initializing new model.")
        # Added X_test, y_test
        return [], [], [], [], LabelEncoder(), SVC(kernel="linear", probability=True)


def save_model(X_train, y_train, X_test, y_test, label_encoder, classifier):
    """Saves embeddings, test data, and model."""
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump((X_train, y_train, X_test, y_test,
                    label_encoder, classifier), f)
    print(f"Embeddings and test data saved to {MODEL_PATH}.")


def train_student(photos, name, student_id):
    """Extracts face embeddings from multiple photos and updates the model."""
    print(f"Training for student {name} ({student_id}) started.")

    X_train, y_train, X_test, y_test, label_encoder, classifier = load_model()

    student_label = f"{name}_{student_id}"
    student_folder = os.path.join(DATASET_PATH, student_label)
    os.makedirs(student_folder, exist_ok=True)
    print(f"Student folder created at {student_folder}")

    face_count = 0
    embeddings = []
    labels = []

    # First, extract all faces and their embeddings
    for idx, photo in enumerate(photos):
        print(f"Processing photo {idx + 1}/{len(photos)} for student {name}.")

        # Detect faces
        faces = DeepFace.extract_faces(
            photo, detector_backend="centerface", enforce_detection=False)

        for face in faces:
            print(
                f"Face: {face['facial_area']}, Confidence: {face['confidence']}")

        # Filter out faces with confidence < 0.5
        faces = [face for face in faces if face["confidence"] > 0.5]

        if not faces:
            print(f"No faces detected in photo {idx + 1}. Skipping.")
            continue

        if len(faces) > 1:
            return {"status": "error", "message": "More than one face found in some photos. Please ensure only one face is submitted."}

        face_count += 1

        for face_data in faces:
            facial_area = face_data["facial_area"]
            x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]
            face = photo[y:y+h, x:x+w]

            if face.size == 0:
                print(f"Face region is empty in photo {idx + 1}. Skipping.")
                continue

            # Save the extracted face image to disk
            extracted_face_path = os.path.join(
                student_folder, f"face_{idx}.jpg")
            cv2.imwrite(extracted_face_path, face)
            print(f"Saved extracted face at {extracted_face_path}")

            # Extract embedding
            embedding = DeepFace.represent(
                face, model_name="Facenet512", enforce_detection=False)[0]["embedding"]

            # Store embeddings and labels temporarily
            embeddings.append(embedding)
            labels.append(student_label)

    # Check if we have at least 5 faces before proceeding
    if len(embeddings) < 5:
        return {"status": "error", "message": f"Only {len(embeddings)} faces detected. At least 5 faces are required."}

    # Return appropriate message based on face detection count for original photos
    if face_count <= len(photos) / 2:
        return {"status": "error", "message": "No faces detected in at least 50% of the input images."}

    # Split the embeddings into train/test sets (80/20)
    from sklearn.model_selection import train_test_split

    if len(embeddings) > 0:
        # Create indices for splitting
        indices = list(range(len(embeddings)))
        train_indices, test_indices = train_test_split(
            indices, test_size=0.2, random_state=42)

        # Append train data
        for i in train_indices:
            X_train.append(embeddings[i])
            y_train.append(labels[i])

        # Append test data
        for i in test_indices:
            X_test.append(embeddings[i])
            y_test.append(labels[i])

    # Persist embeddings & labels
    save_model(X_train, y_train, X_test, y_test, label_encoder, classifier)

    # Check if we have at least 2 unique students before training
    unique_students = len(set(y_train))
    print(f"Current unique students: {unique_students}")

    if unique_students > 1:
        print(
            f"Training classifier with {len(X_train)} samples and {unique_students} unique labels.")
        y_train_encoded = label_encoder.fit_transform(y_train)
        classifier.fit(X_train, y_train_encoded)
        save_model(X_train, y_train, X_test, y_test, label_encoder, classifier)
        print(f"Model trained and saved to {MODEL_PATH}.")
    else:
        print("Not enough students to train yet. Waiting for at least 2 students.")

    return {"status": "success", "message": f"Student {name} ({student_id}) added with {len(embeddings)} faces. {len(train_indices)} for training, {len(test_indices)} for testing."}


def infer(photo):
    """Identifies all students in a webcam photo and returns names, student_ids, confidence scores, and emotions."""
    print("Inference started.")

    if not os.path.exists(MODEL_PATH):
        return {"status": "error", "message": "No trained model found."}

    print("Loading trained model.")
    X_train, y_train, X_test, y_test, label_encoder, classifier = load_model()

    print("Detecting faces in the input photo.")
    try:
        faces = DeepFace.extract_faces(
            photo, detector_backend="centerface", enforce_detection=False)
    except ValueError:
        return {"status": "error", "message": "No faces detected."}

    for face in faces:
        print(f"Face: {face['facial_area']}, Confidence: {face['confidence']}")

    faces = [face for face in faces if face["confidence"] > 0.5]

    if not faces:
        return {"status": "error", "message": "No faces detected."}

    results = []

    for face_data in faces:
        facial_area = face_data["facial_area"]
        x, y, w, h = facial_area["x"], facial_area["y"], facial_area["w"], facial_area["h"]
        face = photo[y:y+h, x:x+w]

        if face.size == 0:
            continue

        print("Extracting embedding for detected face.")
        embedding = DeepFace.represent(
            face, model_name="Facenet512", enforce_detection=False)[0]["embedding"]

        print("Predicting class for the face embedding.")
        probabilities = classifier.predict_proba([embedding])[0]
        best_idx = np.argmax(probabilities)
        confidence = probabilities[best_idx] * 100
        label = label_encoder.inverse_transform([best_idx])[0]

        name, student_id = label.rsplit("_", 1)

        print("Performing emotion recognition.")
        emotion_analysis = DeepFace.analyze(
            face, actions=['emotion'], enforce_detection=False)
        print(emotion_analysis)
        emotion = emotion_analysis[0]['dominant_emotion']

        if confidence > 50:
            results.append({
                "name": name,
                "student_id": student_id,
                "confidence": round(confidence, 2),
                "emotion": emotion if emotion else "neutral"
            })

    print(f"Inference results: {results}")
    return results if results else {"status": "error", "message": "Unknown face."}


def evaluate_model():
    """Evaluates the performance of the face recognition model."""
    try:
        X_train, y_train, X_test, y_test, label_encoder, classifier = load_model()

        if len(X_test) == 0 or len(y_test) == 0:
            return {"status": "error", "message": "No test data available for evaluation."}

        if len(set(y_test)) < 2:
            return {"status": "error", "message": "Not enough classes to evaluate."}

        # Encode labels for test data
        y_test_encoded = label_encoder.transform(y_test)

        # Predict on test data
        y_pred = classifier.predict(X_test)
        y_pred_proba = classifier.predict_proba(X_test) if hasattr(
            classifier, "predict_proba") else None

        # Metrics
        accuracy = accuracy_score(y_test_encoded, y_pred)
        precision = precision_score(
            y_test_encoded, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test_encoded, y_pred,
                              average="weighted", zero_division=0)
        f1 = f1_score(y_test_encoded, y_pred,
                      average="weighted", zero_division=0)
        conf_matrix = confusion_matrix(y_test_encoded, y_pred).tolist()
        class_report = classification_report(
            y_test_encoded, y_pred, output_dict=True)

        # ROC AUC (only if there are at least 2 classes)
        if y_pred_proba is not None and len(set(y_test_encoded)) > 1:
            try:
                roc_auc = roc_auc_score(
                    y_test_encoded, y_pred_proba, multi_class="ovr")
            except ValueError:
                roc_auc = None
        else:
            roc_auc = None

        # Summary
        result = {
            "status": "success",
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
                "confusion_matrix": conf_matrix,
                "classification_report": class_report,
                "roc_auc": roc_auc,
                "unique_classes": len(set(y_test)),
                "train_samples": len(X_train),
                "test_samples": len(X_test),
            }
        }

        return result

    except Exception as e:
        return {"status": "error", "message": str(e)}
