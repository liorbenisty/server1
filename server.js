require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/', (req, res) => {
    res.send('Hello my niag');
});

// Endpoint to update employee data
app.post('/update-employee', async (req, res) => {
    try {
        const employeeData = req.body;
        
        // Assuming the data comes in the correct order matching your sheet columns
        const values = [Object.values(employeeData)];
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!A:Z', // Using Sheet1 as default, adjust if your sheet has a different name
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values,
            },
        });

        console.log('Successfully updated sheet:', response.data);
        res.json({ 
            success: true, 
            message: 'Data successfully added to sheet',
            data: response.data 
        });
    } catch (error) {
        console.error('Error updating sheet:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
});

// Add a test endpoint to verify connection
app.get('/test-connection', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        res.json({ 
            success: true, 
            message: 'Successfully connected to Google Sheets',
            sheetTitle: response.data.properties.title
        });
    } catch (error) {
        console.error('Error testing connection:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
});

// Add a test endpoint to add a sample line
app.get('/add-test-line', async (req, res) => {
    try {
        // Sample data matching your sheet structure, excluding Attrition (which is at index 1)
        let testData = [
            27, // Age
            'Travel_Frequently', // BusinessTravel
            1337, // DailyRate
            'Human Resources', // Department
            22, // DistanceFromHome
            3, // Education
            'Life Human Resources', // EducationField
            1, // EmployeeCount
            1944, // EmployeeNumber
            1, // EnvironmentSatisfaction
            'Female', // Gender
            58, // HourlyRate
            2, // JobInvolvement
            1, // JobLevel
            'Human Resources', // JobRole
            2, // JobSatisfaction
            'Married', // MaritalStatus
            2863, // MonthlyIncome
            19555, // MonthlyRate
            1, // NumCompaniesWorked
            'Y', // Over18
            'No', // OverTime
            12, // PercentSalaryHike
            3, // PerformanceRating
            1, // RelationshipSatisfaction
            80, // StandardHours
            0, // StockOptionLevel
            1, // TotalWorkingYears
            2, // TrainingTimesLastYear
            3, // WorkLifeBalance
            1, // YearsAtCompany
            0, // YearsInCurrentRole
            0, // YearsSinceLastPromotion
            0, // YearsWithCurrManager
            '' // Empty cell for the last column
        ];

        // Extract only the required features in the correct order for the Python script
        const featuresForPrediction = [
            testData[17], // MonthlyIncome (6500)
            testData[21], // OverTime ('No')
            testData[0],  // Age (42)
            testData[27], // TotalWorkingYears (7)
            testData[2],  // DailyRate (1200)
            testData[30], // YearsAtCompany (5)
            testData[18], // MonthlyRate (20000)
            testData[11], // HourlyRate (85)
            testData[4],  // DistanceFromHome (2)
            testData[26], // StockOptionLevel (1)
            testData[33], // YearsWithCurrManager (3)
            testData[22], // PercentSalaryHike (15)
            testData[31], // YearsInCurrentRole (3)
            testData[19], // NumCompaniesWorked (3)
            testData[15], // JobSatisfaction (new)
            testData[29], // WorkLifeBalance (new)
            testData[12],  // EnvironmentSatisfaction (new)
            testData[15], // JobInvolvement (new)
            testData[17]  // JobRole (new)
        ];

        // Convert boolean/string values to numeric where needed
        featuresForPrediction[1] = featuresForPrediction[1] === 'Yes' ? 1 : 0; // Convert OverTime to numeric

        // Call Python script to predict Attrition
        const { execFile } = require('child_process');
        execFile('python', ['predict_attrition.py', ...featuresForPrediction], async (error, stdout, stderr) => {
            if (error) {
                console.error('Python error:', error, stderr);
                return res.status(500).json({ success: false, error: error.message, details: stderr });
            }
            const prediction = stdout.trim(); // e.g., 'Yes' or 'No'
            // Insert prediction at index 1 (Attrition)
            testData.splice(1, 0, prediction);

            try {
                const response = await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.SPREADSHEET_ID,
                    range: 'Sheet1!A:Z',
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    resource: {
                        values: [testData],
                    },
                });
                console.log('Successfully added test line:', response.data);
                res.json({ 
                    success: true, 
                    message: 'Test line successfully added to sheet',
                    data: response.data 
                });
            } catch (gsError) {
                console.error('Error adding test line to Google Sheets:', gsError);
                res.status(500).json({ 
                    success: false, 
                    error: gsError.message,
                    details: gsError.response?.data || 'No additional details available'
                });
            }
        });
    } catch (error) {
        console.error('Error in /add-test-line:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
});

