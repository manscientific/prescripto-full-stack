import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {
    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSlots = async () => {
        setDocSlots([])
        let today = new Date()

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(21, 0, 0, 0)

            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
            } else {
                currentDate.setHours(10)
                currentDate.setMinutes(0)
            }

            let timeSlots = []

            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()
                const slotDate = day + "_" + month + "_" + year
                const slotTime = formattedTime
                const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

                if (isSlotAvailable) {
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    })
                }

                currentDate.setMinutes(currentDate.getMinutes() + 30)
            }

            setDocSlots(prev => ([...prev, timeSlots]))
        }
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Please login to book an appointment')
            return navigate('/login')
        }

        if (!slotTime) {
            toast.warning('Please select a time slot')
            return
        }

        setLoading(true)

        const date = docSlots[slotIndex][0].datetime
        const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`

        try {
            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', 
                { docId, slotDate, slotTime }, 
                { headers: { token } }
            )

            if (data.success) {
                toast.success('Appointment booked successfully!')
                getDoctosData()
                navigate('/counter', { state: { doctor: docInfo } })
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || 'Failed to book appointment')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (doctors.length > 0) fetchDocInfo()
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) getAvailableSlots()
    }, [docInfo])

    return docInfo ? (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            
            {/* Doctor Details Section */}
            <div className='bg-white rounded-3xl shadow-2xl overflow-hidden mb-12'>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 p-8'>
                    
                    {/* Doctor Image */}
                    <div className='lg:col-span-1 flex justify-center'>
                        <div className='relative'>
                            <img 
                                className='w-80 h-80 object-cover rounded-2xl shadow-lg border-4 border-white' 
                                src={docInfo.image} 
                                alt={docInfo.name}
                            />
                            <div className='absolute -top-2 -right-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg'>
                                ⭐ {docInfo.rating || '4.9'}
                            </div>
                        </div>
                    </div>

                    {/* Doctor Information */}
                    <div className='lg:col-span-2'>
                        <div className='flex items-center gap-4 mb-6'>
                            <h1 className='text-4xl lg:text-5xl font-black text-gray-900'>
                                Dr. {docInfo.name}
                            </h1>
                            <img className='w-8 h-8' src={assets.verified_icon} alt="Verified" />
                        </div>
                        
                        <div className='flex items-center gap-4 mb-6'>
                            <span className='bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold text-lg'>
                                {docInfo.speciality}
                            </span>
                            <span className='bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl font-semibold text-lg'>
                                {docInfo.experience} Years Experience
                            </span>
                        </div>

                        <div className='mb-6'>
                            <div className='flex items-center gap-2 mb-3'>
                                <span className='text-2xl'>📖</span>
                                <h3 className='text-2xl font-bold text-gray-900'>About Doctor</h3>
                            </div>
                            <p className='text-lg text-gray-700 leading-relaxed'>
                                {docInfo.about || 'Experienced medical professional dedicated to providing exceptional healthcare services.'}
                            </p>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='bg-blue-50 rounded-2xl p-4'>
                                <p className='text-gray-600 font-semibold text-lg'>Appointment Fee</p>
                                <p className='text-3xl font-black text-primary'>{currencySymbol}{docInfo.fees}</p>
                            </div>
                            <div className='bg-green-50 rounded-2xl p-4'>
                                <p className='text-gray-600 font-semibold text-lg'>Availability</p>
                                <p className='text-xl font-bold text-green-600'>
                                    {docInfo.available ? 'Available Today' : 'Not Available'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Section */}
            <div className='bg-white rounded-3xl shadow-2xl p-8 mb-12'>
                <h2 className='text-3xl lg:text-4xl font-black text-gray-900 mb-8 text-center'>
                    Book Your <span className='text-primary'>Appointment</span>
                </h2>

                {/* Date Selection */}
                <div className='mb-8'>
                    <h3 className='text-2xl font-bold text-gray-800 mb-6'>Select Date</h3>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4'>
                        {docSlots.length > 0 && docSlots.map((item, index) => (
                            <div 
                                onClick={() => setSlotIndex(index)} 
                                key={index}
                                className={`text-center p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 ${
                                    slotIndex === index 
                                        ? 'bg-primary text-white border-primary shadow-lg' 
                                        : 'border-gray-200 hover:border-primary/50'
                                }`}
                            >
                                <p className='text-lg font-bold'>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                                <p className='text-2xl font-black'>{item[0] && item[0].datetime.getDate()}</p>
                                <p className='text-sm opacity-80'>
                                    {item[0] && item[0].datetime.toLocaleDateString('en-US', { month: 'short' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Time Slot Selection */}
                <div className='mb-8'>
                    <h3 className='text-2xl font-bold text-gray-800 mb-6'>Select Time Slot</h3>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
                        {docSlots.length > 0 && docSlots[slotIndex].map((item, index) => (
                            <button
                                onClick={() => setSlotTime(item.time)}
                                key={index}
                                className={`p-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 border-2 ${
                                    item.time === slotTime
                                        ? 'bg-primary text-white border-primary shadow-lg'
                                        : 'border-gray-200 hover:border-primary/50'
                                }`}
                            >
                                {item.time.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Book Button */}
                <div className='text-center'>
                    <button 
                        onClick={bookAppointment}
                        disabled={loading || !slotTime}
                        className='bg-gradient-to-r from-primary to-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center gap-3'
                    >
                        {loading ? (
                            <>
                                <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                Booking...
                            </>
                        ) : (
                            <>
                                <span>📅</span>
                                Book Appointment Now
                                <span>→</span>
                            </>
                        )}
                    </button>
                    
                    {!slotTime && (
                        <p className='text-red-500 text-lg font-semibold mt-4'>
                            Please select a time slot to continue
                        </p>
                    )}
                </div>
            </div>

            {/* Related Doctors */}
            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : (
        <div className='flex justify-center items-center min-h-96'>
            <div className='text-center'>
                <div className='text-6xl mb-4'>👨‍⚕️</div>
                <h2 className='text-3xl font-bold text-gray-700'>Loading Doctor Information...</h2>
                <p className='text-lg text-gray-600 mt-2'>Please wait while we fetch the details</p>
            </div>
        </div>
    )
}

export default Appointment