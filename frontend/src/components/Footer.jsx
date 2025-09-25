import * as React from 'react';
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className='bg-gray-50 px-4 md:px-10 pt-20 pb-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col sm:grid grid-cols-[2.5fr_1fr_1fr] gap-10 md:gap-20 mb-16'>
          
          <div className='footer-section'>
            <img className='mb-6 w-44 hover:opacity-90 transition-opacity' src={assets.logo} alt="Prescripto Logo" />
            <p className='w-full md:w-4/5 text-gray-600 leading-relaxed'>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
            </p>
          </div>

          <div className='footer-section'>
            <h3 className='text-lg font-semibold mb-6 text-gray-800'>COMPANY</h3>
            <ul className='space-y-3'>
              <li><Link to="/" className='text-gray-600 hover:text-primary transition-colors'>Home</Link></li>
              <li><Link to="/about" className='text-gray-600 hover:text-primary transition-colors'>About us</Link></li>
              <li><Link to="/delivery" className='text-gray-600 hover:text-primary transition-colors'>Delivery</Link></li>
              <li><Link to="/privacy" className='text-gray-600 hover:text-primary transition-colors'>Privacy policy</Link></li>
            </ul>
          </div>

          <div className='footer-section'>
            <h3 className='text-lg font-semibold mb-6 text-gray-800'>GET IN TOUCH</h3>
            <ul className='space-y-3'>
              <li className='flex items-center gap-2 text-gray-600'>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                +1-212-456-7890
              </li>
              <li className='flex items-center gap-2 text-gray-600'>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                greatstackdev@gmail.com
              </li>
            </ul>
          </div>

        </div>

        <div className='border-t border-gray-200'>
          <p className='py-6 text-sm text-center text-gray-600'>
            Copyright © {new Date().getFullYear()} Prescripto.com - All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
