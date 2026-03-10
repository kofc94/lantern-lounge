import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * Home Page - Landing page with hero, features, and membership info
 * Converted from index.html
 */
const Home = () => {
  const features = [
    {
      image: '/assets/table.png',
      alt: 'Full Bar',
      title: 'Full Bar',
      description: 'Wide variety of drinks: beer, wine, liquors and cocktails made to order'
    },
    {
      image: '/assets/pool-table.png',
      alt: 'Pool Table',
      title: 'Pool Table',
      description: 'Enjoy friendly games with fellow members'
    },
    {
      image: '/assets/interior.png',
      alt: 'Events',
      title: 'Regular Events',
      description: 'Painting nights, whisky tastings, musical bingo, cribbage nights, and more!'
    },
    {
      image: '/assets/patio.png',
      alt: 'Outdoor Patio',
      title: 'Outdoor Patio',
      description: 'Newly opened outdoor seating for friendship and drinks'
    }
  ];

  const benefits = [
    'Full access to our complete bar selection',
    'Pool table access',
    'Participation in all member events',
    'Access to outdoor patio',
    'Private event rental opportunities'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold text-white leading-tight mb-4">
              Welcome to The Lantern Lounge
            </h1>
            <p className="text-2xl text-primary font-semibold mb-4">
              Lexington's Coziest Bar & Social Club
            </p>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Looking for a laid-back spot to unwind with friends in Lexington? The Lantern Lounge is the place to be!
            </p>
            <Link to="/join-us">
              <Button variant="cta">
                Become a Member Today
              </Button>
            </Link>
          </div>

          {/* Hero Image */}
          <div>
            <img
              src="/assets/entrance.png"
              alt="Lantern Lounge Interior"
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-light">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white text-center mb-12">
            Why Join The Lantern Lounge?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} variant="feature" hover>
                <img
                  src={feature.image}
                  alt={feature.alt}
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                <h3 className="text-2xl font-display font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Info Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Membership - Just $20/Year
          </h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            For just $20 a year, become a member and enjoy access to Lexington's coziest bar.
            Our club offers a fantastic selection of beers and liquor, ensuring there's something for every taste.
          </p>

          {/* Benefits List */}
          <div className="bg-dark-light rounded-lg p-8 mb-8 inline-block">
            <ul className="text-left space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="text-primary mr-3 text-xl">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Link to="/join-us">
              <Button variant="cta">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
