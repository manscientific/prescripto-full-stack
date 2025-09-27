import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
    return (
        <div id='speciality' className='relative bg-gradient-to-b from-white to-gray-50 py-20'>
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            
            <div className='container mx-auto px-4 flex flex-col items-center'>
                <h1 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6 tracking-tight'>
                    Find by Speciality
                </h1>
                
                <p className='max-w-2xl text-center text-lg text-gray-600 mb-12 leading-relaxed'>
                    Simply browse through our extensive list of trusted doctors, 
                    schedule your appointment hassle-free.
                </p>

                <div className='flex sm:justify-center gap-8 pt-5 w-full overflow-x-auto 
                               scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4'>
                    {specialityData.map((item, index) => (
                        <Link 
                            to={`/doctors/${item.speciality}`} 
                            onClick={() => scrollTo(0, 0)} 
                            className='group flex flex-col items-center cursor-pointer flex-shrink-0'
                            key={index}
                        >
                            <div className='relative mb-4 p-6 rounded-2xl bg-white shadow-lg 
                                          group-hover:shadow-xl group-hover:-translate-y-2 
                                          transition-all duration-300 ease-out'>
                                <img 
                                    className='w-16 sm:w-24 transition-transform duration-300 
                                             group-hover:scale-110' 
                                    src={item.image} 
                                    alt={item.speciality}
                                />
                                <div className='absolute inset-0 bg-primary/5 opacity-0 
                                              group-hover:opacity-100 rounded-2xl 
                                              transition-opacity duration-300'>
                                </div>
                            </div>
                            <p className='text-sm sm:text-base font-medium text-gray-700 
                                        group-hover:text-primary transition-colors duration-300'>
                                {item.speciality}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SpecialityMenu