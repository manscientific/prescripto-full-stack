import React, { useContext, useMemo } from 'react'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/600.css'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

function RelatedDoctors({ speciality, docId }) {
  const navigate = useNavigate()
  const { doctors = [] } = useContext(AppContext) ?? {}

  const relDoc = useMemo(() => {
    if (!Array.isArray(doctors) || !speciality) {
      return []
    }

    const targetSpeciality = String(speciality).trim().toLowerCase()

    return doctors
      .filter((doc) => doc && doc._id !== docId)
      .filter((doc) => String(doc?.speciality || '').toLowerCase() === targetSpeciality)
      .sort((a, b) => {
        const availabilityA = a?.available ? 1 : 0
        const availabilityB = b?.available ? 1 : 0
        if (availabilityA !== availabilityB) return availabilityB - availabilityA
        return (b?.rating || 0) - (a?.rating || 0)
      })
      .slice(0, 6)
  }, [doctors, speciality, docId])

  const placeholderImage = '/placeholder-doctor.jpg'

  if (!relDoc || relDoc.length === 0) {
    return (
      <section className='font-poppins py-12 px-4 md:px-8 lg:px-16 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 rounded-2xl shadow-sm'>
        <div className='max-w-7xl mx-auto text-center'>
          <h2 className='text-3xl md:text-4xl font-semibold text-slate-800 mb-3'>Related Doctors</h2>
          <p className='mx-auto text-sm md:text-base text-slate-600 max-w-2xl mb-8'>No related doctors found for this speciality.</p>
        </div>
      </section>
    )
  }

  return (
    <section className='font-poppins py-12 px-4 md:px-8 lg:px-16 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 rounded-2xl shadow-sm'>
      <div className='max-w-7xl mx-auto text-center'>
        <h2 className='text-3xl md:text-4xl font-semibold text-slate-800 mb-3'>Related Doctors</h2>
        <p className='mx-auto text-sm md:text-base text-slate-600 max-w-2xl mb-8'>Browse other trusted doctors in the same speciality.</p>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {relDoc.map((item, idx) => {
            const id = item?._id ?? idx
            return (
              <article
                key={id}
                onClick={() => {
                  if (item?._id) {
                    navigate(`/appointment/${item._id}`)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className='bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer transform hover:-translate-y-2 hover:shadow-lg transition-all duration-300'
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && item?._id) {
                    navigate(`/appointment/${item._id}`)
                  }
                }}
              >
                <div className='relative h-56 md:h-48'>
                  <img
                    src={item?.image || placeholderImage}
                    alt={item?.name || 'Doctor'}
                    onError={(e) => { e.currentTarget.src = placeholderImage }}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute top-3 right-3'>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${item?.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${item?.available ? 'bg-emerald-600' : 'bg-gray-500'}`} />
                      {item?.available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>

                <div className='p-5'>
                  <h3 className='text-lg md:text-xl font-semibold text-slate-800 mb-1'>{item?.name ?? 'Unknown'}</h3>
                  <p className='text-sm text-sky-600 font-medium mb-2'>{item?.speciality ?? 'General'}</p>
                  <p className='text-sm text-slate-600'>{item?.about ?? 'Experienced professional providing quality care.'}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default RelatedDoctors