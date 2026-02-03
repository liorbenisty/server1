# Employee Attrition Prediction System

A machine learning system that predicts employee attrition and integrates with Google Sheets for HR data management.

## Overview

This system combines an XGBoost machine learning model with a Node.js API server to predict employee attrition. Employee data is automatically updated in Google Sheets with real-time attrition predictions.

## Features

- Machine learning prediction using XGBoost classifier
- Google Sheets integration for data management
- RESTful API for employee data processing
- Automated attrition prediction pipeline
- Production-ready deployment configuration

## Technology Stack

**Backend:** Node.js, Express.js, Google Sheets API  
**Machine Learning:** Python, scikit-learn, XGBoost, pandas  
**Infrastructure:** Google Cloud Platform

## Installation

### Prerequisites
- Node.js (v14+)
- Python 3.7+
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials

### Setup
```bash
# Clone repository
git clone <your-repository-url>
cd server1-main

# Install dependencies
npm install
pip install -r requirements.txt
```

### Configuration

**Development:**
1. Place Google credentials as `credentials.json` in project root
2. Create `.env` file:
```env
SPREADSHEET_ID=your_google_sheet_id
PORT=3001
```

**Production:**
Set environment variables for Google service account credentials and spreadsheet ID.

## Usage

```bash
# Start server
npm start

# Test endpoints
curl http://localhost:3001/test-connection
curl http://localhost:3001/add-test-line
```

## API Endpoints

- `GET /` - Health check
- `GET /test-connection` - Verify Google Sheets connection
- `POST /add-employee-line` - Add employee data with attrition prediction
- `GET /add-test-line` - Add sample test data

### Employee Data Format
```json
{
  "age": 42,
  "monthlyIncome": 6500,
  "overTime": "No",
  "totalWorkingYears": 7,
  "jobSatisfaction": 3,
  "workLifeBalance": 3,
  "jobRole": "Sales Executive"
}
```

## Machine Learning Model

**Algorithm:** XGBoost Classifier with SMOTE balancing  
**Features:** 19 selected employee attributes  
**Performance:** 0.33 recall for attrition detection  
**Threshold:** 0.3 (optimized for attrition sensitivity)

### Key Features
- MonthlyIncome, OverTime, Age, TotalWorkingYears
- JobSatisfaction, WorkLifeBalance, DistanceFromHome
- YearsAtCompany, StockOptionLevel, JobRole

## Project Structure

```
server1-main/
├── server.js                    # Express API server
├── predict_attrition.py         # ML prediction script
├── harmoynet_improved.py        # Model training pipeline
├── package.json                 # Node.js dependencies
├── requirements.txt             # Python dependencies
├── credentials.json             # Google credentials (dev)
└── .env                         # Environment variables
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Submit pull request

## License

MIT License  
