import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { NavLink } from "react-router-dom";
import "./styles/navBarStyles.css";

const NavBar = () => {
    return (
        <Navbar expand="lg" className="bg-body-tertiary navBar">
            <Container className='navBar-container'>
                <Navbar.Brand as={NavLink} to="/">
                    <div className='logo-area'>
                        <img src='./logo-no-background.png' alt='decipher-logo'></img>
                    </div>
                </Navbar.Brand>
                <Navbar.Toggle className='navbar-dark' aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} className='nav-link-home' to="/">Home</Nav.Link>
                        <Nav.Link as={NavLink} className='nav-link-library' to="/library">Library</Nav.Link>
                        <Nav.Link as={NavLink} className='nav-link-upload' to="/upload">Upload</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavBar;