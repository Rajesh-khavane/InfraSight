
import sys
import joblib
import os

model_path = os.path.join('model', 'maintenance_model.pkl')
model = joblib.load(model_path)


temperature = float(sys.argv[1])
humidity = float(sys.argv[2])
acceleration = float(sys.argv[3])
pressure = float(sys.argv[4])


features = [[temperature, humidity, acceleration, pressure]]
prediction = model.predict(features)[0]

print(prediction)
