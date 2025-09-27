// Add this if JSX transform is not configured
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 md:px-10 pt-20 pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-10 md:gap-20 mb-16">
          
          <div className="space-y-6">
            <img 
              className="w-44 hover:opacity-90 transition-all duration-300" 
              src={assets.logo} 
              alt="Prescripto Logo" 
            />
            <p className="text-gray-600 leading-relaxed max-w-xl">
              Your trusted healthcare companion. Schedule appointments with top doctors, 
              manage your medical records, and take control of your health journey.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary transition-colors duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-primary transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-600 hover:text-primary transition-colors duration-300">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" clipRule="evenodd" />
                </svg>
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>contact@prescripto.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-200">
          <p className="py-6 text-sm text-center text-gray-600">
            © {new Date().getFullYear()} Prescripto. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
