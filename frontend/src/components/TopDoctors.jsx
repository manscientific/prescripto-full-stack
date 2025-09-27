import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

function TopDoctors() {
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)

    function handleDoctorClick(doctorId) {
        navigate(`/appointment/${doctorId}`)
        scrollTo(0, 0)
    }

    function handleViewAllClick() {
        navigate('/doctors')
        scrollTo(0, 0)
    }

    return (
        <div className='relative bg-gradient-to-b from-gray-50 via-white to-gray-50 py-20'>
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5"></div>
            
            <div className='container mx-auto px-4'>
                <div className='text-center mb-16'>
                    <h1 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6 tracking-tight'>
                        Top Rated Doctors
                    </h1>
                    <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed'>
                        Connect with our highly qualified and experienced medical professionals
                    </p>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
                    {doctors.slice(0, 8).map((doctor, index) => (
                        <div 
                            key={index}
                            onClick={() => handleDoctorClick(doctor._id)} 
                            className='group bg-white rounded-2xl overflow-hidden cursor-pointer
                                     shadow-md hover:shadow-xl transition-all duration-500
                                     hover:-translate-y-2 border border-gray-100'
                        >
                            <div className='relative h-64 overflow-hidden'>
                                <img 
                                    className='w-full h-full object-cover group-hover:scale-110 
                                             transition-transform duration-500' 
                                    src={doctor.image} 
                                    alt={doctor.name}
                                    onError={(e) => { e.target.src = '/placeholder-doctor.jpg' }}
                                />
                                <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent'></div>
                            </div>
                            
                            <div className='p-6'>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full
                                              text-sm font-medium mb-4 
                                              ${doctor.available 
                                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                    <span className={`w-2 h-2 rounded-full 
                                                  ${doctor.available ? 'bg-green-500' : 'bg-gray-500'}`}>
                                    </span>
                                    {doctor.available ? 'Available' : 'Not Available'}
                                </div>
                                
                                <h3 className='text-xl font-semibold text-gray-800 mb-2 
                                             group-hover:text-primary transition-colors'>
                                    {doctor.name}
                                </h3>
                                <p className='text-primary/80 font-medium'>
                                    {doctor.speciality}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='text-center mt-16'>
                    <button 
                        onClick={handleViewAllClick} 
                        className='bg-primary text-white px-8 py-4 rounded-full
                                 text-lg font-medium hover:bg-primary/90
                                 transform transition-all duration-300
                                 hover:scale-105 hover:shadow-lg
                                 focus:outline-none focus:ring-2 focus:ring-primary/50'
                    >
                        View All Doctors
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TopDoctors