import mysql.connector
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="ifrasight"
)

query_temp_hum = "SELECT `id`, `temperature`, `humidity` FROM `tdata`"
df_temp_hum = pd.read_sql(query_temp_hum, conn)

query_accel_pressure = "SELECT `id`, `accel_x`, `accel_y`, `accel_z`, `pressure` FROM `adata`"
df_accel_pressure = pd.read_sql(query_accel_pressure, conn)

df = pd.merge(df_temp_hum, df_accel_pressure, on='id')

df['Target'] = ((df['Temperature'] > 30.0) | 
                (df['Humidity'] > 90.0) | 
                (df[['Acceleration_x', 'Acceleration_y', 'Acceleration_z']].max(axis=1) > 2.5) | 
                (df['Pressure'] < 300)).astype(int)

X = df[['Temperature', 'Humidity', 'Acceleration', 'Pressure']]
y = df['Target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

model_path = os.path.join('model', 'maintenance_model.pkl')
joblib.dump(model, model_path)
print(f"Model trained and saved as '{model_path}'")

conn.close()
