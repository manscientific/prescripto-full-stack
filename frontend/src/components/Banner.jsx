import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='flex bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10'>
      <div className='flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-8'>
        <div className='font-poppins'>
          <p className='text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4'>
            Book Appointment
          </p>
          <p className='text-lg sm:text-xl md:text-2xl font-medium text-gray-200 mt-4 leading-snug'>
            With 100+ Trusted Doctors
          </p>
        </div>
        <button
          onClick={handleCreateAccount}
          className='bg-white text-base font-medium text-indigo-600
                   px-8 py-3.5 rounded-full mt-8 hover:bg-gray-50
                   hover:scale-105 transform transition-all duration-300
                   shadow-lg hover:shadow-xl'>
          Create account
        </button>
      </div>

      <div className='hidden md:block md:w-1/2 lg:w-[400px] relative'>
        <div className='absolute inset-0 bg-gradient-to-t from-indigo-500/30 to-transparent'></div>
        <img
          className='w-full absolute bottom-0 right-0 max-w-md 
                   transform hover:scale-105 transition-transform duration-500'
          src={assets.appointment_img}
          alt="Doctor appointment illustration"
        />
      </div>
    </div>
  );
}

export default Banner;