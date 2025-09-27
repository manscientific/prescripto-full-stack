import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <Header />
        </div>
        
        <div className="py-12 bg-white rounded-xl shadow-sm">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Specialities
          </h2>
          <SpecialityMenu />
        </div>

        <div className="py-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Top Rated Doctors
          </h2>
          <TopDoctors />
        </div>

        <div className="py-12">
          <Banner />
        </div>
      </div>
    </div>
  )
}

export default Home