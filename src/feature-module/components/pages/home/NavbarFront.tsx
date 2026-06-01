import { useState } from 'react';
import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";

const NavbarFront = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="dy-nav">
            <div className="dy-nav-inner">
                <Link to={all_routes.home} className="dy-brand">
                    <img src="/logo-main.png" alt="DocYori" />
                </Link>

                {/* Hamburger Icon */}
                <div className={`dy-nav-toggle ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
                    <i className={isOpen ? "ti ti-x" : "ti ti-menu-2"} />
                </div>

                <ul className={`dy-nav-links ${isOpen ? 'show' : ''}`}>
                    <li><Link to={all_routes.home} onClick={() => setIsOpen(false)}>Home</Link></li>
                    <li><Link to={`${all_routes.home}#features`} onClick={() => setIsOpen(false)}>Features</Link></li>
                    <li><Link to={`${all_routes.home}#modules`} onClick={() => setIsOpen(false)}>Modules</Link></li>
                    <li><a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a></li>
                    <li><Link to={all_routes.aboutUs} onClick={() => setIsOpen(false)}>About Us</Link></li>
                    <li><Link to={all_routes.servicesFront} onClick={() => setIsOpen(false)}>Services</Link></li>
                    <li><Link to={all_routes.privacyPolicyFront} onClick={() => setIsOpen(false)}>FAQ</Link></li>
                    <li><Link to={all_routes.contactUs} onClick={() => setIsOpen(false)}>Contact Us</Link></li>

                    {/* Mobile Only Actions */}
                    <div className="dy-nav-mobile-btns">
                        <Link to={all_routes.login} className="nav-login">Login</Link>
                        <Link to={all_routes.registerbasic} className="nav-trial">Start Free Trial</Link>
                    </div>
                </ul>

                <div className="dy-nav-actions">
                    <Link to={all_routes.login} className="nav-login">Login</Link>
                    <Link to={all_routes.registerbasic} className="nav-trial">Start Free Trial</Link>
                    <Link to="#demo" className="nav-demo">Book Demo</Link>
                </div>
            </div>
        </nav>
    );
};

export default NavbarFront;
