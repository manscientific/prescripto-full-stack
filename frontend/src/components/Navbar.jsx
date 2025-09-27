import * as React from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {
  const navigate = useNavigate()

  const [showMenu, setShowMenu] = React.useState(false)
  const { token, setToken, userData } = React.useContext(AppContext) || {}

  const logout = () => {
    try {
      localStorage.removeItem('token')
      if (typeof setToken === 'function') setToken(false)
    } catch (e) { /* ignore storage errors */ }
    navigate('/login')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <img
        onClick={() => navigate('/')}
        className='w-44 cursor-pointer'
        src={assets?.logo || '/placeholder-logo.png'}
        alt='logo'
      />

      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/'><li className='py-1'>HOME</li></NavLink>
        <NavLink to='/doctors'><li className='py-1'>ALL DOCTORS</li></NavLink>
        <NavLink to='/about'><li className='py-1'>ABOUT</li></NavLink>
        <NavLink to='/contact'><li className='py-1'>CONTACT</li></NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {token && userData ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-8 rounded-full' src={userData?.image || '/placeholder-doctor.jpg'} alt='profile' />
            <img className='w-2.5' src={assets?.dropdown_icon || '/dropdown.png'} alt='dropdown' />
            <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
              <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4'>
                <button onClick={() => navigate('/my-profile')} className='text-left hover:text-black'>My Profile</button>
                <button onClick={() => navigate('/my-appointments')} className='text-left hover:text-black'>My Appointments</button>
                <button onClick={logout} className='text-left hover:text-black'>Logout</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'
            type='button'
          >
            Create account
          </button>
        )}

        <img
          onClick={() => setShowMenu(true)}
          className='w-6 md:hidden cursor-pointer'
          src={assets?.menu_icon || '/menu.png'}
          alt='menu'
        />

        {/* Mobile Menu */}
        <div
          className={`md:hidden ${showMenu ? 'fixed inset-0 z-20' : 'h-0 w-0'} right-0 top-0 bottom-0 overflow-hidden`}
          aria-hidden={!showMenu}
        >
          <div className={`bg-white w-full h-full p-4 transition-transform ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className='flex items-center justify-between px-5 py-6'>
              <img src={assets?.logo || '/placeholder-logo.png'} className='w-36' alt='logo' />
              <img onClick={() => setShowMenu(false)} src={assets?.cross_icon || '/close.png'} className='w-7 cursor-pointer' alt='close' />
            </div>

            <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
              <li onClick={() => { setShowMenu(false); navigate('/') }} className='px-4 py-2 rounded-full inline-block'>HOME</li>
              <li onClick={() => { setShowMenu(false); navigate('/doctors') }} className='px-4 py-2 rounded-full inline-block'>ALL DOCTORS</li>
              <li onClick={() => { setShowMenu(false); navigate('/about') }} className='px-4 py-2 rounded-full inline-block'>ABOUT</li>
              <li onClick={() => { setShowMenu(false); navigate('/contact') }} className='px-4 py-2 rounded-full inline-block'>CONTACT</li>

              {token ? (
                <>
                  <li onClick={() => { setShowMenu(false); navigate('/my-profile') }} className='px-4 py-2 rounded-full inline-block'>My Profile</li>
                  <li onClick={() => { setShowMenu(false); logout() }} className='px-4 py-2 rounded-full inline-block'>Logout</li>
                </>
              ) : (
                <li onClick={() => { setShowMenu(false); navigate('/login') }} className='px-4 py-2 rounded-full inline-block'>Create account</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar
