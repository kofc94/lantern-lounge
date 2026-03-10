import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

/**
 * About Page - Company story and perks
 * Converted from about.html
 */
const About = () => {
  const perks = [
    {
      icon: '🍺',
      title: 'Full Bar Experience',
      description: 'Full bar with a wide variety of drinks: beer, wine, liquors and cocktails made to order'
    },
    {
      icon: '🎱',
      title: 'Pool Table',
      description: 'Pool table for friendly games and competitions with fellow members'
    },
    {
      icon: '🃏',
      title: 'New! Cribbage Nights',
      description: 'Join our popular cribbage nights and tournaments'
    },
    {
      icon: '🌿',
      title: 'Outdoor Patio',
      description: 'Enjoy our newly opened outdoor patio seating for friendship and drinks'
    },
    {
      icon: '🎨',
      title: 'Regular Events',
      description: 'We host regular events, including painting nights, whisky tastings, musical bingo, and more!'
    },
    {
      icon: '🎉',
      title: 'Private Event Rentals',
      description: 'The Lounge is also available for private event rentals—perfect for birthdays, celebrations, or special occasions'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-dark-light">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
            About The Lantern Lounge
          </h1>
          <p className="text-2xl text-primary font-semibold">
            Lexington's Best-Kept Secret
          </p>
        </div>
      </section>

      {/* About Content Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  Looking for a laid-back spot to unwind with friends in Lexington?
                  The Lantern Lounge is the place to be!
                </p>

                <p>
                  For just $20 a year, become a member and enjoy access to Lexington's
                  coziest bar. Our club offers a fantastic selection of beers and liquor,
                  ensuring there's something for every taste.
                </p>

                <p>
                  The Lantern Lounge is perfect for those looking to enjoy good company,
                  great drinks, and all-around good vibes. Don't miss out on Lexington's
                  best-kept secret!
                </p>

                <h3 className="text-2xl font-display font-bold text-white mt-8 mb-4">
                  What Makes Us Special
                </h3>
                <p>
                  We're more than just a bar – we're a community. Our members come together
                  to enjoy not just great drinks, but meaningful connections and shared experiences.
                  Whether you're looking to unwind after a long day, meet new friends, or participate
                  in fun activities, The Lantern Lounge provides the perfect atmosphere.
                </p>
              </div>
            </div>

            {/* Image */}
            <div>
              <img
                src="/assets/main-bar.png"
                alt="Lantern Lounge Interior"
                className="w-full rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Perks Section */}
      <section className="py-20 px-4 bg-dark-light">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white text-center mb-12">
            Perks of Membership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {perks.map((perk, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 bg-dark p-6 rounded-lg hover:bg-dark-card transition-all"
              >
                {/* Icon */}
                <div className="text-5xl flex-shrink-0">
                  {perk.icon}
                </div>
                {/* Content */}
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">
                    {perk.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Join?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Become a member today - Simply walk in and apply for membership on the spot!
          </p>
          <Link to="/join-us">
            <Button variant="cta">
              Learn More About Membership
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
