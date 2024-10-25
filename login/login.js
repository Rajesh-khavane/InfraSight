require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const path=require('path');
const router = express.Router();


const PORT = process.env.PORT || 3000;
router.use(express.static(__dirname));
router.use(express.static(path.join(__dirname, '..')));

router.use(express.static('public'));
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());
router.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // session cookie duration
}));

// MySQL connection
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

// Set up Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD // Your email password or router password
    }
});

// Forgot Password route
router.get('/forgot-password', (req, res) => {
    const errorMsg = req.query.error ? `<p class="text-danger">${req.query.error}</p>` : '';
    res.send(`
        <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="css/bootstrap.min.css">
        <link rel="stylesheet" href="css/style.css"> <!-- Custom CSS -->
        <title>Forgot Password</title>
      </head>
      <body class="bg-light" style="background-image: url('images/bg_1.jpg');">
        <div class="container" >
          <div class="row justify-content-center align-items-center" style="min-height: 100vh;">
            <div class="col-md-6">
              <div class="card shadow">
                <div class="card-header text-center">
                  <h3>Forgot Password</h3>
                </div>
                <div class="card-body">
                  ${errorMsg}
                  <form action="/forgot-password" method="POST">
                    <div class="form-group">
                      <label for="email">Email Address</label>
                      <input type="email" class="form-control" name="email" id="email" placeholder="Enter your email" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
                  </form>
                  <div class="text-center mt-3">
                    <a href="/" class="text-muted">Back to Login</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <script src="js/jquery-3.3.1.min.js"></script>
        <script src="js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
    `);
});


// Handle forgot password form submission
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    db.execute('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.redirect('/forgot-password?error=Database error');
        }
        if (results.length === 0) {
            return res.redirect('/forgot-password?error=Email not found');
        }

        // Generate a reset token (you can enhance this logic)
        const resetToken = Math.random().toString(36).substring(2); // Simple token
        const resetLink = `http://localhost:${PORT}/reset-password?token=${resetToken}&email=${email}`;

        // Send email with reset link
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.redirect('/forgot-password?error=Failed to send email');
            }
            console.log('Email sent: ' + info.response);
            res.redirect('/?message=Password reset link sent to your email.');
        });
    });
});

// Password Reset route
router.get('/reset-password', (req, res) => {
    const { token, email } = req.query;
    res.send(`
        <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="css/bootstrap.min.css">
        <link rel="stylesheet" href="css/style.css"> <!-- Custom CSS -->
        <title>Reset Password</title>
      </head>
      <body class="bg-light" style="background-image: url('images/bg_1.jpg');">
        <div class="container" >
          <div class="row justify-content-center align-items-center" style="min-height: 100vh;">
            <div class="col-md-6">
              <div class="card shadow">
                <div class="card-header text-center">
                  <h3>Reset Password</h3>
                </div>
                <div class="card-body">
                  <form action="/reset-password" method="POST">
                    <input type="hidden" name="email" value="${email}">
                    <input type="hidden" name="token" value="${token}">
                    <div class="form-group">
                      <label for="newPassword">New Password</label>
                      <input type="password" class="form-control" name="newPassword" id="newPassword" placeholder="Enter your new password" required>
                    </div>
                    <div class="form-group">
                      <label for="confirmPassword">Confirm Password</label>
                      <input type="password" class="form-control" name="confirmPassword" id="confirmPassword" placeholder="Confirm your new password" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
                  </form>
                  
                </div>
                
              </div>
              
            </div>
          </div>
        </div>
        <script src="js/jquery-3.3.1.min.js"></script>
        <script src="js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
    `);
});

// Handle new password submission
router.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;

    // Update the user's password in the database
    db.execute('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.redirect('/reset-password?error=Database error');
        }
        res.redirect('/?message=Password successfully updated.');
    });
});


// Registration route
router.post('/register', (req, res) => {
    const { email, name, phone_no, address, city, password } = req.body;

    db.execute('SELECT * FROM users WHERE email = ? OR phone_no = ?', [email, phone_no], (err, results) => {
        if (err) {
            console.error('Database error on SELECT:', err);
            return res.redirect('/register?error=Database error');
        }
        if (results.length > 0) {
            return res.redirect('/register?error=Email or phone number already exists');
        }

        // Insert new user
        db.execute('INSERT INTO users (email, name, phone_no, address, city, password) VALUES (?, ?, ?, ?, ?, ?)', 
            [email, name, phone_no, address, city, password], 
            (err) => {
                if (err) return res.redirect('/register?error=Database error');
                res.redirect('/login');
            });
    });
});