// Add endpoint to handle employee data from frontend
app.post('/add-employee-line', async (req, res) => {
    try {
        const employeeData = req.body;
        
        // Extract features in the correct order for the Python script
        const featuresForPrediction = [
            employeeData.monthlyIncome,             // 0
    employeeData.overTime,                  // 1 - Keep as "Yes"/"No"
    employeeData.age,                       // 2
    employeeData.totalWorkingYears,         // 3
    employeeData.dailyRate,                 // 4
    employeeData.yearsAtCompany,            // 5
    employeeData.monthlyRate,               // 6
    employeeData.hourlyRate,                // 7
    employeeData.distanceFromHome,          // 8
    employeeData.stockOptionLevel,          // 9
    employeeData.yearsWithCurrManager,      // 10
    employeeData.percentSalaryHike,         // 11
    employeeData.yearsInCurrentRole,        // 12
    employeeData.numCompaniesWorked,        // 13
    employeeData.jobSatisfaction,           // 14
    employeeData.workLifeBalance,           // 15
    employeeData.environmentSatisfaction,   // 16
    employeeData.jobInvolvement,            // 17
    employeeData.jobRole                    // 18 - Use exact case (e.g., "Sales Executive")
        ];

        // Convert boolean/string values to numeric where needed
        //featuresForPrediction[1] = featuresForPrediction[1] === 'Yes' ? 1 : 0; // Convert OverTime to numeric

        // Call Python script to predict Attrition
        const { execFile } = require('child_process');
        execFile('python', ['predict_attrition.py', ...featuresForPrediction], async (error, stdout, stderr) => {
            if (error) {
                console.error('Python error:', error, stderr);
                return res.status(500).json({ success: false, error: error.message, details: stderr });
            }
            const prediction = stdout.trim(); // e.g., 'Yes' or 'No'

            // Prepare the data array in the correct order for the sheet
            const sheetData = [
                "=IMAGE('https://randomuser.me/api/portraits/" & IF(M1488="Male", "men", "women") & "/" & MOD(ROW(), 100) & ".jpg')",
                employeeData.age,
                employeeData.age,                prediction, // Attrition prediction
                employeeData.businessTravel,
                employeeData.dailyRate,
                employeeData.department,
                employeeData.distanceFromHome,
                employeeData.education,
                employeeData.educationField,
                employeeData.employeeCount,
                employeeData.employeeNumber,
                employeeData.environmentSatisfaction,
                employeeData.gender,
                employeeData.hourlyRate,
                employeeData.jobInvolvement,
                employeeData.jobLevel,
                employeeData.jobRole,
                employeeData.jobSatisfaction,
                employeeData.maritalStatus,
                employeeData.monthlyIncome,
                employeeData.monthlyRate,
                employeeData.numCompaniesWorked,
                employeeData.over18,
                employeeData.overTime,
                employeeData.percentSalaryHike,
                employeeData.performanceRating,
                employeeData.relationshipSatisfaction,
                employeeData.standardHours,
                employeeData.stockOptionLevel,
                employeeData.totalWorkingYears,
                employeeData.trainingTimesLastYear,
                employeeData.workLifeBalance,
                employeeData.yearsAtCompany,
                employeeData.yearsInCurrentRole,
                employeeData.yearsSinceLastPromotion,
                employeeData.yearsWithCurrManager,
                "FullName",
                "=HYPERLINK('https://script.google.com/macros/s/AKfycby6Tv6jmcXP3elLe3EhTewkROpagETpSOck94TjFEzWdoo88ClSCLr1KPCWQK2IzMLQ/exec?row=3", "❌ Delete')"
            ];

            try {
                const response = await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.SPREADSHEET_ID,
                    range: 'Sheet1!A:Z',
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    resource: {
                        values: [sheetData],
                    },
                });
                console.log('Successfully added employee data:', response.data);
                res.json({ 
                    success: true, 
                    message: 'Employee data successfully added to sheet',
                    data: response.data,
                    prediction: prediction
                });
            } catch (gsError) {
                console.error('Error adding employee data to Google Sheets:', gsError);
                res.status(500).json({ 
                    success: false, 
                    error: gsError.message,
                    details: gsError.response?.data || 'No additional details available'
                });
            }
        });
    } catch (error) {
        console.error('Error in /add-employee-line:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test the connection at: http://localhost:${PORT}/test-connection`);
    console.log(`Add a test line at: http://localhost:${PORT}/add-test-line`);
}); 