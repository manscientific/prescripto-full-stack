import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const RelatedDoctors = ({ speciality, docId }) => {
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)
    const [relDoc, setRelDoc] = useState([])

    useEffect(() => {
        if (doctors.length > 0 && speciality) {
            const doctorsData = doctors.filter((doc) => doc.speciality === speciality && doc._id !== docId)
            setRelDoc(doctorsData)
        }
    }, [doctors, speciality, docId])

    return (
        <div className='flex flex-col items-center gap-6 my-20 bg-gradient-to-b from-gray-50 to-white py-12 rounded-2xl'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-800 font-poppins'>
                Related Doctors
            </h1>
            <p className='sm:w-1/3 text-center text-base md:text-lg text-gray-600 font-light'>
                Simply browse through our extensive list of trusted doctors.
            </p>
            
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-8 px-4 sm:px-6'>
                {relDoc.map((item, index) => (
                    <div 
                        onClick={() => { 
                            navigate(`/appointment/${item._id}`); 
                            window.scrollTo({ top: 0, behavior: 'smooth' }) 
                        }} 
                        className='bg-white border border-blue-100 rounded-2xl overflow-hidden cursor-pointer 
                            hover:translate-y-[-10px] hover:shadow-xl transition-all duration-500' 
                        key={index}
                    >
                        <div className='relative'>
                            <img 
                                className='w-full h-64 object-cover bg-blue-50' 
                                src={item.image} 
                                alt={item.name} 
                            />
                            <div className='absolute top-4 right-4'>
                                <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full 
                                    ${item.available ? 'bg-green-100 text-green-600' : "bg-gray-100 text-gray-600"}`}>
                                    <span className={`w-2 h-2 rounded-full 
                                        ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></span>
                                    <span className='font-medium'>
                                        {item.available ? 'Available' : "Not Available"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className='p-6'>
                            <h3 className='text-xl font-semibold text-gray-800 mb-2 font-poppins'>
                                {item.name}
                            </h3>
                            <p className='text-blue-600 text-base font-medium'>
                                {item.speciality}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Uncomment and modify if needed */}
            {/* <button className='bg-blue-600 text-white font-medium text-lg px-12 py-4 rounded-full mt-12
                hover:bg-blue-700 transition-colors duration-300 shadow-lg hover:shadow-xl'>
                View More
            </button> */}
        </div>
    )
}

export default RelatedDoctors