router.post('/login', (req, res) => {
  const { email, password, rememberMe } = req.body;

  db.execute('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return res.redirect('/?error=Database error');

      if (results.length > 0 && results[0].password === password) {
          req.session.username = email;

          if (rememberMe) {
              res.cookie('username', email, { maxAge: 86400000 });
          }
          req.session.user = email;
        
          return res.redirect('/index');
      }

      res.redirect('/?error=Invalid credentials');
  });
});



// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('username');
    res.redirect('/');
});

// Registration page route
router.get('/register', (req, res) => {
    const errorMsg = req.query.error ? `<p style="color:red;">${req.query.error}</p>` : '';
    res.send(`
        <html lang="en">
      <head>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap" rel="stylesheet">
    
        <link rel="stylesheet" href="fonts/icomoon/style.css">
    
        <link rel="stylesheet" href="/css/owl.carousel.min.css">
    
        <!-- Bootstrap CSS -->
        <link rel="stylesheet" href="/css/bootstrap.min.css">
        
        <!-- Style -->
        <link rel="stylesheet" href="/css/style.css">
        <style>
.owl-carousel,.owl-carousel .owl-item{-webkit-tap-highlight-color:transparent;position:relative}.owl-carousel{display:none;width:100%;z-index:1}.owl-carousel .owl-stage{position:relative;-ms-touch-action:pan-Y;touch-action:manipulation;-moz-backface-visibility:hidden}.owl-carousel .owl-stage:after{content:".";display:block;clear:both;visibility:hidden;line-height:0;height:0}.owl-carousel .owl-stage-outer{position:relative;overflow:hidden;-webkit-transform:translate3d(0,0,0)}.owl-carousel .owl-item,.owl-carousel .owl-wrapper{-webkit-backface-visibility:hidden;-moz-backface-visibility:hidden;-ms-backface-visibility:hidden;-webkit-transform:translate3d(0,0,0);-moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0)}.owl-carousel .owl-item{min-height:1px;float:left;-webkit-backface-visibility:hidden;-webkit-touch-callout:none}.owl-carousel .owl-item img{display:block;width:100%}.owl-carousel .owl-dots.disabled,.owl-carousel .owl-nav.disabled{display:none}.no-js .owl-carousel,.owl-carousel.owl-loaded{display:block}.owl-carousel .owl-dot,.owl-carousel .owl-nav .owl-next,.owl-carousel .owl-nav .owl-prev{cursor:pointer;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.owl-carousel .owl-nav button.owl-next,.owl-carousel .owl-nav button.owl-prev,.owl-carousel button.owl-dot{background:0 0;color:inherit;border:none;padding:0!important;font:inherit}.owl-carousel.owl-loading{opacity:0;display:block}.owl-carousel.owl-hidden{opacity:0}.owl-carousel.owl-refresh .owl-item{visibility:hidden}.owl-carousel.owl-drag .owl-item{-ms-touch-action:pan-y;touch-action:pan-y;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.owl-carousel.owl-grab{cursor:move;cursor:grab}.owl-carousel.owl-rtl{direction:rtl}.owl-carousel.owl-rtl .owl-item{float:right}.owl-carousel .animated{animation-duration:1s;animation-fill-mode:both}.owl-carousel .owl-animated-in{z-index:0}.owl-carousel .owl-animated-out{z-index:1}.owl-carousel .fadeOut{animation-name:fadeOut}@keyframes fadeOut{0%{opacity:1}100%{opacity:0}}.owl-height{transition:height .5s ease-in-out}.owl-carousel .owl-item .owl-lazy{opacity:0;transition:opacity .4s ease}.owl-carousel .owl-item .owl-lazy:not([src]),.owl-carousel .owl-item .owl-lazy[src^=""]{max-height:0}.owl-carousel .owl-item img.owl-lazy{transform-style:preserve-3d}.owl-carousel .owl-video-wrapper{position:relative;height:100%;background:#000}.owl-carousel .owl-video-play-icon{position:absolute;height:80px;width:80px;left:50%;top:50%;margin-left:-40px;margin-top:-40px;background:url(owl.video.play.png) no-repeat;cursor:pointer;z-index:1;-webkit-backface-visibility:hidden;transition:transform .1s ease}.owl-carousel .owl-video-play-icon:hover{-ms-transform:scale(1.3,1.3);transform:scale(1.3,1.3)}.owl-carousel .owl-video-playing .owl-video-play-icon,.owl-carousel .owl-video-playing .owl-video-tn{display:none}.owl-carousel .owl-video-tn{opacity:0;height:100%;background-position:center center;background-repeat:no-repeat;background-size:contain;transition:opacity .4s ease}.owl-carousel .owl-video-frame{position:relative;z-index:1;height:100%;width:100%}
        
        body {
  font-family: "Roboto", sans-serif;
  background-color: #fff; }

p {
  color: #b3b3b3;
  font-weight: 300; }

h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6 {
  font-family: "Roboto", sans-serif; }

a {
  -webkit-transition: .3s all ease;
  -o-transition: .3s all ease;
  transition: .3s all ease; }
  a:hover {
    text-decoration: none !important; }

.content {
  padding: 7rem 0; }

h2 {
  font-size: 20px; }

.half, .half .container > .row {
  height: 100vh;
  min-height: 700px; }

@media (max-width: 991.98px) {
  .half .bg {
    height: 200px; } }

.half .contents {
  background: #f6f7fc; }

.half .contents, .half .bg {
  width: 50%; }
  @media (max-width: 1199.98px) {
    .half .contents, .half .bg {
      width: 100%; } }
  .half .contents .form-control, .half .bg .form-control {
    border: none;
    -webkit-box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    height: 54px;
    background: #fff; }
    .half .contents .form-control:active, .half .contents .form-control:focus, .half .bg .form-control:active, .half .bg .form-control:focus {
      outline: none;
      -webkit-box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1); }

.half .bg {
  background-size: cover;
  background-position: center; }

.half a {
  color: #888;
  text-decoration: underline; }

.half .btn {
  height: 54px;
  padding-left: 30px;
  padding-right: 30px; }

.half .forgot-pass {
  position: relative;
  top: 2px;
  font-size: 14px; }

.control {
  display: block;
  position: relative;
  padding-left: 30px;
  margin-bottom: 15px;
  cursor: pointer;
  font-size: 14px; }
  .control .caption {
    position: relative;
    top: .2rem;
    color: #888; }

.control input {
  position: absolute;
  z-index: -1;
  opacity: 0; }

.control__indicator {
  position: absolute;
  top: 2px;
  left: 0;
  height: 20px;
  width: 20px;
  background: #e6e6e6;
  border-radius: 4px; }

.control--radio .control__indicator {
  border-radius: 50%; }

.control:hover input ~ .control__indicator,
.control input:focus ~ .control__indicator {
  background: #ccc; }

.control input:checked ~ .control__indicator {
  background: #fb771a; }

.control:hover input:not([disabled]):checked ~ .control__indicator,
.control input:checked:focus ~ .control__indicator {
  background: #fb8633; }

.control input:disabled ~ .control__indicator {
  background: #e6e6e6;
  opacity: 0.9;
  pointer-events: none; }

.control__indicator:after {
  font-family: 'icomoon';
  content: '\e5ca';
  position: absolute;
  display: none;
  font-size: 16px;
  -webkit-transition: .3s all ease;
  -o-transition: .3s all ease;
  transition: .3s all ease; }

.control input:checked ~ .control__indicator:after {
  display: block;
  color: #fff; }

.control--checkbox .control__indicator:after {
  top: 50%;
  left: 50%;
  margin-top: -1px;
  -webkit-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%); }

.control--checkbox input:disabled ~ .control__indicator:after {
  border-color: #7b7b7b; }

.control--checkbox input:disabled:checked ~ .control__indicator {
  background-color: #7e0cf5;
  opacity: .2; }
</style>
    
        <title>Register</title>
      </head>
      <body>
      
    
      <div class="d-lg-flex half">
        <div class="bg order-2 order-md-1" style="background-image: url('images/reg.jpg');"></div>
        <div class="contents order-1 order-md-2">
    
          <div class="container">
            <div class="row align-items-center justify-content-center">
              <div class="col-md-7">
                <h3>Register to <strong>InfraSight</strong></h3><br>
                ${errorMsg}
               
                <form action="/register" method="POST">

                  <div class="form-group first" style="padding-bottom:20px">
                    
                    <input type="text" class="form-control" name="email" placeholder="Email (Username)" required>
                  </div>

                  <div class="form-group first" style="padding-bottom:20px">
                  
                    <input type="text" class="form-control" name="name" placeholder="Full Name" required>
                  </div><div class="form-group first" style="padding-bottom:20px">

                   
                    <input type="tel" class="form-control" name="phone_no" placeholder="Phone Number" required>
                  </div><div class="form-group first" style="padding-bottom:20px">

                    
                    <input type="text" class="form-control" name="address" placeholder="Address" required>
                  </div>

                  <div class="form-group first" style="padding-bottom:20px">
                  
                    <input type="text" class="form-control" name="city" placeholder="City" required>
                  </div>

                  <div class="form-group last mb-3" style="padding-bottom:20px">
                 
                    <input type="password" class="form-control" name="password" class="form-control" placeholder="Your Password" id="password">
                  </div>
                  
                  
                  <div class="d-flex mb-5 align-items-center">
                   <p>Already have an account? <span class="ml-auto"><a href="/" class="forgot-pass">Login here</a></span></p>
                  </div>
                  <input type="submit" value="Register" class="btn btn-block btn-primary">
                </form>
              </div>
            </div>
          </div>
        </div>
    
        
      </div>
        
        
    
        <script src="js/jquery-3.3.1.min.js"></script>
        <script src="js/popper.min.js"></script>
        <script src="js/bootstrap.min.js"></script>
        <script src="js/main.js"></script>
      </body>
    </html>
    `);
});



