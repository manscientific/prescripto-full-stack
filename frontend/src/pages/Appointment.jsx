import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { doctors = [], currencySymbol = '₹', backendUrl = '', token = '', getDoctosData = () => {} } = useContext(AppContext)

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([]) // array of arrays: each day's slots
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')

  const fetchDocInfo = async () => {
    try {
      const found = Array.isArray(doctors) ? doctors.find((doc) => String(doc._id) === String(docId)) : null
      setDocInfo(found || null)
      // reset slots/selection when doctor changes
      setDocSlots([])
      setSlotIndex(0)
      setSlotTime('')
    } catch (err) {
      console.error('fetchDocInfo error', err)
      setDocInfo(null)
    }
  }

  const getAvailableSolts = async () => {
    if (!docInfo) return
    const bookedMap = docInfo.slots_booked || {}
    const today = new Date()
    const allDaysSlots = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      const endTime = new Date(currentDate)
      endTime.setHours(21, 0, 0, 0)

      // set start time
      if (i === 0) {
        // today: start from next available half-hour block at or after 10:00
        const now = new Date()
        currentDate.setHours(Math.max(10, now.getHours()), now.getMinutes(), 0, 0)
        // round minutes to nearest 30
        const mins = currentDate.getMinutes()
        currentDate.setMinutes(mins > 30 ? 30 : (mins > 0 ? 30 : 0))
        if (currentDate.getHours() < 10) currentDate.setHours(10, 0, 0, 0)
      } else {
        currentDate.setHours(10, 0, 0, 0)
      }

      const timeSlots = []
      const loopDate = new Date(currentDate)

      while (loopDate < endTime) {
        const formattedTime = loopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const day = loopDate.getDate()
        const month = loopDate.getMonth() + 1
        const year = loopDate.getFullYear()
        const slotDate = `${day}_${month}_${year}`
        const isBooked = Array.isArray(bookedMap[slotDate]) && bookedMap[slotDate].includes(formattedTime)
        if (!isBooked) {
          timeSlots.push({
            datetime: new Date(loopDate),
            time: formattedTime
          })
        }
        loopDate.setMinutes(loopDate.getMinutes() + 30)
      }

      allDaysSlots.push(timeSlots)
    }

    setDocSlots(allDaysSlots)
    // reset selection if no slots for first day
    setSlotIndex(0)
    setSlotTime(allDaysSlots?.[0]?.[0]?.time ?? '')
  }

  const bookAppointment = async () => {
    if (!token) {
      toast.warning('Login to book appointment')
      return navigate('/login')
    }

    if (!docSlots || !docSlots[slotIndex] || docSlots[slotIndex].length === 0) {
      toast.error('Please select a valid date and time slot')
      return
    }
    if (!slotTime) {
      toast.error('Please choose a time slot')
      return
    }

    const dateObj = docSlots?.[slotIndex]?.[0]?.datetime
    if (!dateObj) {
      toast.error('Invalid date selected')
      return
    }
    const slotDate = `${dateObj.getDate()}_${dateObj.getMonth() + 1}_${dateObj.getFullYear()}`

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        { docId, slotDate, slotTime },
        { headers: { token } }
      )

      if (data?.success) {
        toast.success(data.message || 'Appointment booked')
        if (typeof getDoctosData === 'function') getDoctosData()
        navigate('/counter', { state: { doctor: docInfo } })
      } else {
        toast.error(data?.message || 'Booking failed')
      }
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Booking error')
    }
  }

  useEffect(() => {
    if (Array.isArray(doctors) && docId) fetchDocInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, docId])

  useEffect(() => {
    if (docInfo) getAvailableSolts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docInfo])

  if (!docInfo) return null

  return (
    <div>
      {/* Doctor Details */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image || assets.header_img || '/placeholder-doctor.jpg'} alt={docInfo.name || 'Doctor'} />
        </div>

        <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt='verified' />
          </p>
          <div className='flex items-center gap-2 mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt='info' /></p>
            <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span></p>
        </div>
      </div>

      {/* Booking slots */}
      <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
        <p>Booking slots</p>

        <div className='flex gap-3 items-center w-full overflow-x-auto mt-4'>
          {docSlots && docSlots.length > 0 ? docSlots.map((item, index) => (
            <div
              onClick={() => { setSlotIndex(index); setSlotTime(item?.[0]?.time ?? '') }}
              key={index}
              className={`text-center py-6 min-w-16 px-3 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-[#DDDDDD]'}`}
            >
              <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
              <p>{item[0] && item[0].datetime.getDate()}</p>
            </div>
          )) : <p className='text-sm text-gray-500'>No slots available</p>}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-auto mt-4'>
          {docSlots && docSlots[slotIndex] && docSlots[slotIndex].length > 0 ? docSlots[slotIndex].map((item, index) => (
            <p
              onClick={() => setSlotTime(item.time)}
              key={index}
              className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}
            >
              {String(item.time).toLowerCase()}
            </p>
          )) : <p className='text-sm text-gray-500'>Select a date to view times</p>}
        </div>

        <button onClick={bookAppointment} className='bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6'>Book an appointment</button>
      </div>
    </div>
  )
}

export default Appointment
