require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const loginRoutes = require('./login/login'); 
const cors = require('cors');
const regression = require('regression');
const sendAlertEmail = require('./emailing');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3005;
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || '123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

app.use('/lib', express.static(path.join(__dirname, 'lib')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/scss', express.static(path.join(__dirname, 'scss')));


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});
app.use(cors());
app.use(bodyParser.json());

// Predictive Maintenance Function
function analyzeData(innerTemp, innerHumidity, accelerometerData, pressureData) {
    const temperatureModel = regression.linear(innerTemp.map((temp, index) => [index, temp]));
    const humidityModel = regression.linear(innerHumidity.map((hum, index) => [index, hum]));
    const accelerationModel = regression.linear(accelerometerData.map((acc, index) => [index, acc]));
    const pressureModel = regression.linear(pressureData.map((pres, index) => [index, pres]));

    return {
        temperaturePrediction: temperatureModel.predict(innerTemp.length)[1],
        humidityPrediction: humidityModel.predict(innerHumidity.length)[1],
        accelerationPrediction: accelerationModel.predict(accelerometerData.length)[1],
        pressurePrediction: pressureModel.predict(pressureData.length)[1]
    };
}

// Expanded Measures to Maintain Infrastructure Health
function getMaintenanceMeasures(predictions) {
    const measures = {
        temperature: [],
        humidity: [],
        acceleration: [],
        pressure: []
    };

    // Temperature measures
    if (predictions.temperaturePrediction > 35) { // Extreme heat
        measures.temperature.push("1. Implement emergency cooling systems to prevent overheating.");
        measures.temperature.push("2. Consider retrofitting the structure with advanced cooling technologies like evaporative cooling.");
        measures.temperature.push("3. Increase insulation to prevent heat penetration in critical areas.");
        measures.temperature.push("4. Encourage usage of heat-reflective external materials to reduce absorbed heat.");
    } else if (predictions.temperaturePrediction > 30) {
        measures.temperature.push("1. Increase ventilation or cooling systems to lower temperatures.");
        measures.temperature.push("2. Inspect HVAC systems for efficiency and maintenance.");
        measures.temperature.push("3. Use reflective coatings on roofs to reduce heat absorption.");
        measures.temperature.push("4. Monitor heat-sensitive equipment or materials that could be affected.");
    } else if (predictions.temperaturePrediction > 25) {
        measures.temperature.push("1. Ensure that regular inspections of cooling systems are maintained.");
        measures.temperature.push("2. Consider natural ventilation methods such as cross-ventilation for moderate heat management.");
    } else if (predictions.temperaturePrediction > 20) {
        measures.temperature.push("1. Monitor temperature regularly and adjust HVAC settings as needed.");
        measures.temperature.push("2. Schedule periodic maintenance for insulation and sealing.");
        measures.temperature.push("3. Avoid overcooling to maintain energy efficiency.");
    } else if (predictions.temperaturePrediction > 10) {
        measures.temperature.push("1. Insulate to maintain warmth and prevent freezing.");
        measures.temperature.push("2. Use space heaters in critical areas to ensure temperature stability.");
        measures.temperature.push("3. Inspect for possible heat loss through windows and doors.");
    } else {
        measures.temperature.push("1. Apply heavy insulation to maintain indoor warmth and prevent freezing.");
        measures.temperature.push("2. Ensure all heating systems are functioning optimally to avoid freezing risks.");
        measures.temperature.push("3. Check for ice formation in cold storage or structural areas.");
    }

    // Humidity measures
    if (predictions.humidityPrediction > 80) { // Excessively high humidity
        measures.humidity.push("1. Install industrial dehumidifiers to prevent condensation and mold growth.");
        measures.humidity.push("2. Conduct moisture testing to ensure the building envelope remains intact.");
        measures.humidity.push("3. Inspect for potential mold growth and address it immediately.");
        measures.humidity.push("4. Seal any significant cracks or breaches where humidity may enter.");
    } else if (predictions.humidityPrediction > 70) {
        measures.humidity.push("1. Use dehumidifiers to reduce moisture levels.");
        measures.humidity.push("2. Improve drainage around the building to prevent water accumulation.");
        measures.humidity.push("3. Inspect and seal leaks in roofs, windows, and doors.");
        measures.humidity.push("4. Use moisture-resistant materials in high-risk areas.");
    } else if (predictions.humidityPrediction > 50) {
        measures.humidity.push("1. Install adequate ventilation to prevent excess humidity.");
        measures.humidity.push("2. Ensure air conditioning systems are properly maintained to manage humidity.");
        measures.humidity.push("3. Perform inspections for moisture build-up in poorly ventilated areas.");
    } else if (predictions.humidityPrediction > 40) {
        measures.humidity.push("1. Monitor humidity levels and adjust HVAC settings accordingly.");
        measures.humidity.push("2. Ensure proper ventilation in high-moisture areas like kitchens and bathrooms.");
        measures.humidity.push("3. Inspect insulation for signs of moisture retention.");
    } else if (predictions.humidityPrediction > 20) {
        measures.humidity.push("1. Use humidifiers to maintain moisture levels.");
        measures.humidity.push("2. Consider introducing indoor plants to naturally increase humidity.");
        measures.humidity.push("3. Check for and address any signs of cracking or splitting in materials.");
    } else {
        measures.humidity.push("1. Take additional measures to prevent air becoming too dry by adjusting HVAC settings.");
        measures.humidity.push("2. Introduce evaporative humidification systems if needed.");
        measures.humidity.push("3. Address any potential impact of low humidity on sensitive materials like wood.");
    }

    // Acceleration measures
    if (predictions.accelerationPrediction > 1.5) { // High vibration threshold
        measures.acceleration.push("1. Perform emergency structural assessments to prevent collapse.");
        measures.acceleration.push("2. Reinforce or retrofit areas subject to high stress or shifting.");
        measures.acceleration.push("3. Engage specialists to conduct seismic assessments if located in a seismic zone.");
        measures.acceleration.push("4. Implement vibration-damping techniques like shock absorbers or isolation pads.");
    } else if (predictions.accelerationPrediction > 1) {
        measures.acceleration.push("1. Conduct structural inspections for potential shifting or displacement.");
        measures.acceleration.push("2. Use accelerometers to continuously monitor vibration levels.");
        measures.acceleration.push("3. Reinforce structural elements that are subject to high stresses.");
        measures.acceleration.push("4. Investigate surrounding activities (construction, heavy machinery) as potential vibration sources.");
    } else if (predictions.accelerationPrediction > 0.5) {
        measures.acceleration.push("1. Regularly monitor and ensure no sudden changes occur that might indicate structural issues.");
        measures.acceleration.push("2. Maintain a log of any previous measurements for comparison.");
        measures.acceleration.push("3. Assess the need for localized damping systems to minimize vibrations.");
    } else {
        measures.acceleration.push("1. Conduct routine inspections but no immediate action needed.");
        measures.acceleration.push("2. Ensure that vibrations from nearby sources (traffic, machinery) are monitored.");
        measures.acceleration.push("3. Keep a periodic vibration log for reference in case of future anomalies.");
    }

    // Pressure measures
    if (predictions.pressurePrediction > 150) { // High pressure alert
        measures.pressure.push("1. Evaluate emergency support mechanisms for load-bearing structures.");
        measures.pressure.push("2. Perform thorough inspections of foundations for signs of cracking or stress.");
        measures.pressure.push("3. Consider redistributing loads or reducing heavy equipment use in certain areas.");
        measures.pressure.push("4. Consult with structural engineers for reinforcements or repairs.");
    } else if (predictions.pressurePrediction > 100) {
        measures.pressure.push("1. Inspect load-bearing elements for signs of stress.");
        measures.pressure.push("2. Perform regular checks on foundations and structural integrity.");
        measures.pressure.push("3. Evaluate load distribution and consider reinforcing areas under high pressure.");
    } else if (predictions.pressurePrediction > 70) {
        measures.pressure.push("1. Ensure that structures are not overloading and plan for weight distribution.");
        measures.pressure.push("2. Review plans for additional support structures if necessary.");
    } else {
        measures.pressure.push("1. Assess whether the structure is underutilized and if load redistribution is needed.");
        measures.pressure.push("2. Consider plans for expansion if capacity is not being utilized.");
    }

    return measures;
}


