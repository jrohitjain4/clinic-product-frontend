import { useState, useEffect } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import "./homePage.scss";

const SERVICES = [
  { id: 1, name: "Cardiology", desc: "Expert heart care and surgery.", icon: "ti ti-heartbeat" },
  { id: 2, name: "Neurology", desc: "Advanced brain and nerve treatments.", icon: "ti ti-brain" },
  { id: 3, name: "Orthopedics", desc: "Bone, joint, and muscle care.", icon: "ti ti-bone" },
  { id: 4, name: "Dental Care", desc: "Complete oral health solutions.", icon: "ti ti-dental" },
  { id: 5, name: "Pediatrics", desc: "Dedicated care for children.", icon: "ti ti-baby" },
  { id: 6, name: "Eye Care", desc: "Vision correction and eye health.", icon: "ti ti-eye" },
];

const BANNERS = [
  {
    title: "Premium Health Screenings",
    subtitle: "Get 20% off on all full-body checkups this month.",
    bgImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    bgClass: "banner-blue"
  },
  {
    title: "24/7 Emergency Care",
    subtitle: "Always open. Always ready. We are here when you need us most.",
    bgImage: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    bgClass: "banner-red"
  },
  {
    title: "Specialized Maternity Care",
    subtitle: "Comprehensive monitoring and nurturing for expecting mothers.",
    bgImage: "https://images.unsplash.com/photo-1555252834-31b4028eeb37?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    bgClass: "banner-green"
  }
];

