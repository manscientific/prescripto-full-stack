import axios from 'axios';
import { useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const Verify = () => {
  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const success = searchParams.get('success')
  const appointmentId = searchParams.get('appointmentId')

  const { backendUrl, token } = useContext(AppContext)

  const navigate = useNavigate()

  // replace: standalone verifyStripe + useEffect
  useEffect(() => {
    if (!(token && appointmentId && success)) return

    const runVerify = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/verifyStripe`,
          { success, appointmentId },
          { headers: { token } }
        )

        if (data?.success) {
          toast.success(data.message || 'Verification successful')
        } else {
          toast.error(data?.message || 'Verification failed')
        }
      } catch (err) {
        console.error(err)
        const msg = err?.response?.data?.message || err?.message || 'Verification error'
        toast.error(msg)
      } finally {
        navigate('/my-appointments')
      }
    }

    runVerify()
  }, [backendUrl, token, appointmentId, success, navigate])

  return (
    <div className='min-h-[60vh] flex items-center justify-center'>
      <div className="w-20 h-20 border-4 border-gray-300 border-t-4 border-t-primary rounded-full animate-spin"></div>
    </div>
  )
}

export default Verify