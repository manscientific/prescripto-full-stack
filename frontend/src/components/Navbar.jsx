import { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext) || {}

  const logout = () => {
    try {
      localStorage.removeItem('token')
      setToken?.(false)
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/doctors', label: 'DOCTORS' },
    { path: '/about', label: 'ABOUT' },
    { path: '/contact', label: 'CONTACT' }
  ]

  const activeStyle = "text-primary font-semibold relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-primary after:transition-all after:duration-300"
  const inactiveStyle = "text-gray-600 hover:text-primary transition-colors duration-300"

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              onClick={() => navigate('/')}
              className="h-12 w-auto cursor-pointer hover:opacity-80 transition-all duration-300"
              src={assets?.logo || '/placeholder-logo.png'}
              alt="Prescripto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* User Menu / Login Button */}
          <div className="flex items-center gap-6">
            {token && userData ? (
              <div className="group relative">
                <div className="flex items-center gap-3 cursor-pointer">
                  <img 
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all" 
                    src={userData?.image || '/placeholder-avatar.png'} 
                    alt={userData?.name || 'Profile'} 
                  />
                  <span className="text-gray-700 font-medium">{userData?.name}</span>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <button
                    onClick={() => navigate('/my-profile')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => navigate('/my-appointments')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                  >
                    My Appointments
                  </button>
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full
                         font-medium transition-all duration-300 hover:shadow-lg hover:scale-105
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-[300px] bg-white shadow-2xl transform transition-transform duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <img src={assets?.logo} className="h-8 w-auto" alt="Prescripto" />
              <button 
                onClick={() => setShowMenu(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                {navItems.map(({ path, label }) => (
                  <button
                    key={path}
                    onClick={() => { setShowMenu(false); navigate(path) }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors"
                  >
                    {label}
                  </button>
                ))}
                {token && (
                  <>
                    <button
                      onClick={() => { setShowMenu(false); navigate('/my-profile') }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); logout() }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
