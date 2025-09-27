import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyAppointments = () => {
  const { backendUrl = '', token = '' } = useContext(AppContext) || {}
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [payment, setPayment] = useState('')

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Safe date formatter: expects "DD_MM_YYYY"
  const slotDateFormat = (slotDate) => {
    if (!slotDate || typeof slotDate !== 'string') return ''
    const dateArray = slotDate.split('_')
    if (dateArray.length < 3) return slotDate
    const day = dateArray[0]
    const monthIndex = Number(dateArray[1]) - 1
    const year = dateArray[2]
    const monthName = months[monthIndex] ?? dateArray[1]
    return `${day} ${monthName} ${year}`
  }

  // Getting User Appointments Data Using API
  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, { headers: { token } })
      setAppointments(Array.isArray(data.appointments) ? data.appointments.reverse() : [])
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Failed to fetch appointments')
    }
  }

  // Function to cancel appointment Using API
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      )

      if (data?.success) {
        toast.success(data.message)
        getUserAppointments()
      } else {
        toast.error(data?.message || 'Cancel failed')
      }
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Cancel error')
    }
  }

  const initPay = (order) => {
    if (!order) {
      toast.error('Invalid order for payment')
      return
    }
    if (typeof window === 'undefined' || !window.Razorpay) {
      toast.error('Payment library not loaded')
      return
    }

    const options = {
      key: import.meta?.env?.VITE_RAZORPAY_KEY_ID ?? '',
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(`${backendUrl}/api/user/verifyRazorpay`, response, { headers: { token } })
          if (data?.success) {
            navigate('/my-appointments')
            getUserAppointments()
          } else {
            toast.error(data?.message || 'Payment verification failed')
          }
        } catch (error) {
          console.error(error)
          toast.error(error?.message || 'Verification error')
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  // Function to make payment using razorpay
  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/payment-razorpay`, { appointmentId }, { headers: { token } })
      if (data?.success && data.order) {
        initPay(data.order)
      } else {
        toast.error(data?.message || 'Payment initiation failed')
      }
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Payment error')
    }
  }

  // Function to make payment using stripe
  const appointmentStripe = async (appointmentId) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/payment-stripe`, { appointmentId }, { headers: { token } })
      if (data?.success) {
        const { session_url } = data
        if (session_url) window.location.replace(session_url)
        else toast.error('Invalid payment session')
      } else {
        toast.error(data?.message || 'Stripe initiation failed')
      }
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Stripe error')
    }
  }

  useEffect(() => {
    if (token) getUserAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div>
      <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
      <div>
        {appointments.map((item, index) => (
          <div key={item?._id ?? index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
            <div>
              <img className='w-36 bg-[#EAEFFF]' src={item?.docData?.image || '/placeholder-doctor.jpg'} alt={item?.docData?.name || 'Doctor'} />
            </div>
            <div className='flex-1 text-sm text-[#5E5E5E]'>
              <p className='text-[#262626] text-base font-semibold'>{item?.docData?.name}</p>
              <p>{item?.docData?.speciality}</p>
              <p className='text-[#464646] font-medium mt-1'>Address:</p>
              <p>{item?.docData?.address?.line1}</p>
              <p>{item?.docData?.address?.line2}</p>
              <p className='mt-1'>
                <span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item?.slotDate || '')} | {item?.slotTime}
              </p>
            </div>
            <div className='flex flex-col gap-2 justify-end text-sm text-center'>
              {!item?.cancelled && !item?.payment && !item?.isCompleted && payment !== item?._id && (
                <button onClick={() => setPayment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>
              )}

              {!item?.cancelled && !item?.payment && !item?.isCompleted && payment === item?._id && (
                <div className='flex gap-2 items-center justify-center'>
                  <button onClick={() => appointmentStripe(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 transition-all duration-300 flex items-center justify-center'>
                    <img className='max-w-20 max-h-5' src={assets.stripe_logo} alt='Stripe' />
                  </button>
                  <button onClick={() => appointmentRazorpay(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 transition-all duration-300 flex items-center justify-center'>
                    <img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt='Razorpay' />
                  </button>
                </div>
              )}

              {!item?.cancelled && item?.payment && !item?.isCompleted && (
                <button className='sm:min-w-48 py-2 border rounded text-[#696969] bg-[#EAEFFF]'>Paid</button>
              )}

              {item?.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}

              {!item?.cancelled && !item?.isCompleted && (
                <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>
              )}

              {item?.cancelled && !item?.isCompleted && (
                <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments
