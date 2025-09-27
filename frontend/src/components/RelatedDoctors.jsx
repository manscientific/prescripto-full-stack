import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const DoctorCard = ({ doctor, onClick }) => {
  if (!doctor) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden border hover:border-primary/20
                 hover:shadow-xl transition-all duration-300 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="relative h-52">
        <img
          src={doctor.image || assets.doctor_placeholder}
          alt={doctor.name || 'Doctor Profile'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { 
            e.target.src = assets.doctor_placeholder
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm">
            <img 
              src={doctor.available ? assets.available_icon : assets.unavailable_icon} 
              alt={doctor.available ? "Available" : "Not Available"}
              className="w-4 h-4"
            />
            <span className="text-xs font-medium text-gray-800">
              {doctor.available ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors">
          {doctor.name || 'Unknown Doctor'}
        </h3>
        <p className="text-sm font-medium text-primary/80 mt-1">
          {doctor.speciality || 'General Practice'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i}
                className={`w-4 h-4 ${i < (doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600">({doctor.rating || 0})</span>
        </div>
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {doctor.about || 'Experienced healthcare professional dedicated to patient care.'}
        </p>
      </div>
    </article>
  )
}

const RelatedDoctors = ({ speciality = '', docId = '' }) => {
  const navigate = useNavigate()
  const { doctors = [] } = useContext(AppContext) || {}

  const relatedDoctors = useMemo(() => {
    if (!Array.isArray(doctors) || !speciality || !docId) return []

    return doctors
      .filter(doc => doc && 
                     doc._id && 
                     doc._id !== docId && 
                     doc.speciality && 
                     doc.speciality.toLowerCase() === speciality.toLowerCase())
      .sort((a, b) => {
        // Sort by availability first, then by rating
        if (a.available !== b.available) {
          return a.available ? -1 : 1
        }
        return (b.rating || 0) - (a.rating || 0)
      })
      .slice(0, 6)
  }, [doctors, speciality, docId])

  if (!relatedDoctors.length) {
    return (
      <section className="bg-gradient-to-r from-gray-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Doctors</h2>
          <p className="text-gray-600">No related doctors found in this specialty.</p>
        </div>
      </section>
    )
  }

  const handleDoctorClick = (doctorId) => {
    if (doctorId) {
      navigate(`/appointment/${doctorId}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <section className="bg-gradient-to-r from-gray-50 to-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Doctors</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover more experienced healthcare professionals in {speciality}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedDoctors.map(doctor => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              onClick={() => handleDoctorClick(doctor._id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default RelatedDoctors