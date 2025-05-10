import sys
import joblib
import pandas as pd

# The order of features expected by the model
selected_features = [
    "MonthlyIncome",
    "OverTime",
    "Age",
    "TotalWorkingYears",
    "DailyRate",
    "YearsAtCompany",
    "MonthlyRate",
    "HourlyRate",
    "DistanceFromHome",
    "StockOptionLevel",
    "YearsWithCurrManager",
    "PercentSalaryHike",
    "YearsInCurrentRole",
    "NumCompaniesWorked"
]

# Get input data from command line arguments (excluding script name)
input_data = sys.argv[1:]

if len(input_data) != len(selected_features):
    print(f"Error: Expected {len(selected_features)} features, got {len(input_data)}", file=sys.stderr)
    sys.exit(1)

# Convert input to DataFrame
row = pd.DataFrame([input_data], columns=selected_features)

# Load the model
model = joblib.load('attrition_model.pkl')

# Predict probability for class 1 (attrition)
proba = model.predict_proba(row)[0][1]

# Use threshold 0.3 as in the notebook
prediction = 'Yes' if proba >= 0.3 else 'No'
print(prediction) 