<?php 
  include 'dbc.php';  
 ?>
<!DOCTYPE html>
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





    <!-- Navbar Start -->
<nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top px-4 px-lg-5">
        <a href="index.php" class="navbar-brand d-flex align-items-center">
            <h1 class="m-0"><img class="img-fluid me-3" src="img/icon/icon-02-primary.png" alt="">InfraSight</h1>
        </a>
        <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarCollapse"  style="align-content: flex-end; margin-left: 650px;">
           
            <div class="h-100 d-lg-inline-flex align-items-center d-none">
                <div class="navbar-nav mx-auto bg-light pe-4 py-3 py-lg-0">
                <a href="index.php" class="nav-item nav-link active">Home</a>
                <a href="about.php" class="nav-item nav-link">About us</a>
                <a href="service.php" class="nav-item nav-link">Order Product</a>
                <a href="profile.php" class="nav-item nav-link">Readings</a>
                <div class="nav-item dropdown">
                    <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"><b>Profile</b></a>
                    <div class="dropdown-menu bg-light border-0 m-0">
                        <a href="feature.php" class="dropdown-item">Features</a>
                        <a href="quote.php" class="dropdown-item">Free Quote</a>
                        <a href="team.php" class="dropdown-item">Our Team</a>
                        <a href="testimonial.php" class="dropdown-item">Testimonial</a>
                        <a href="404.php" class="dropdown-item">404 Page</a>
                    </div>
                </div>
                
            </div>
            </div>
        </div>
    </nav>

    <!-- Page Header Start -->
    <div class="container-fluid page-header py-5 mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container text-center py-5">
            <h1 class="display-4 text-white animated slideInDown mb-4">Readings</h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="#">Home</a></li>
                    <li class="breadcrumb-item"><a href="#">Profile</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Readings</li>
                </ol>
            </nav>
        </div>
    </div>
    <!-- Page Header End -->
    

    <!-- Features Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-5">

<div style="overflow-x: auto; max-width: 100%;">
  <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
    <thead style="background-color: #FF800F; color: white;">
      <tr>
        <th scope="col" style="padding: 8px; border: 1px solid #dee2e6;">R.no</th>
        <th scope="col" style="padding: 8px; border: 1px solid #dee2e6;">Temprature</th>
        <th scope="col" style="padding: 8px; border: 1px solid #dee2e6;">Humidity</th>
        <th scope="col" style="padding: 8px; border: 1px solid #dee2e6;">Date & Time</th>
      </tr>
    </thead>
     
    <tbody>
        <?php
        $query="select * from tdata";
        $run=mysqli_query($con,$query);
        
        if($run){
            while ($row=mysqli_fetch_assoc($run)) {
    ?> 
      <tr>
        <th scope="row" style="padding: 8px; border: 1px solid #dee2e6;">Reading <?php echo $row['id']; ?></th>
        <td style="padding: 8px; border: 1px solid #dee2e6;"><?php echo $row['temperature']; ?></td>
        <td style="padding: 8px; border: 1px solid #dee2e6;"><?php echo $row['humidity']; ?></td>
        <td style="padding: 8px; border: 1px solid #dee2e6;"><?php echo $row['datetime']; ?></td>
      </tr>
       <?php
    }
    }
    ?>
    </tbody>
  </table>
</div>
            </div>
        </div>       
    </div>
    <!-- Features End -->
        

    <!-- Footer Start 
    <div class="container-fluid bg-dark footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
            <div class="row g-5">
                <div class="col-md-6">
                    <h1 class="text-white mb-4"><img class="img-fluid me-3" src="img/icon/icon-02-light.png" alt="">AirCon</h1>
                    <span>Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit.</span>
                </div>
                <div class="col-md-6">
                    <h5 class="text-light mb-4">Newsletter</h5>
                    <p>Clita erat ipsum et lorem et sit, sed stet lorem sit clita.</p>
                    <div class="position-relative">
                        <input class="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email">
                        <button type="button" class="btn btn-primary py-2 px-3 position-absolute top-0 end-0 mt-2 me-2">SignUp</button>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5 class="text-light mb-4">Get In Touch</h5>
                    <p><i class="fa fa-map-marker-alt me-3"></i>123 Street, New York, USA</p>
                    <p><i class="fa fa-phone-alt me-3"></i>+012 345 67890</p>
                    <p><i class="fa fa-envelope me-3"></i>info@example.com</p>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5 class="text-light mb-4">Our Services</h5>
                    <a class="btn btn-link" href="">AC Installation</a>
                    <a class="btn btn-link" href="">Cooling Services</a>
                    <a class="btn btn-link" href="">Heating Services</a>
                    <a class="btn btn-link" href="">Annual Inspections</a>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5 class="text-light mb-4">Quick Links</h5>
                    <a class="btn btn-link" href="">About Us</a>
                    <a class="btn btn-link" href="">Contact Us</a>
                    <a class="btn btn-link" href="">Our Services</a>
                    <a class="btn btn-link" href="">Terms & Condition</a>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5 class="text-light mb-4">Follow Us</h5>
                    <div class="d-flex">
                        <a class="btn btn-square rounded-circle me-1" href=""><i class="fab fa-twitter"></i></a>
                        <a class="btn btn-square rounded-circle me-1" href=""><i class="fab fa-facebook-f"></i></a>
                        <a class="btn btn-square rounded-circle me-1" href=""><i class="fab fa-youtube"></i></a>
                        <a class="btn btn-square rounded-circle me-1" href=""><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid copyright">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        &copy; <a href="#">Your Site Name</a>, All Right Reserved.
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
     Footer End -->


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

</html>