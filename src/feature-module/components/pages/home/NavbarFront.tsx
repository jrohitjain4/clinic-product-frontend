import { useState } from 'react';
import { Link, NavLink } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import { DemoBookingModal } from './DemoBookingModal';

const NavbarFront = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            <DemoBookingModal />
            <nav className="dy-nav">
            <div className="dy-nav-inner">
                <Link to={all_routes.home} className="dy-brand align-items-center d-flex" style={{ height: '70px', display: 'flex', alignItems: 'center', overflow: 'visible' }}>
                    <img src="/logo.png" alt="DocYori" style={{ height: "65px", width: "auto", objectFit: "contain", maxWidth: "none" }} />
                </Link>

                {/* Hamburger Icon */}
                <div className={`dy-nav-toggle ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
                    <i className={isOpen ? "ti ti-x" : "ti ti-menu-2"} />
                </div>

                <ul className={`dy-nav-links ${isOpen ? 'show' : ''}`}>
                    <li><NavLink to={all_routes.home} end onClick={() => setIsOpen(false)}>Home</NavLink></li>
                    {/* <li><a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a></li> */}
                    <li><NavLink to={all_routes.aboutUs} onClick={() => setIsOpen(false)}>About Us</NavLink></li>
                    <li><NavLink to={all_routes.servicesFront} onClick={() => setIsOpen(false)}>Services</NavLink></li>
                    <li><NavLink to={all_routes.contactUs} onClick={() => setIsOpen(false)}>Contact Us</NavLink></li>

                    {/* Mobile Only Actions */}
                    <div className="dy-nav-mobile-btns mt-3 gap-2 d-flex flex-column px-3 d-lg-none">
                        <Link to={all_routes.login} className="btn btn-outline-primary w-100 fw-semibold py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', minHeight: '44px' }}>Login</Link>
                        <Link to={all_routes.registerbasic} className="btn btn-primary w-100 fw-semibold py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', minHeight: '44px' }}>Start Free Trial</Link>
                    </div>
                </ul>

                <div className="dy-nav-actions d-none d-lg-flex align-items-center gap-3">
                    <Link to={all_routes.login} className="btn btn-outline-primary bg-white fw-semibold px-4 py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', minHeight: '44px' }}>Login</Link>
                    <Link to={all_routes.registerbasic} className="btn btn-primary fw-semibold px-4 py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', minHeight: '44px' }}>Start Free Trial</Link>
                    <Link to="#demo" className="btn btn-outline-info bg-white fw-semibold px-4 py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', border: '1px solid #0ea5e9', color: '#0ea5e9', minHeight: '44px' }}>Book Demo</Link>
                </div>
            </div>
            </nav>
        </>
    );
};

export default NavbarFront;