const DOCTORS = [
  { name: "Dr. Sarah Taylor", spec: "Cardiologist", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" },
  { name: "Dr. James Wilson", spec: "Neurologist", img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" },
  { name: "Dr. Emily Chen", spec: "Pediatrician", img: "https://images.unsplash.com/photo-1594824436998-dd40e4fc3456?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" },
];

const TESTIMONIALS = [
  { text: "The care I received at Preclinic was absolutely phenomenal. The doctors truly listen.", author: "Michael R.", role: "Patient" },
  { text: "State-of-the-art facilities and a very compassionate staff. I highly recommend them.", author: "Jessica T.", role: "Patient" },
  { text: "My surgery went smoothly and the recovery guidance was perfectly detailed.", author: "David Brooks", role: "Patient" },
];

const HomePage = () => {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-nav interactive-nav">
        <div className="landing-nav-inner">
          <Link to={all_routes.home} className="landing-logo">
            <ImageWithBasePath src="assets/img/logo.svg" alt="Preclinic" />
          </Link>
          <ul className="landing-nav-links d-none d-md-flex">
            <li><a href="#hero">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#doctors">Doctors</a></li>
            <li><a href="#banners">Offers</a></li>
            <li><a href="#footer">Contact</a></li>
          </ul>
          <div className="landing-nav-actions d-none d-sm-flex">
            <Link to={all_routes.login} className="btn-landing-outline btn-anim">Login</Link>
            <Link to={all_routes.registerbasic} className="btn-landing-primary btn-anim">Start Free Trial</Link>
          </div>
        </div>
      </header>

      <section id="hero" className="landing-hero interactive-hero">
        <div className="hero-content">
          <div className="hero-badge animate-badge">
            <i className="ti ti-activity" /> The Best Medical Care in Town
          </div>
          <h1 className="hero-title animate-title">
            Compassionate Care,<br /> <span>Advanced Medicine</span>
          </h1>
          <p className="hero-desc animate-desc">
            Experience world-class healthcare tailored to your needs. Connect with our experts online or visit us for premium services.
          </p>
          <div className="hero-cta animate-cta">
            <Link to={all_routes.registerbasic} className="btn-landing-primary pulse-btn">
              Consult Now
            </Link>
          </div>
        </div>
        <div className="hero-visual animate-visual">
          <div className="glass-card stat-card1">
            <h4>150+</h4><p>Specialist Doctors</p>
          </div>
          <div className="glass-card stat-card2">
            <h4>24/7</h4><p>Emergency Services</p>
          </div>
          <div className="glass-card stat-card3">
            <h4>1M+</h4><p>Happy Patients</p>
          </div>
        </div>
      </section>

      <section className="landing-section why-choose-us mt-4">
        <div className="row text-center px-3 px-lg-0">
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="feature-icon"><i className="ti ti-stethoscope" /></div>
            <h4>Expert Doctors</h4>
            <p className="text-muted">Highly qualified professionals from around the globe.</p>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="feature-icon"><i className="ti ti-microscope" /></div>
            <h4>Modern Tech</h4>
            <p className="text-muted">Equipped with the latest medical technology and labs.</p>
          </div>
          <div className="col-md-4">
            <div className="feature-icon"><i className="ti ti-ambulance" /></div>
            <h4>Fast Emergency</h4>
            <p className="text-muted">Immediate response teams available 24/7 for you.</p>
          </div>
        </div>
      </section>

      <section id="banners" className="landing-section mt-5 px-3 px-lg-0">
        <div className="service-banner-container glass-banner">
          {BANNERS.map((banner, index) => (
            <div
              key={index}
              className={`service-banner ${banner.bgClass} ${index === activeBanner ? 'active' : ''}`}
              style={{ backgroundImage: `url('${banner.bgImage}')` }}
            >
              <div className="banner-overlay"></div>
              <div className="banner-content text-center text-md-start">
                <h2 className="banner-title">{banner.title}</h2>
                <p className="banner-subtitle">{banner.subtitle}</p>
                <button className="btn-landing-light mt-3 glowing-btn">Claim Offer</button>
              </div>
            </div>
          ))}
          <div className="banner-indicators">
            {BANNERS.map((_, idx) => (
              <span
                key={idx}
                className={`indicator ${idx === activeBanner ? 'active' : ''}`}
                onClick={() => setActiveBanner(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="landing-section services-section mt-5">
        <div className="text-center mb-5">
          <p className="section-label">Our Departments</p>
          <h2 className="section-title">Specialized Healthcare Services</h2>
        </div>
        <div className="row g-4 px-3 px-xl-0">
          {SERVICES.map((srv) => (
            <div key={srv.id} className="col-md-6 col-lg-4">
              <div className="service-card interactive-card">
                <div className="service-icon"><i className={srv.icon} /></div>
                <h5>{srv.name}</h5>
                <p>{srv.desc}</p>
                <Link to={all_routes.login} className="service-link">View Details <i className="ti ti-arrow-right" /></Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="doctors" className="landing-section doctors-section bg-light-gradient py-5">
        <div className="text-center mb-5">
          <p className="section-label">Top Specialists</p>
          <h2 className="section-title">Meet Our Doctors</h2>
        </div>
        <div className="row g-4 container mx-auto">
          {DOCTORS.map((doc, idx) => (
            <div key={idx} className="col-md-4">
              <div className="doctor-card text-center">
                <div className="doc-img-wrapper">
                  <img src={doc.img} alt={doc.name} className="img-fluid" />
                </div>
                <h5 className="mt-4">{doc.name}</h5>
                <p className="text-primary fw-bold">{doc.spec}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section testimonials-section py-5">
        <div className="text-center mb-5">
          <h2 className="section-title">What Our Patients Say</h2>
        </div>
        <div className="row g-4 container mx-auto">
          {TESTIMONIALS.map((test, idx) => (
            <div key={idx} className="col-md-4">
              <div className="testimonial-card">
                <div className="stars mb-3">
                  <i className="ti ti-star-filled text-warning"></i>
                  <i className="ti ti-star-filled text-warning"></i>
                  <i className="ti ti-star-filled text-warning"></i>
                  <i className="ti ti-star-filled text-warning"></i>
                  <i className="ti ti-star-filled text-warning"></i>
                </div>
                <p className="test-text">"{test.text}"</p>
                <div className="test-author mt-4">
                  <h6 className="mb-0">{test.author}</h6>
                  <small className="text-muted">{test.role}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer id="footer" className="landing-footer">
        <div className="container py-5">
          <div className="row g-4 px-3 px-lg-0">
            <div className="col-lg-4 col-md-6 mb-4 mb-lg-0 text-start">
              <ImageWithBasePath src="assets/img/logo.svg" alt="Preclinic" style={{ height: '40px', marginBottom: '1.5rem', filter: 'brightness(0) invert(1)' }} />
              <p className="text-muted mb-4">
                Experience world-class healthcare with top specialists and advanced medical technology tailored for your health. Your well-being is our primary focus.
              </p>
              <div className="social-links d-flex gap-3">
                <a href="#"><i className="ti ti-brand-facebook"></i></a>
                <a href="#"><i className="ti ti-brand-twitter"></i></a>
                <a href="#"><i className="ti ti-brand-instagram"></i></a>
                <a href="#"><i className="ti ti-brand-linkedin"></i></a>
              </div>
            </div>

            <div className="col-lg-2 col-md-6 text-start">
              <h5 className="footer-heading">Services</h5>
              <ul className="footer-links">
                <li><a href="#">Cardiology</a></li>
                <li><a href="#">Neurology</a></li>
                <li><a href="#">Orthopedics</a></li>
                <li><a href="#">Dental Care</a></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6 text-start">
              <h5 className="footer-heading">Quick Links</h5>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Doctors</a></li>
                <li><a href="#">Appointments</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div className="col-lg-4 col-md-6 text-start">
              <h5 className="footer-heading">Contact Us</h5>
              <ul className="footer-contact">
                <li><i className="ti ti-map-pin text-primary me-2"></i> 123 Health Avenue, Medical District, NY 10001</li>
                <li><i className="ti ti-phone text-primary me-2"></i> +1 (555) 123-4567</li>
                <li><i className="ti ti-mail text-primary me-2"></i> support@preclinic.com</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom text-center pt-4 pb-3">
          <p className="mb-0 text-muted">
            © {new Date().getFullYear()} Preclinic Medical Care. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