// Route to Serve the HTML Dashboard
app.get('/pdm', (req, res) => {
    let navButton;
    
    if (!req.session.username) {
  
        navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Login</a>`;
    } else {
          
        navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Logout</a>`;
    }

    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Predictive Maintenance Dashboard</title>
            <style>
                body {
                    background-color: #f4f4f4;
                    padding: 0px;
                }
                table {
                    width: 95%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    padding: 100px;
                }
                table, th, td {
                    border: 1px solid #ddd;
                }
                th, td {
                    padding: 10px;
                    text-align: center;
                }
                th {
                    background-color: #FF800F;
                    color: white;
                }
                .measures {
                    margin-top: 20px;
                }
            </style>
            <meta charset="utf-8">
            <title>InfraSight - Predictive Maintenance</title>

            <!-- External Resources -->
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 
            <link href="css/bootstrap.min.css" rel="stylesheet">
            <link href="css/style.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
      <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
    <!-- Navbar End -->

    
    <!-- Page Header Start -->
    <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <h1 class="display-4 text-white animated slideInDown mb-4">Predictive Maintenance</h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="/index">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Predictive Maintenance</li>
                </ol>
            </nav>
        </div>
    </div>
    <!-- Page Header End -->

    
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 40px 50px;" class=" wow fadeInUp" data-wow-delay="0.5s">
            <!-- Left Section -->
            <div style="flex: 1; text-align: left;">
               <div class=" wow fadeInUp" data-wow-delay="0.5s">
                    <div class="h-100">
                        <h1 class="display-6 mb-5">Welcome To InfraSight - Your Personalized Monitoring & Maintenance Assistant</h1>
                        <p class="mb-4">At InfraSight, we focus on optimizing infrastructure maintenance through advanced, data-driven predictive analytics. Our solutions are designed to enhance performance, reduce downtime, and provide long-term value for your assets.</p>
                        <p class="mb-4">We offer tailored services, utilizing cutting-edge technology and real-time data to predict maintenance needs. Our approach is to continuously evolve with emerging trends, ensuring your infrastructure is always ahead of the curve.</p>
                        <p class="mb-4">Our team of experts works closely with you to provide insights and strategies that address the unique challenges of your infrastructure. From temperature and humidity monitoring to predictive maintenance, InfraSight delivers actionable insights that improve operational efficiency.</p>
                        <div class="border-top mt-4 pt-4">
                            <h4 class="text-primary">Our Mission:</h4>
                            <p class="mb-4">To deliver sustainable and reliable monitoring solutions that enhance the resilience of infrastructure, improve efficiency, and promote safety for all our clients.</p>
                            <button id="fetchData" style="font-size: 16px; border: none; padding: 10px 20px; border-radius: 50px; " class="btn btn-secondary">
                    Fetch Predictive Maintenance Data
                </button>
                        </div>
                    </div>
                </div>      
            </div>

            <!-- Right Section (Image) -->
            <div style="flex: 1; text-align: right;">
                <img src="img/dash1.png" alt="Dashboard Image" style="width: 100%; max-width: 700px; height: 650px;">
            </div>
        </div>
        <center>
        <h2>Results</h2>
        <table id="resultsTable">
            <thead>
                <tr>
                    <th>Temperature Prediction</th>
                    <th>Humidity Prediction</th>
                    <th>Acceleration Prediction</th>
                    <th>Pressure Prediction</th>
                </tr>
            </thead>
            <tbody id="resultsBody">
                <!-- Results will be populated here -->
            </tbody>
        </table>
        <div id="maintenanceMeasures" class="measures">
            <!-- Measures will be populated here -->
        </div>
    </center>

    <script>
        document.getElementById('fetchData').addEventListener('click', function() {
            fetch('/api/predictive-maintenance')
                .then(response => response.json())
                .then(data => {
                    const resultsBody = document.getElementById('resultsBody');
                    resultsBody.innerHTML = ''; // Clear existing results

                    const newRow = document.createElement('tr');
                    newRow.innerHTML = \`
                        <td>\${data.temperaturePrediction.toFixed(2)}</td>
                        <td>\${data.humidityPrediction.toFixed(2)}</td>
                        <td>\${data.accelerationPrediction.toFixed(2)}</td>
                        <td>\${data.pressurePrediction.toFixed(2)}</td>
                    \`;
                    resultsBody.appendChild(newRow);

                    // Display maintenance measures with color-coded cards
                    const measuresDiv = document.getElementById('maintenanceMeasures');
                    measuresDiv.innerHTML = \`<h3>Recommended Maintenance Measures:</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; padding: 10px; font-family: Arial, sans-serif;">
                        \${createMeasureCard('Temperature', data.temperaturePrediction, data.measures.temperature)}
                        \${createMeasureCard('Humidity', data.humidityPrediction, data.measures.humidity)}
                        \${createMeasureCard('Acceleration', data.accelerationPrediction, data.measures.acceleration)}
                        \${createMeasureCard('Pressure', data.pressurePrediction, data.measures.pressure)}
                    </div>\`;
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        });

        // Function to dynamically set background color based on threshold values
        function getBackgroundColor(prediction) {
            if (prediction > 90) {
                return '#ffcccc'; // Lightest red
            } else if (prediction > 75) {
                return '#ffd9b3'; // Lightest orange
            } else if (prediction > 50) {
                return '#fff4b3'; // Lightest yellow
            } else if (prediction > 30) {
                return '#d9ffb3'; // Lightest light green
            } else {
                return '#b3ffb3'; // Lightest dark green
            }
        }

        // Function to create a measure card with dynamic background color
        function createMeasureCard(type, prediction, measures) {
            const backgroundColor = getBackgroundColor(prediction);
            return \`
                <div style="flex: 1 1 calc(25% - 20px); background-color: \${backgroundColor}; padding: 20px; border: 1px solid #ccc; border-radius: 5px; text-align: center; box-sizing: border-box;">
                    <strong style="color: #010A35; display: block; margin-bottom: 10px;">\${type}:</strong>
                    <ul style="list-style-type: none; padding: 0; margin: 0; color: #333;">
                        <li>\${measures.join('</li><li>')}</li>
                    </ul>
                </div>
            \`;
        }
    </script>

    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                    <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we not only enhance infrastructure reliability but also contribute to a more sustainable future.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Join Us</h5>
                    <p>Get connected for the latest updates of InfraSight.</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2"><a href="/register" style="color:white">SignUp</a></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">InfraSight</a>, All Right Reserved.
                    </div>
                    <div class="col-md-6 text-center text-md-end">
                        <div class="footer-menu">
                            <a href="/index">Home</a>
                            <a href="/about">About Us</a>
                            <a href="/services">Our Services</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </body>
    </html>
    `);
});


// API Route for Predictive Maintenance
app.get('/api/predictive-maintenance', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }

    const query = `
        SELECT t.temperature AS inner_temp, 
               t.humidity AS inner_humidity, 
               a.accel_x AS accelerometer_x, 
               a.accel_y AS accelerometer_y, 
               a.accel_z AS accelerometer_z, 
               a.pressure AS pressure_data 
        FROM tdata t
        JOIN adata a ON t.id = a.id;`;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err });

        const innerTemp = results.map(row => row.inner_temp);
        const innerHumidity = results.map(row => row.inner_humidity);
        const accelerometerData = results.map(row => {
            return (row.accelerometer_x + row.accelerometer_y + row.accelerometer_z) / 3; // Average or change as needed
        });
        const pressureData = results.map(row => row.pressure_data);

        const predictions = analyzeData(innerTemp, innerHumidity, accelerometerData, pressureData);
        const measures = getMaintenanceMeasures(predictions);

        const temperatureThreshold = 30;
        const humidityThreshold = 70;
        const accelerationThreshold = 1;
        const pressureThreshold = 100;
    
        const userEmail = req.session.username;
    
        
        if (predictions.temperaturePrediction > temperatureThreshold) {
            sendAlertEmail(
                userEmail, // Send to the logged-in user's email
                'Temperature Threshold Exceeded',
                `Alert! The temperature has exceeded the safe threshold with a value of ${predictions.temperaturePrediction}°C. Immediate action is required.`
            );
        }
        if (predictions.humidityPrediction > humidityThreshold) {
            sendAlertEmail(
                userEmail,
                'Humidity Threshold Exceeded',
                `Alert! The humidity has exceeded the safe threshold with a value of ${predictions.humidityPrediction}%. Immediate action is required.`
            );
        }
        if (predictions.accelerationPrediction > accelerationThreshold) {
            sendAlertEmail(
                userEmail,
                'Acceleration Threshold Exceeded',
                `Alert! The acceleration has exceeded the safe threshold with a value of ${predictions.accelerationPrediction}. Immediate action is required.`
            );
        }
        if (predictions.pressurePrediction > pressureThreshold) {
            sendAlertEmail(
                userEmail,
                'Pressure Threshold Exceeded',
                `Alert! The pressure has exceeded the safe threshold with a value of ${predictions.pressurePrediction}. Immediate action is required.`
            );
        }

     
        const sql = `INSERT INTO predictive_maintenance (
            temperature_prediction, humidity_prediction, 
            acceleration_prediction, pressure_prediction, 
            temperature_measures, humidity_measures, 
            acceleration_measures, pressure_measures,sby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [
            predictions.temperaturePrediction,
            predictions.humidityPrediction,
            predictions.accelerationPrediction,
            predictions.pressurePrediction,
            JSON.stringify(measures.temperature), // Convert array to JSON
            JSON.stringify(measures.humidity), 
            JSON.stringify(measures.acceleration),
            JSON.stringify(measures.pressure),
            userEmail
        ], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('Error inserting data into database:', insertErr);
                return res.status(500).json({ error: 'Failed to insert data into the database' });
            }

            console.log('Data inserted successfully into predictive_maintenance table:', insertResult);
        });

        // Send the prediction and measures data back to the frontend
        res.json({
            ...predictions,
            measures
        });
    });
});


app.get('/data', (req, res) => {

    db.query('SELECT temperature, humidity, datetime FROM tdata', (err, tdata) => {
        if (err) throw err;

        
        db.query('SELECT timestamp, accel_x, accel_y, accel_z, pressure FROM adata', (err, adata) => {
            if (err) throw err;

            res.json({ tdata, adata });
        });
    });
});





app.get('/index', (req, res) => {
    let navButton;
    
    if (!req.session.username) {
  
        navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Login</a>`;
    } else {
          
        navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Logout</a>`;
    }

    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
    const htmlContent = `
    <html lang="en">
    
    <head>
        <meta charset="utf-8">
        <title>InfraSight</title>
        <meta content="width=device-width, initial-scale=1.0" name="viewport">
        <meta content="" name="keywords">
        <meta content="" name="description">
    
        <!-- Favicon -->
        <link href="img/favicon.ico" rel="icon">
    
        <!-- Google Web Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 
    
        <!-- Icon Font Stylesheet -->
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
    
        <!-- Libraries Stylesheet -->
        <link href="lib/animate/animate.min.css" rel="stylesheet">
        <link href="lib/owlcarousel/assets/owl.carousel.min.css" rel="stylesheet">
    
        <!-- Customized Bootstrap Stylesheet -->
        <link href="css/bootstrap.min.css" rel="stylesheet">
    
        <!-- Template Stylesheet -->
        <link href="css/style.css" rel="stylesheet">
    </head>
    
    <body>
        <!-- Spinner Start -->
        <div id="spinner" class="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center">
            <div class="spinner-grow text-primary" role="status"></div>
        </div>
        <!-- Spinner End -->
    
    
    
    
     <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
    <!-- Navbar End -->

    <!-- Carousel Start -->
        <div class="container-fluid p-0 mb-5">
            <div id="header-carousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active">
                        <img class="w-100" src="img/bg2.png" alt="Image">
                        <div class="carousel-caption">
                            <div class="container">
                                <div class="row justify-content-center">
                                    <div class="col-lg-7 pt-5">
                                        <h1 class="display-4 text-white mb-4 animated slideInDown">We Provide Measures that Helps to Enhance the Health of Infrastructures</h1>
                                        <p class="fs-5 text-body mb-4 pb-2 mx-sm-5 animated slideInDown">InfraSight gives proper and suitable measures to enhance the health of infra's and save life by stopping the hazardous dismantellings of infrastrucutres.</p>
                                        <a href="" class="btn btn-primary py-3 px-5 animated slideInDown">Explore More</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="carousel-item">
                        <img class="w-100" src="img/bg5.jpg" alt="Image">
                        <div class="carousel-caption">
                            <div class="container">
                                <div class="row justify-content-center">
                                    <div class="col-lg-7 pt-5">
                                        <h1 class="display-4 text-white mb-4 animated slideInDown">Quality Measuring & Real-Time Health Monitoring Services</h1>
                                        <p class="fs-5 text-body mb-4 pb-2 mx-sm-5 animated slideInDown">Infrasight ensures the quality of infrastructure over periods and also real time mapping of the condition of infrastructures.</p>
                                        <a href="" class="btn btn-primary py-3 px-5 animated slideInDown">Explore More</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#header-carousel"
                    data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#header-carousel"
                    data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>
        </div>
        <!-- Carousel End -->
    
    
        <!-- About Start -->
        <div class="container-xxl py-5">
            <div class="container">
                <div class="row g-5 align-items-center">
                    <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.5s">
                        <div class="h-100">
                            <h1 class="display-6 mb-5">Welcome To Your Personal Miantainance Assistant</h1>
                            <div class="row g-4 mb-4">
                                <div class="col-sm-6">
                                    <div class="d-flex align-items-center">
                                        <img class="flex-shrink-0 me-3" src="img/icon/icon-07-primary.png" alt="">
                                        <h5 class="mb-0">Accurate Prediction</h5>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="d-flex align-items-center">
                                        <img class="flex-shrink-0 me-3" src="img/icon/icon-09-primary.png" alt="">
                                        <h5 class="mb-0">Quality Measures</h5>
                                    </div>
                                </div>
                            </div>
                            <p class="mb-4">Infrasight helps you to maintain your house, buildings, social parks, statues, bridges well with effective predicted measures.</p>
                            <div class="border-top mt-4 pt-4">
                                <div class="row">
                                    <div class="col-sm-6">
                                        <div class="d-flex align-items-center">
                                            <div class="btn-lg-square bg-primary rounded-circle me-3">
                                                <i class="fa fa-phone-alt text-white"></i>
                                            </div>
                                            <h5 class="mb-0">+91 7066064593</h5>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="d-flex align-items-center">
                                            <div class="btn-lg-square bg-primary rounded-circle me-3">
                                                <i class="fa fa-envelope text-white"></i>
                                            </div>
                                            <h5 class="mb-0">infrasight@gmail.com</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="row g-3">
                            <div class="col-6 text-end">
                                <img class="img-fluid w-75 wow zoomIn" data-wow-delay="0.1s" src="img/s1.avif" style="margin-top: 25%;">
                            </div>
                            <div class="col-6 text-start">
                                <img class="img-fluid w-100 wow zoomIn" data-wow-delay="0.3s" src="img/s8.jpg">
                            </div>
                            <div class="col-6 text-end">
                                <img class="img-fluid w-50 wow zoomIn" data-wow-delay="0.5s" src="img/s2.avif">
                            </div>
                            <div class="col-6 text-start">
                                <img class="img-fluid w-75 wow zoomIn" data-wow-delay="0.7s" src="img/s5.avif">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- About End -->
    
    
        <!-- Facts Start -->
        <div class="container-fluid facts my-5 py-5" data-parallax="scroll" data-image-src="img/bg2.png">
            <center>
            <div class="container py-5">
                <div class="row g-5">
                    <div class="col-sm-6 col-lg-3 wow fadeIn" data-wow-delay="0.1s">
                        <h1 class="display-4 text-white" data-toggle="counter-up">156</h1>
                        <span class="text-primary">Happy Clients</span>
                    </div>
                    <div class="col-sm-6 col-lg-3 wow fadeIn" data-wow-delay="0.3s">
                        <h1 class="display-4 text-white" data-toggle="counter-up">50</h1>
                        <span class="text-primary">Products Oredered</span>
                    </div>
                    <div class="col-sm-6 col-lg-3 wow fadeIn" data-wow-delay="0.5s">
                        <h1 class="display-4 text-white" data-toggle="counter-up">5</h1>
                        <span class="text-primary">Years of Experience</span>
                    </div>
                    <div class="col-sm-6 col-lg-3 wow fadeIn" data-wow-delay="0.7s">
                        <h1 class="display-4 text-white" data-toggle="counter-up">4</h1>
                        <span class="text-primary">Team Members</span>
                    </div>
                </div>
            </div></center>
        </div>
        <!-- Facts End -->
    
    <div class="container-xxl py-5">
    <div class="container">
        <div class="text-center mx-auto wow fadeInUp" data-wow-delay="0.1s" style="max-width: 600px;">
            <h1 class="display-6 mb-5">Professional Infrastructure Monitoring & Maintenance Services</h1>
            <p class="text-muted">Ensuring the reliability and efficiency of your infrastructure through predictive maintenance and advanced monitoring solutions.</p>
        </div>
        <div class="row g-4 justify-content-center" style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: space-between;">
            <!-- Service 1 -->
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s" style="flex: 1 1 calc(33.333% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r1.avif" alt="Real-Time Monitoring" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Monitoring">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Real-Time Infrastructure Monitoring</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Our real-time monitoring services help you stay ahead by identifying potential issues early, minimizing downtime, and optimizing overall infrastructure performance.</p>
                </div>
            </div>

            <!-- Service 2 -->
            <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s" style="flex: 1 1 calc(25% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r2.avif" alt="Cooling System Maintenance" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Cooling">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Cooling System Maintenance</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Keep your cooling systems in optimal condition with our maintenance services that reduce energy consumption and ensure consistent performance.</p>
                </div>
            </div>

            <!-- Service 3 -->
            <div class="col-lg-5 col-md-6 wow fadeInUp" data-wow-delay="0.5s" style="flex: 1 1 calc(41.666% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r3.png" alt="Heating System Optimization" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Heating">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Heating System Optimization</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Optimize your heating systems to improve energy efficiency and reduce the need for repairs, ensuring a comfortable environment for your infrastructure.</p>
                </div>
            </div>

            <!-- Service 4 -->
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.7s" style="flex: 1 1 calc(33.333% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r4.avif" alt="Comprehensive Maintenance" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Maintenance">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Comprehensive Infrastructure Maintenance</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Our full-spectrum maintenance services cover everything from basic repairs to advanced upgrades, keeping your infrastructure in peak condition.</p>
                </div>
            </div>

            <!-- Service 5 -->
            <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.9s" style="flex: 1 1 calc(25% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r5.avif" alt="Air Quality Monitoring" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Air Quality">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Air Quality Monitoring & Optimization</a>
                    </div>
                    <p class="text-muted mt-2 p-3">We offer air quality monitoring services that ensure a healthy and safe environment within your infrastructure by optimizing air filtration and ventilation systems.</p>
                </div>
            </div>

            <!-- Service 6 -->
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="1.1s" style="flex: 1 1 calc(33.333% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r6.svg" alt="Annual Inspections" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Inspections">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Annual Inspections & Audits</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Ensure your infrastructure is compliant and safe with annual inspections and audits to identify any structural or system weaknesses before they become costly issues.</p>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Service End -->

        <!-- Features Start -->
        <div class="container-xxl py-5">
            <div class="container">
                <div class="row g-5">
                    <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.1s">
                        <h1 class="display-6 mb-5">Few Reasons Why People Choosing Us!</h1>
                        <p class="mb-5">We addresses the problem of unawarness and slopiness of the wise person of any housing building or any infrastructure which may leads to hazard!!!</p>
                        <div class="d-flex mb-5">
                            <div class="flex-shrink-0 btn-square bg-primary rounded-circle" style="width: 90px; height: 90px;">
                                <img class="img-fluid" src="img/icon/icon-08-light.png" alt="">
                            </div>
                            <div class="ms-4">
                                <h5 class="mb-3">Real-Time Alerts</h5>
                                <span>Infrasight warns people when condition go out of the hand, until it provides warnings which are triggered in less risky condition.</span>
                            </div>
                        </div>
                        <div class="d-flex mb-5">
                            <div class="flex-shrink-0 btn-square bg-primary rounded-circle" style="width: 90px; height: 90px;">
                                <img class="img-fluid" src="img/icon/icon-10-light.png" alt="">
                            </div>
                            <div class="ms-4">
                                <h5 class="mb-3">InfraHealth Monitoring</h5>
                                <span>Helps to moniter the health by giving effective measures that enhances the overall health of the infrastructures.</span>
                            </div>
                        </div>
                        <div class="d-flex mb-0">
                            <div class="flex-shrink-0 btn-square bg-primary rounded-circle" style="width: 90px; height: 90px;">
                                <img class="img-fluid" src="img/icon/icon-06-light.png" alt="">
                            </div>
                            <div class="ms-4">
                                <h5 class="mb-3">Maintainance Assistant</h5>
                                <span>As our infrabot analyse the conditon contineously it provides fully automated working and readings sent by infrabot stored over the application and you will get data in one click.</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.5s">
                        <div class="position-relative rounded overflow-hidden h-100" style="min-height: 400px;">
                            <img class="position-absolute" src="img/p2.png" alt="" style="object-fit: cover; width: 100%; height: 100%;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Features End -->
    
<!-- How InfraSight Works Start -->
<div class="container-fluid overflow-hidden my-5 px-lg-0">
    <div class="container quote px-lg-0">
        <div class="row g-0 mx-lg-0">
            <!-- Image on the Left -->
            <div class="col-lg-6" data-parallax="scroll" data-image-src="img/carousel-2.jpg">
                <div class="h-100 px-4 px-sm-5 ps-lg-0 wow fadeIn" data-wow-delay="0.1s">
                    <img src="img/h1.avif" class="img-fluid" alt="How InfraSight Works" style="margin-left: 40px;">
                </div>
            </div>
            <!-- Info on the Right -->
            <div class="col-lg-6 quote-text" data-parallax="scroll">
                <div class="h-100 px-4 px-sm-5 pe-lg-0 wow fadeIn" data-wow-delay="0.5s">
                    <div class=" p-4 p-sm-5">
                        <h1 class="mb-4" style="color:white">How InfraSight Works</h1>
                        <p>InfraSight uses cutting-edge technology to monitor the health of infrastructure. Here’s how it works:</p>
                        <ul>
                            <li><b>Data Collection:</b> InfraSight gathers real-time data from IoT sensors installed in buildings, bridges, and other infrastructure.</li>
                            <li><b>Analysis:</b> The collected data is analyzed using AI algorithms to detect potential issues before they become critical.</li>
                            <li><b>Maintenance Scheduling:</b> Based on the analysis, InfraSight provides predictive maintenance schedules, helping you avoid costly repairs.</li>
                            <li><b>Actionable Insights:</b> Receive detailed reports and insights that ensure the longevity and safety of your infrastructure.</li>
                        </ul>
                        <a href="" class="btn btn-primary py-3 px-5">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- How InfraSight Works End -->

     
    
    
    <!-- Testimonial Start -->
<div class="container-xxl py-5">
    <div class="container">
        <div class="text-center mx-auto wow fadeInUp" data-wow-delay="0.1s" style="max-width: 500px;">
            <h1 class="display-6 mb-5">What They Say About InfraSight</h1>
        </div>
        <div class="row g-5">
            <!-- Left side images -->
            <div class="col-lg-3 d-none d-lg-block">
                <div class="testimonial-left h-100">
                    <img class="img-fluid animated pulse infinite mb-4" src="img/ac2.avif" alt="Testimonial 1">
                    <img class="img-fluid animated pulse infinite mb-4" src="img/ac3.avif" alt="Testimonial 2">
                    <img class="img-fluid animated pulse infinite" src="img/ac1.jpg" alt="Testimonial 3">
                </div>
            </div>
            <!-- Testimonials Carousel -->
            <div class="col-lg-6 wow fadeIn" data-wow-delay="0.5s">
                <div class="owl-carousel testimonial-carousel">
                    <div class="testimonial-item text-center">
                        <img class="img-fluid mx-auto mb-4 rounded-circle" src="img/ac1.jpg" alt="Client 1">
                        <p class="fs-5">"InfraSight has revolutionized our infrastructure monitoring process. With predictive insights, we now prevent issues before they happen!"</p>
                        <h5>Rajesh Khavane</h5>
                        <span>Building Manager</span>
                    </div>
                    <div class="testimonial-item text-center">
                        <img class="img-fluid mx-auto mb-4 rounded-circle" src="img/ac2.avif" alt="Client 2">
                        <p class="fs-5">"The real-time data and maintenance alerts have significantly improved the lifespan of our facilities. I highly recommend InfraSight."</p>
                        <h5>Vaishali Thakare</h5>
                        <span>Civil Engineer</span>
                    </div>
                    <div class="testimonial-item text-center">
                        <img class="img-fluid mx-auto mb-4 rounded-circle" src="img/ac3.avif" alt="Client 3">
                        <p class="fs-5">"Thanks to InfraSight, our maintenance costs have decreased while the efficiency of our infrastructure has improved tremendously."</p>
                        <h5>Shreeyan Patil</h5>
                        <span>Infrastructure Analyst</span>
                    </div>
                </div>
            </div>
            <!-- Right side images -->
            <div class="col-lg-3 d-none d-lg-block">
                <div class="testimonial-right h-100">
                    <img class="img-fluid animated pulse infinite mb-4" src="img/ac1.jpg" alt="Testimonial 1">
                    <img class="img-fluid animated pulse infinite mb-4" src="img/ac2.avif" alt="Testimonial 2">
                    <img class="img-fluid animated pulse infinite" src="img/ac3.avif" alt="Testimonial 3">
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Testimonial End -->

    
        <!-- Footer Start -->
        <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
            <div class="container py-5">
                <div class="row g-5">
                    <div class="col-md-6">
                        <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                        <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we not only enhance infrastructure reliability but also contribute to a more sustainable future. We are passionate about delivering solutions that benefit our clients, their communities, and the environment.

<p>Join us in transforming the way infrastructure is managed. Together, we can build a smarter, more resilient world.</span>
                    </div>
                    <div class="col-md-6">
                        <h5 class="text-light mb-4">Join us</h5>
                        <p>Stay connected for latest updates</p>
                        <div class="position-relative">
                            <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                            <a  class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2" href="/register">SignUp</a>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <h5 class="text-light mb-4">Get In Touch</h5>
                        <p><i class="fa fa-map-marker-alt me-3"></i>K. K. Wagh Institute of engineering education and research, Nashik</p>
                        <p><i class="fa fa-phone-alt me-3"></i>+91 12345678980</p>
                        <p><i class="fa fa-envelope me-3"></i>infrainfo@gmail.com</p>
                    </div>
                    
                    <div class="col-lg-3 col-md-6">
                        <h5 class="text-light mb-4">Quick Links</h5>
                        <a class="btn btn-link" href="/pdm">Predictive Maintainance</a>
                        <a class="btn btn-link" href="/reporting">Reports</a>
                        <a class="btn btn-link" href="/report">Graph</a>
                        <a class="btn btn-link" href="/product">Buy product</a>
                    </div>
                   
                </div>
            </div>
            <div class="container-fluid copyright">
                <div class="container">
                    <div class="row">
                        <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                            &copy; <a href="#">InfraSight</a>, All Right Reserved.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    
    
    
        <!-- Back to Top -->
        <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i class="bi bi-arrow-up"></i></a>
    
    
        <!-- JavaScript Libraries -->
        <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
        <script src="lib/wow/wow.min.js"></script>
        <script src="lib/easing/easing.min.js"></script>
        <script src="lib/waypoints/waypoints.min.js"></script>
        <script src="lib/owlcarousel/owl.carousel.min.js"></script>
        <script src="lib/counterup/counterup.min.js"></script>
        <script src="lib/parallax/parallax.min.js"></script>
    
        <!-- Template Javascript -->
        <script src="js/main.js"></script>
    </body>
    
    </html>`;
    res.send(htmlContent);
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/about', (req, res) => {
    let navButton;
    
    if (!req.session.username) {
  
        navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link">Login</a>`;
    } else {
          
        navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link">Logout</a>`;
    }

    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
    const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>InfraSight - Personalized Monitoring & Maintenance Assistant</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <meta content="" name="keywords">
    <meta content="" name="description">

    <!-- Favicon -->
    <link href="img/favicon.ico" rel="icon">

    <!-- Google Web Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

    <!-- Icon Font Stylesheet -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Libraries Stylesheet -->
    <link href="lib/animate/animate.min.css" rel="stylesheet">
    <link href="lib/owlcarousel/assets/owl.carousel.min.css" rel="stylesheet">

    <!-- Customized Bootstrap Stylesheet -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Template Stylesheet -->
    <link href="css/style.css" rel="stylesheet">
</head>

<body>
    <!-- Spinner Start -->
    <div id="spinner" class="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center">
        <div class="spinner-grow text-primary" role="status"></div>
    </div>
    <!-- Spinner End -->


            <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
    <!-- Navbar End -->


    <!-- Page Header Start -->
    <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <h1 class="display-4 text-white animated slideInDown mb-4">About Us</h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="/index">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">About</li>
                </ol>
            </nav>
        </div>
    </div>
    <!-- Page Header End -->
    <!-- Service Start -->
<div class="container-xxl py-5">
    <div class="container">
        <div class="text-center mx-auto wow fadeInUp" data-wow-delay="0.1s" style="max-width: 600px;">
            <h1 class="display-6 mb-5">Professional Infrastructure Monitoring & Maintenance Services</h1>
            <p class="text-muted">Ensuring the reliability and efficiency of your infrastructure through predictive maintenance and advanced monitoring solutions.</p>
        </div>
        <div class="row g-4 justify-content-center" style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: space-between;">
            <!-- Service 1 -->
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s" style="flex: 1 1 calc(33.333% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r1.avif" alt="Real-Time Monitoring" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Monitoring">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Real-Time Infrastructure Monitoring</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Our real-time monitoring services help you stay ahead by identifying potential issues early, minimizing downtime, and optimizing overall infrastructure performance.</p>
                </div>
            </div>

            <!-- Service 2 -->
            <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s" style="flex: 1 1 calc(25% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r2.avif" alt="Cooling System Maintenance" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Cooling">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Cooling System Maintenance</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Keep your cooling systems in optimal condition with our maintenance services that reduce energy consumption and ensure consistent performance.</p>
                </div>
            </div>

            <!-- Service 3 -->
            <div class="col-lg-5 col-md-6 wow fadeInUp" data-wow-delay="0.5s" style="flex: 1 1 calc(41.666% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r3.png" alt="Heating System Optimization" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Heating">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Heating System Optimization</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Optimize your heating systems to improve energy efficiency and reduce the need for repairs, ensuring a comfortable environment for your infrastructure.</p>
                </div>
            </div>

            <!-- Service 4 -->
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.7s" style="flex: 1 1 calc(33.333% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r4.avif" alt="Comprehensive Maintenance" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Maintenance">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Comprehensive Infrastructure Maintenance</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Our full-spectrum maintenance services cover everything from basic repairs to advanced upgrades, keeping your infrastructure in peak condition.</p>
                </div>
            </div>

            <!-- Service 5 -->
            <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.9s" style="flex: 1 1 calc(25% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r5.avif" alt="Air Quality Monitoring" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Air Quality">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Air Quality Monitoring & Optimization</a>
                    </div>
                    <p class="text-muted mt-2 p-3">We offer air quality monitoring services that ensure a healthy and safe environment within your infrastructure by optimizing air filtration and ventilation systems.</p>
                </div>
            </div>

            <!-- Service 6 -->
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="1.1s" style="flex: 1 1 calc(33.333% - 20px);">
                <div class="service-item" style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                    <img class="img-fluid" src="img/r6.svg" alt="Annual Inspections" style="width: 100%; height: 200px; object-fit: cover;">
                    <div class="d-flex align-items-center bg-light p-4">
                        <div class="service-icon flex-shrink-0 bg-primary">
                            <img class="img-fluid" src="img/icon/i1.png" alt="Inspections">
                        </div>
                        <a class="h4 mx-4 mb-0" href="#">Annual Inspections & Audits</a>
                    </div>
                    <p class="text-muted mt-2 p-3">Ensure your infrastructure is compliant and safe with annual inspections and audits to identify any structural or system weaknesses before they become costly issues.</p>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Service End -->


    <!-- About Start -->
    <div class="container-xxl py-5">
        <div class="container">
        
            <div class="row g-5 align-items-center">
                <div class="col-lg-6">
                    <div class="row g-3">
                        <div class="col-6 text-end">
                            <img class="img-fluid w-75 wow zoomIn" data-wow-delay="0.1s" src="img/d1.png" style="margin-top: 25%;">
                        </div>
                        <div class="col-6 text-start">
                            <img class="img-fluid w-100 wow zoomIn" data-wow-delay="0.3s" src="img/d2.webp">
                        </div>
                        <div class="col-6 text-end">
                            <img class="img-fluid w-50 wow zoomIn" data-wow-delay="0.5s" src="img/d3.jpg">
                        </div>
                        <div class="col-6 text-start">
                            <img class="img-fluid w-75 wow zoomIn" data-wow-delay="0.7s" src="img/d4.webp">
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.5s">
                    <div class="h-100">
                        <h1 class="display-6 mb-5">Welcome To InfraSight - Your Personalized Monitoring & Maintenance Assistant</h1>
                        <p class="mb-4">At InfraSight, we focus on optimizing infrastructure maintenance through advanced, data-driven predictive analytics. Our solutions are designed to enhance performance, reduce downtime, and provide long-term value for your assets.</p>
                        <p class="mb-4">We offer tailored services, utilizing cutting-edge technology and real-time data to predict maintenance needs. Our approach is to continuously evolve with emerging trends, ensuring your infrastructure is always ahead of the curve.</p>
                        <p class="mb-4">Our team of experts works closely with you to provide insights and strategies that address the unique challenges of your infrastructure. From temperature and humidity monitoring to predictive maintenance, InfraSight delivers actionable insights that improve operational efficiency.</p>
                        <div class="border-top mt-4 pt-4">
                            <h4 class="text-primary">Our Mission:</h4>
                            <p class="mb-4">To deliver sustainable and reliable monitoring solutions that enhance the resilience of infrastructure, improve efficiency, and promote safety for all our clients.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- About End -->



    <!-- Footer Start -->
    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                    <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we enhance infrastructure reliability while contributing to a more sustainable future. Our solutions are designed to optimize operational efficiency and reduce risks.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Join Us</h5>
                    <p>Get connected for the latest updates from InfraSight</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2"><a href="/register" style="color:white">SignUp</a></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">InfraSight</a>, All Right Reserved.
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Footer End -->


    <!-- Back to Top -->
    <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i class="bi bi-arrow-up"></i></a>


    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="lib/wow/wow.min.js"></script>
    <script src="lib/easing/easing.min.js"></script>
    <script src="lib/waypoints/waypoints.min.js"></script>
    <script src="lib/owlcarousel/owl.carousel.min.js"></script>
    <script src="lib/counterup/counterup.min.js"></script>
    <script src="lib/parallax/parallax.min.js"></script>

    <!-- Template Javascript -->
    <script src="js/main.js"></script>
</body>

</html>`;
    res.send(htmlContent);
});

app.get('/report', (req, res) => {
    let navButton;
      
    if (!req.session.username) {
      navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Login</a>`;
    } else {
      navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Logout</a>`;
    }
    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
    const htmlContent=`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>InfraSight - Graphs</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <meta content="" name="keywords">
    <meta content="" name="description">

    <!-- Favicon -->
    <link href="img/favicon.ico" rel="icon">

    <!-- Google Web Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 

    <!-- Icon Font Stylesheet -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Libraries Stylesheet -->
    <link href="lib/animate/animate.min.css" rel="stylesheet">
    <link href="lib/owlcarousel/assets/owl.carousel.min.css" rel="stylesheet">

    <!-- Customized Bootstrap Stylesheet -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Template Stylesheet -->
    <link href="css/style.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body>
    <!-- Spinner Start -->
    <div id="spinner" class="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center">
        <div class="spinner-grow text-primary" role="status"></div>
    </div>
    <!-- Spinner End -->


    


    <!-- Navbar Start -->
            <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
    <!-- Navbar End -->


    <!-- Page Header Start -->
    <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <h1 class="display-4 text-white animated slideInDown mb-4">Visual Dashboard</h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="/index">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Graphs</li>
                </ol>
            </nav>
        </div>
    </div>
    <!-- Page Header End -->


    <!-- About Start -->
    <div class="container-xxl py-5">
        <div class="container">
        
            <div class="row g-5 align-items-center">
            <div class="col-lg-6">
                    <div class="row g-3">
                        <div class="col-6 text-end">
                            <img class="img-fluid w-75 wow zoomIn" data-wow-delay="0.1s" src="img/d1.png" style="margin-top: 25%;">
                        </div>
                        <div class="col-6 text-start">
                            <img class="img-fluid w-100 wow zoomIn" data-wow-delay="0.3s" src="img/d2.webp" width=200px>
                        </div>
                        <div class="col-6 text-end">
                            <img class="img-fluid w-50 wow zoomIn" data-wow-delay="0.5s" src="img/d3.jpg">
                        </div>
                        <div class="col-6 text-start">
                            <img class="img-fluid w-75 wow zoomIn" data-wow-delay="0.7s" src="img/d4.webp">
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 wow fadeInUp" data-wow-delay="0.5s">
                    <div class="h-100">
                        <h1 class="display-6 mb-5">Welcome To Presonalized Best Monitoring & Maintainance Assistant</h1>
                        <div class="row g-4 mb-4">
                            
                               
                        </div>
                        <p class="mb-4">Data-Driven Insights: We utilize real-time data and historical trends to develop predictive models that anticipate maintenance needs.
                         <p class="mb-4">Tailored Solutions: Understanding that each infrastructure is unique, we provide customized strategies that align with the specific requirements of our clients.
                        <p class="mb-4">Collaboration and Support: Our team works closely with clients, providing ongoing support and expertise to ensure successful implementation and optimal results.

                        <div class="border-top mt-4 pt-4">
                          
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
    <!-- About End -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-5 align-items-center">
                <div class="col-lg-12 wow fadeInUp" data-wow-delay="0.5s">
                    <h1 class="display-6 mb-5">Graphs of Collected Data</h1>
                    <div class="container">
    <div class="row">
        <!-- First Row: Graph on the left, Image on the right -->
        <div class="col-lg-6 mb-4">
             
            <canvas id="temperatureChart"></canvas>
        </div>
        <div class="col-lg-6 mb-4">
           <h3>Temperature Sensor Data</h3>
            <img src="/img/t1.avif" alt="Temperature Sensor" class="img-fluid">
        </div>
    </div>

    <div class="row">
        <!-- Second Row: Image on the left, Graph on the right -->
        <div class="col-lg-6 mb-4">
            <h3>Humidity Sensor Data</h3>
            <img src="/img/t2.avif" alt="Humidity Sensor" class="img-fluid">
        </div>
        <div class="col-lg-6 mb-4">
          
            <canvas id="humidityChart"></canvas>
        </div>
    </div>

    <div class="row">
        <!-- Third Row: Graph on the left, Image on the right -->
        <div class="col-lg-6 mb-4">
           
            <canvas id="accelChart"></canvas>
        </div>
        <div class="col-lg-6 mb-4">
             <h3>Acceleration Sensor Data</h3>
            <img src="/img/t4.jpg" alt="Acceleration Sensor" class="img-fluid">
        </div>
    </div>

    <div class="row">
        <!-- Fourth Row: Image on the left, Graph on the right -->
        <div class="col-lg-6 mb-4">
            <h3>Pressure Sensor Data</h3>
            <img src="/img/t5.avif" alt="Pressure Sensor" class="img-fluid">
        </div>
        <div class="col-lg-6 mb-4">
            
            <canvas id="pressureChart"></canvas>
        </div>
    </div>
</div>

                </div>
            </div>
        </div>
    </div>

    

   
    <!-- Footer Start -->
    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                    <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we not only enhance infrastructure reliability but also contribute to a more sustainable future. We are passionate about delivering solutions that benefit our clients, their communities, and the environment.

<p>Join us in transforming the way infrastructure is managed. Together, we can build a smarter, more resilient world.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Join Us</h5>
                    <p>get connected for latest updates of the InfraSight</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2"><a href="/register" style="color:white">SignUp</a></button>
                    </div>
                </div>
               
                
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">InfraSight</a>, All Right Reserved.
                    </div>
                    <div class="col-md-6 text-center text-md-end">
                     
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Footer End -->


    <!-- Back to Top -->
    <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i class="bi bi-arrow-up"></i></a>


    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="lib/wow/wow.min.js"></script>
    <script src="lib/easing/easing.min.js"></script>
    <script src="lib/waypoints/waypoints.min.js"></script>
    <script src="lib/owlcarousel/owl.carousel.min.js"></script>
    <script src="lib/counterup/counterup.min.js"></script>
    <script src="lib/parallax/parallax.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script>
        // Fetch data and render charts
        $(document).ready(function () {
            $.get('/data', function (data) {
                const tdata = data.tdata;
                const adata = data.adata;

                
                const tempLabels = tdata.map(row => new Date(row.datetime).toLocaleDateString());
                const temLabels = adata.map(row => new Date(row.timestamp).toLocaleDateString());
                const tempData = tdata.map(row => row.temperature);
                const humidityData = tdata.map(row => row.humidity);
                const accelXData = adata.map(row => row.accel_x);
                const accelYData = adata.map(row => row.accel_y);
                const accelZData = adata.map(row => row.accel_z);
                const pressureData = adata.map(row => row.pressure);

                
                const ctx1 = document.getElementById('temperatureChart').getContext('2d');
                new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: tempLabels,
                        datasets: [{
                            label: 'Temperature',
                            data: tempData,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                // Chart for Humidity
                const ctx2 = document.getElementById('humidityChart').getContext('2d');
                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: tempLabels,
                        datasets: [{
                            label: 'Humidity',
                            data: humidityData,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                // Chart for Acceleration (combined)
                const ctx3 = document.getElementById('accelChart').getContext('2d');
                new Chart(ctx3, {
                    type: 'line',
                    data: {
                        labels: temLabels,
                        datasets: [{
                            label: 'Accel X',
                            data: accelXData,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: true,
                        }, {
                            label: 'Accel Y',
                            data: accelYData,
                            borderColor: 'rgba(255, 206, 86, 1)',
                            backgroundColor: 'rgba(255, 206, 86, 0.2)',
                            fill: true,
                        }, {
                            label: 'Accel Z',
                            data: accelZData,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                // Chart for Pressure
                const ctx4 = document.getElementById('pressureChart').getContext('2d');
                new Chart(ctx4, {
                    type: 'line',
                    data: {
                        labels: temLabels,
                        datasets: [{
                            label: 'Pressure',
                            data: pressureData,
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            });
        });
    </script>


    <!-- Template Javascript -->
    <script src="js/main.js"></script>
</body>

</html>`;
    res.send(htmlContent);
});

app.get('/reporting', (req, res) => {
    let navButton;
    
    if (!req.session.username) {
  
        navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link"style="margin-left:15px" >Login</a>`;

    } else {
          
        navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Logout</a>`;
    }

    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
  const { selectedDate } = req.query;
  let dateFilter = '';

  if (selectedDate) {
    // Format the date to MySQL compatible format
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    dateFilter = `WHERE DATE(timestamp) = '${formattedDate}'`; // Filter based on the selected date
  }

  const query = `SELECT * FROM predictive_maintenance ${dateFilter} ORDER BY timestamp DESC`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL:', err);
      res.status(500).send('Error fetching data');
      return;
    }

  
    let htmlContent = `
      <html>
        <head>
          <title>Predictive Maintenance Report</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" />
          <link href="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css" rel="stylesheet">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f8f9fa;
            }
            .container {
              margin-top: 20px;
            }
            .report-card {
              background-color: #ffffff;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 10px;
            }
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
            }
            .report-timestamp {
              font-size: 14px;
              color: #6c757d;
            }
            .measures {
              margin-top: 15px;
            }
            .measures pre {
              background-color: #e9ecef;
              padding: 10px;
              border-radius: 5px;
            }
            .btn-download {
              margin: 20px 0;
            }<meta charset="utf-8">
            <title>InfraSight - Predictive Maintenance</title>
        </style>
            <!-- External Resources -->
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 
            <link href="css/bootstrap.min.css" rel="stylesheet">
            <link href="css/style.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body style="color:#404040">
                <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
    <!-- Navbar End -->
    
    <!-- Page Header Start -->
    <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <h1 class="display-4 text-white animated slideInDown mb-4">Reports</h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="/index">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Predictive Maintenance Report</li>
                </ol>
            </nav>
        </div>
    </div>
          <div class="container">
            <h1 class="mb-4">Predictive Maintenance Report</h1>
            <form id="reportForm" method="GET" action="/reporting" class="d-flex align-items-center">
  
  <input type="text" id="datePicker" name="selectedDate" class="form-control mb-3 rounded-pill" style="width: 300px; margin-right:20px" />
  <button type="submit" class="btn btn-primary mb-3 ml-2 rounded-pill">Generate</button>
</form>

    `;

    if (results.length > 0) {
      results.forEach(row => {
        htmlContent += `
          <div class="report-card">
            <div class="report-header">
              <div class="report-title">Report ID: ${row.id}</div>
              <div class="report-timestamp">${new Date(row.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <strong>Temperature Prediction:</strong> ${row.temperature_prediction}
            </div>
            <div>
              <strong>Humidity Prediction:</strong> ${row.humidity_prediction}
            </div>
            <div>
              <strong>Acceleration Prediction:</strong> ${row.acceleration_prediction}
            </div>
            <div>
              <strong>Pressure Prediction:</strong> ${row.pressure_prediction}
            </div>
            <div class="measures">
              <strong>Temperature Measures:</strong>
              <pre>${JSON.parse(row.temperature_measures).join('  ')}</pre>
            </div>
            <div class="measures">
              <strong>Humidity Measures:</strong>
              <pre>${JSON.parse(row.humidity_measures).join('  ')
              }</pre>
            </div>
            <div class="measures">
              <strong>Acceleration Measures:</strong>
              <pre>${JSON.parse(row.acceleration_measures).join('  ')}</pre>
            </div>
            <div class="measures">
              <strong>Pressure Measures:</strong>
              <pre>${JSON.parse(row.pressure_measures).join('  ')}</pre>
            </div>
          </div>
        `;
      });

      htmlContent += `
        <button class="btn btn-primary btn-download" onclick="downloadCSV()">Download CSV</button>
        
      `;
    } else {
      htmlContent += `<p>No data available for the selected date.</p>`;
    }

    htmlContent += `
          </div>
          
    <!-- Footer Start -->
    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                    <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we not only enhance infrastructure reliability but also contribute to a more sustainable future. We are passionate about delivering solutions that benefit our clients, their communities, and the environment.

<p>Join us in transforming the way infrastructure is managed. Together, we can build a smarter, more resilient world.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Join Us</h5>
                    <p>get connected for latest updates of the InfraSight</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2"><a href="/register" style="color:white">SignUp</a></button>
                    </div>
                </div>
               
                
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">InfraSight</a>, All Right Reserved.
                    </div>
                    <div class="col-md-6 text-center text-md-end">
                     
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Footer End -->


    <!-- Back to Top -->
    <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i class="bi bi-arrow-up"></i></a>


    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="lib/wow/wow.min.js"></script>
    <script src="lib/easing/easing.min.js"></script>
    <script src="lib/waypoints/waypoints.min.js"></script>
    <script src="lib/owlcarousel/owl.carousel.min.js"></script>
    <script src="lib/counterup/counterup.min.js"></script>
    <script src="lib/parallax/parallax.min.js"></script>

    <!-- Template Javascript -->
    <script src="js/main.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js"></script>
          <script>
            // Initialize the date picker for single date selection
            $('#datePicker').daterangepicker({
              singleDatePicker: true,
              locale: {
                format: 'YYYY-MM-DD'
              }
            });

            // Function to download the report as CSV
            function downloadCSV() {
              let data = [];
              data.push('ID,Temperature Prediction,Humidity Prediction,Acceleration Prediction,Pressure Prediction,Temperature Measures,Humidity Measures,Acceleration Measures,Pressure Measures,Timestamp');
              
              ${results.map(row => `
                data.push('${row.id},${row.temperature_prediction},${row.humidity_prediction},${row.acceleration_prediction},${row.pressure_prediction},"${JSON.stringify(row.temperature_measures).replace(/"/g, '""')}","${JSON.stringify(row.humidity_measures).replace(/"/g, '""')}","${JSON.stringify(row.acceleration_measures).replace(/"/g, '""')}","${JSON.stringify(row.pressure_measures).replace(/"/g, '""')}",${new Date(row.timestamp).toLocaleString()}');
              `).join('')}
              
              let csvContent = data.join("\\n");
              let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              let link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = "predictive_maintenance_report.csv";
              link.click();
            }
          </script>
        </body>
      </html>
    `;

  
    res.send(htmlContent);
  });
});

app.get('/profile', (req, res) => {
    // Assuming you're storing the logged-in user's ID in the session
    const userId = req.session.username; // This depends on how you're handling authentication
  
    if (!userId) {
      return res.redirect('/login'); // If user is not logged in, redirect to login page
    }
  
    // Fetch user data from the users table
    const query = `SELECT * FROM users WHERE email = ?`;
  
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).send('Error fetching user data');
      }
  
      if (results.length === 0) {
        return res.status(404).send('User not found');
      }
  
      const user = results[0];
  
      // Send the profile page with the user data embedded in the HTML
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Profile</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" />
            <style>
              body {
                background-color: #f6f7fc ;
                font-family: 'Arial', sans-serif;
              }
              .profile-container {
                margin-top: 40px;
              }
              .profile-card {
                background-color: #fff;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                padding: 30px;
                margin-bottom: 30px;
              }
              .profile-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .profile-header h1 {
                font-size: 28px;
                font-weight: bold;
              }
              .profile-header button {
                background-color: #007bff;
                color: #fff;
                border-radius: 30px;
                padding: 10px 20px;
                border: none;
              }
              .profile-details {
                margin-top: 30px;
              }
              .profile-details h4 {
                margin-bottom: 10px;
              }
              .profile-details p {
                font-size: 16px;
                color: #555;
              }
              .profile-footer {
                margin-top: 40px;
                text-align: center;
                font-size: 14px;
                color: #888;
              }
              .profile-card img {
                border-radius: 50%;
                width: 159px;
                height: 156px;
                object-fit: cover;
              }
              @media (max-width: 768px) {
                .profile-header {
                  flex-direction: column;
                  align-items: flex-start;
                }
                .profile-header button {
                  width: 100%;
                  margin-top: 10px;
                }
              }
            </style>
             <!-- External Resources -->
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 
            <link href="css/bootstrap.min.css" rel="stylesheet">
            <link href="css/style.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          </head>
          <body>
            <div class="container profile-container" style="margin-top: 100px; width:600px;">
              <div class="row justify-content-center">
                <div class="col-lg-8 col-md-10 col-sm-12">
                  <div class="profile-card">
                    <div class="profile-header">
                      <div>
                        <h1>${user.name}</h1>
                        
                      </div>
                      <img src="${user.profile_picture || 'img/prof.avif'}" alt="Profile Picture">
                    </div>
                    <div class="profile-details">
                      <h4>About</h4>
                      <p class="text-muted">Email: ${user.email}</p>
                      <p class="text-muted">Phone.no: ${user.phone_no}</p>
                      <p class="text-muted">Address: ${user.address}</p>
                      <p class="text-muted">City: ${user.city}</p>
                      
                    </div>
                    <div class="profile-footer">
                      
                      <a href="/logout" class="btn btn-primary rounded-pill nav-link">Logout</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
          </body>
        </html>
      `);
    });
  });
  
app.get('/inst', (req, res) => {
    let navButton;
      
    if (!req.session.username) {
      navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Login</a>`;
    } else {
      navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Logout</a>`;
    }
    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Installation Procedure</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" />
          <style>
            body {
              background-color: #f4f7fc;
              font-family: 'Arial', sans-serif;
            }
            
            .procedure-step {
              margin-bottom: 30px;
              text-align: center;
            }
            .procedure-step img {
              max-width: 100%;
              height: auto;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              margin-bottom: 10px;
            }
            .procedure-step h4 {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .procedure-step p {
              font-size: 16px;
              color: #555;
            }
            
            .btn-primary {
              background-color: #007bff;
              border-color: #007bff;
              border-radius: 30px;
            }
          </style>
            
            <!-- External Resources -->
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 
            <link href="css/bootstrap.min.css" rel="stylesheet">
            <link href="css/style.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body >
        <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
    <!-- Navbar End -->
    
    <!-- Page Header Start -->
    <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <h1 class="display-4 text-white animated slideInDown mb-4">How InfraSight works?</h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="/index">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Installation</li>
                </ol>
            </nav>
        </div>
    </div>
   <center>
  <div class="">
    <div class="row">
      <div class="col-4 p-0">
        <img src="/img/1.png" alt="Step 1 Image" class="img-fluid" style="width:100%;">
      </div>
      <div class="col-4 p-0">
        <img src="/img/4.png" alt="Step 2 Image" class="img-fluid" style="width:100%;">
      </div>
      <div class="col-4 p-0">
        <img src="/img/2.png" alt="Step 3 Image" class="img-fluid" style="width:100%;">
      </div>
    </div>
    <div class="row">
      <div class="col-4 p-0">
        <img src="/img/5.png" alt="Step 4 Image" class="img-fluid" style="width:100%;">
      </div>
      <div class="col-4 p-0">
        <img src="/img/3.png" alt="Step 5 Image" class="img-fluid" style="width:100%;">
      </div>
      <div class="col-4 p-0">
        <img src="/img/6.png" alt="Step 6 Image" class="img-fluid" style="width:100%;">
      </div>
    </div>
  </div>
</center>

 <!-- Footer Start -->
    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                    <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we not only enhance infrastructure reliability but also contribute to a more sustainable future. We are passionate about delivering solutions that benefit our clients, their communities, and the environment.

<p>Join us in transforming the way infrastructure is managed. Together, we can build a smarter, more resilient world.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Join Us</h5>
                    <p>get connected for latest updates of the InfraSight</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2"><a href="/register" style="color:white">SignUp</a></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">InfraSight</a>, All Right Reserved.
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
    <!-- Footer End -->


    <!-- Back to Top -->
    <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i class="bi bi-arrow-up"></i></a>


    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="lib/wow/wow.min.js"></script>
    <script src="lib/easing/easing.min.js"></script>
    <script src="lib/waypoints/waypoints.min.js"></script>
    <script src="lib/owlcarousel/owl.carousel.min.js"></script>
    <script src="lib/counterup/counterup.min.js"></script>
    <script src="lib/parallax/parallax.min.js"></script>

    
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
        </body>
      </html>
    `);
  });
  

  app.get('/product', (req, res) => {
    let navButton;
      
    if (!req.session.username) {
      navButton = `<a href="/login" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Login</a>`;
    } else {
      navButton = `<a href="/logout" class="btn btn-primary rounded-pill nav-link" style="margin-left:15px">Logout</a>`;
    }
    let userEmail = req.session.username;
    if(!userEmail){
        userEmail="guest";
    }
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="utf-8">
        <title>Product Buying Page</title>
        <meta content="width=device-width, initial-scale=1.0" name="viewport">
        <meta content="" name="keywords">
        <meta content="" name="description">

        <!-- Favicon -->
        <link href="img/favicon.ico" rel="icon">

        <!-- Google Web Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"> 

        <!-- Icon Font Stylesheet -->
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">

        <!-- Libraries Stylesheet -->
        <link href="lib/animate/animate.min.css" rel="stylesheet">
        <link href="lib/owlcarousel/assets/owl.carousel.min.css" rel="stylesheet">

        <!-- Customized Bootstrap Stylesheet -->
        <link href="css/bootstrap.min.css" rel="stylesheet">

        <!-- Template Stylesheet -->
        <link href="css/style.css" rel="stylesheet">
    </head>

    <body>
                <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
            <a href="index.php" class="navbar-brand d-flex align-items-center">
                <h1 class="m-0"><img class="img-fluid me-3" src="../img/icon/i1.png" alt="">InfraSight</h1>
            </a>
            <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
               
                <div class="h-100 d-lg-inline-flex align-items-center d-none">
                    <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                    <a href="/index" class="nav-item nav-link active">Home</a>
                    <a href="/product" class="nav-item nav-link">Order Product</a>
                    <a href="/pdm" class="nav-item nav-link">PDM</a>
                    
                    <div class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                        <div class="dropdown-menu bg-light border-0 m-0">
                            <a href="/profile" class="dropdown-item">hello, ${userEmail}</a>
                            
                            <a href="/inst" class="dropdown-item">Installation</a>
                            <a href="/report" class="dropdown-item">Graphs</a>
                            <a href="/reporting" class="dropdown-item">Reports</a>
                        </div>
                    </div>
                    
                </div>
                ${navButton} 
                </div>
            </div>
        </nav>
        <!-- Navbar End -->

        <!-- Page Header Start -->
        <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
            <div class="container text-center py-5">
                <h1 class="display-4 text-white animated slideInDown mb-4">Our Products</h1>
                <nav aria-label="breadcrumb animated slideInDown">
                    <ol class="breadcrumb justify-content-center mb-0">
                        <li class="breadcrumb-item"><a href="/index">Home</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Products</li>
                    </ol>
                </nav>
            </div>
        </div>
        <!-- Page Header End -->

        <!-- Product Section Start -->
        <div class="container py-5">
            <div class="row g-4">
                <!-- Infrabot -->
                <div class="col-md-6">
                    <!-- Product Image Slideshow -->
                    <div id="product-carousel" class="carousel slide" data-bs-ride="carousel">
                        <div class="carousel-inner">
                            <div class="carousel-item active">
                                <img src="img/meter.jpg" class="d-block w-100" alt="Infrabot 1" style="width:150px; height:600px">
                            </div>
                            <div class="carousel-item">
                                <img src="img/11.png" class="d-block w-100" alt="Infrabot 2">
                            </div>
                            <div class="carousel-item">
                                <img src="img/new.png" class="d-block w-100" alt="Infrabot 3">
                            </div>
                        </div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#product-carousel" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Previous</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#product-carousel" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Next</span>
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <h3>Infrabot</h3>
                    <p class="price">₹1099/-</p>

                    <!-- Rating -->
                    <div class="rating mb-3">
                        ⭐⭐⭐⭐⭐
                        <span>(5/5)</span>
                    </div>

                    <!-- Product Information -->
                    <p>Infrabot is an advanced infrastructure monitoring and maintenance robot. It helps in predictive maintenance by using real-time data and enhances infrastructure reliability.<br>
                    Infrabot is a revolutionary, AI-driven robot designed to monitor and manage the health of large-scale infrastructure, such as buildings, bridges, highways, and industrial facilities. Utilizing cutting-edge IoT sensors and machine learning algorithms, Infrabot proactively detects anomalies, predicts potential failures, and provides actionable insights to ensure long-term sustainability, cost-efficiency, and safety.</p>
                    <ul>
                        <li>Predictive Maintenance Assistant</li>
                        <li>Advanced AI and IoT Integration</li>
                        <li>Supports infrastructure health management</li>
                    </ul>

                    <!-- Add to Cart Button -->
                    <button class="btn btn-primary add-to-cart" data-id="1" data-name="Infrabot" data-price="1099">Add to Cart</button>
                </div>
            </div>
        </div>
        <!-- Product Section End -->

        <!-- Cart Panel Start -->
        <div class="cart-panel position-fixed top-0 end-0 bg-light p-4" style="width: 300px; height: 100%; display: none;">
            <h5>Shopping Cart</h5>
            <div id="cart-items"></div>
            <div class="d-flex justify-content-between mt-3">
                <span>Total:</span>
                <span id="cart-total">₹0</span>
            </div>
            <button class="btn btn-danger mt-3" id="clear-cart">Clear Cart</button>
        </div>
        <!-- Cart Panel End -->

        
 <!-- Footer Start -->
    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">InfraSight</h1>
                    <span>At InfraSight, we are committed to sustainability and safety. By focusing on preventive measures, we not only enhance infrastructure reliability but also contribute to a more sustainable future. We are passionate about delivering solutions that benefit our clients, their communities, and the environment.

<p>Join us in transforming the way infrastructure is managed. Together, we can build a smarter, more resilient world.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Join Us</h5>
                    <p>get connected for latest updates of the InfraSight</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2"><a href="/register" style="color:white">SignUp</a></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">InfraSight</a>, All Right Reserved.
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
        <!-- Footer End -->

        <!-- Back to Top -->
        <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i class="bi bi-arrow-up"></i></a>

        <!-- JavaScript Libraries -->
        <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>

        <!-- Template Javascript -->
        <script>
            $(document).ready(function() {
                let cart = [];

                $('.add-to-cart').click(function() {
                    const product = {
                        id: $(this).data('id'),
                        name: $(this).data('name'),
                        price: parseInt($(this).data('price'))
                    };

                    cart.push(product);
                    updateCart();
                    $('.cart-panel').show();
                });

                function updateCart() {
                    let cartContent = '';
                    let total = 0;

                    cart.forEach((item) => {
                        cartContent += \`
                            <div class="cart-item">
                                <p>\${item.name} - ₹\${item.price}/-</p>
                            </div>
                        \`;
                        total += item.price;
                    });

                    $('#cart-items').html(cartContent);
                    $('#cart-total').text(\`₹\${total}/-\`);
                }

                $('#clear-cart').click(function() {
                    cart = [];
                    updateCart();
                });
            });
        </script>
    </body>

    </html>
    `;
    res.send(htmlContent);
});









app.use('/', loginRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