// Home route (login page)
router.get('/login', (req, res) => {
    const errorMsg = req.query.error ? `<p style="color:red;">${req.query.error}</p>` : '';
    const usernameCookie = req.cookies.username ? req.cookies.username : '';
    res.send(`
  
    <html lang="en">
      <head>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap" rel="stylesheet">
    
        <link rel="stylesheet" href="fonts/icomoon/style.css">
    
        <link rel="stylesheet" href="css/owl.carousel.min.css">
    
        <!-- Bootstrap CSS -->
        <link rel="stylesheet" href="css/bootstrap.min.css">
        
        <!-- Style -->
        <link rel="stylesheet" href="css/style.css">
    
        <title>Login</title>
      </head>
      <body>
      
    
      <div class="d-lg-flex half">
        <div class="bg order-1 order-md-2" style="background-image: url('images/login1.png');"></div>
        <div class="contents order-2 order-md-1">
    
          <div class="container">
            <div class="row align-items-center justify-content-center">
              <div class="col-md-7">
                <h3>Login to <strong>InfraSight</strong></h3>
                ${errorMsg}
                <p class="mb-4">Establishing sustainable maintainance for Best Health of your Infrastructures.</p>
                <form action="/login" method="post">
                  <div class="form-group first">
                    <label for="username">Username</label>
                    <input type="text" name="email" class="form-control" placeholder="your-email@gmail.com" value="${usernameCookie}" id="username">
                  </div>
                  <div class="form-group last mb-3">
                    <label for="password">Password</label>
                    <input type="password" name="password" class="form-control" placeholder="Your Password" id="password">
                  </div>
                  
                  <div class="d-flex mb-5 align-items-center">
                    <label class="control control--checkbox mb-0"><span class="caption">Remember me</span>
                      <input type="checkbox" checked="checked" id="rememberMe"/>
                      <div class="control__indicator"></div>
                    </label><p></p>
                    <span class="ml-auto"><a href="/forgot-password" class="forgot-pass">Forgot Password</a></span>
                    <span class="ml-auto"><a href="/register" class="forgot-pass">Register here</a></span>
                  </div>
    
                  <input type="submit" value="Login" class="btn btn-block btn-primary">
    
                </form>
              </div>
            </div>
          </div>
        </div>
    
        
      </div>
        
        
    
        <script src="js/jquery-3.3.1.min.js"></script>
        <script src="js/popper.min.js"></script>
        <script src="js/bootstrap.min.js"></script>
        <script src="js/main.js"></script>
      </body>
    </html>

    
    `);
});



module.exports = router;