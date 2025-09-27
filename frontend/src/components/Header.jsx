import { assets } from '../assets/assets'

const Header = () => {
    return (
        <div className='relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 rounded-2xl shadow-xl'>
            <div className='absolute inset-0 bg-pattern opacity-10'></div>
            
            <div className='relative flex flex-col md:flex-row items-center px-6 md:px-12 lg:px-20 max-w-8xl mx-auto'>
                {/* Left Section */}
                <div className='md:w-1/2 flex flex-col items-start justify-center gap-6 py-12 md:py-20 lg:py-24'>
                    <h1 className='text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight tracking-tight'>
                        Book Appointment <br />
                        <span className='text-gray-100'>With Trusted Doctors</span>
                    </h1>
                    
                    <div className='flex flex-col md:flex-row items-center gap-4 text-white/90'>
                        <div className='relative'>
                            <img 
                                className='w-32 md:w-36 filter drop-shadow-md hover:scale-105 transition-transform duration-300' 
                                src={assets.group_profiles} 
                                alt="Doctor Profiles" 
                            />
                            <div className='absolute -bottom-2 -right-2 bg-green-500 p-1.5 rounded-full'>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <p className='text-sm md:text-base font-medium max-w-md'>
                            Simply browse through our extensive list of trusted doctors,
                            <br className='hidden sm:block' /> 
                            schedule your appointment hassle-free.
                        </p>
                    </div>

                    <a 
                        href='#speciality' 
                        className='group flex items-center gap-3 bg-white px-8 py-3.5 rounded-full
                        text-primary font-medium shadow-lg hover:shadow-xl
                        transform hover:scale-105 transition-all duration-300
                        hover:bg-gray-50 focus:ring-2 focus:ring-white/50 focus:outline-none'
                    >
                        Book appointment
                        <img 
                            className='w-4 group-hover:translate-x-1 transition-transform duration-300' 
                            src={assets.arrow_icon} 
                            alt="Arrow" 
                        />
                    </a>
                </div>

                {/* Right Section */}
                <div className='md:w-1/2 relative mt-8 md:mt-0'>
                    <div className='absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-lg'></div>
                    <img 
                        className='w-full h-auto rounded-lg transform hover:scale-[1.02] transition-transform duration-500
                        shadow-2xl' 
                        src={assets.header_img} 
                        alt="Doctor with patient" 
                    />
                </div>
            </div>
        </div>
    )
}

export default Header