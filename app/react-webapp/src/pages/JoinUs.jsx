import { useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

/**
 * Join Us Page - Membership signup with Zeffy iframe
 * Converted from join-us.html
 */
const JoinUs = () => {
  const [showIframe, setShowIframe] = useState(false);

  const benefits = [
    {
      icon: '🍻',
      title: 'Great Drinks',
      description: "Fantastic selection of beers and liquor, ensuring there's something for every taste."
    },
    {
      icon: '👥',
      title: 'Community',
      description: 'Meet like-minded people and build lasting friendships in a welcoming environment.'
    },
    {
      icon: '🎯',
      title: 'Activities',
      description: 'Regular events and activities keep things interesting and fun for all members.'
    },
    {
      icon: '💰',
      title: 'Affordable',
      description: "At just $20 per year, it's an incredible value for all the benefits you receive."
    },
    {
      icon: '🌅',
      title: 'Outdoor Space',
      description: 'Enjoy our newly opened outdoor patio seating for friendship and drinks.'
    },
    {
      icon: '🎉',
      title: 'Private Events',
      description: 'The Lounge is available for private event rentals—perfect for birthdays and celebrations.'
    }
  ];

  const membershipFeatures = [
    'Full access to our complete bar selection',
    'Beer, wine, liquors and cocktails made to order',
    'Pool table access for friendly games',
    'Participation in all member events',
    'New! Cribbage nights',
    'Access to our newly opened outdoor patio',
    'Painting nights, whisky tastings, musical bingo',
    'Private event rental opportunities'
  ];

  const handleJoinClick = () => {
    setShowIframe(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-dark-light">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
            Join The Lantern Lounge
          </h1>
          <p className="text-2xl text-primary font-semibold">
            Become part of Lexington's friendliest social club
          </p>
        </div>
      </section>

      {/* Membership Details Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {!showIframe ? (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Membership Card */}
              <Card variant="membership" className="flex flex-col">
                <div className="mb-6">
                  <h2 className="text-3xl font-display font-bold text-white mb-2">
                    Annual Membership
                  </h2>
                  <div className="text-5xl font-bold text-primary">
                    $20<span className="text-2xl text-gray-400">/year</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1">
                  {membershipFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <span className="text-primary mr-3 text-xl flex-shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Join Action Section */}
              <div className="flex flex-col justify-center space-y-6">
                <div className="bg-dark-card p-8 rounded-lg">
                  <h3 className="text-2xl font-display font-bold text-white mb-4">
                    Ready to Join?
                  </h3>
                  <p className="text-gray-300 mb-4">
                    <strong className="text-white">Simply walk in and apply for membership on the spot!</strong>
                  </p>
                  <p className="text-gray-300 mb-6">
                    Visit us during operating hours and our friendly staff will help you complete your membership application.
                  </p>
                  <Button
                    variant="cta"
                    fullWidth
                    onClick={handleJoinClick}
                  >
                    Join Us!
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Zeffy Iframe */
            <div className="w-full">
              <iframe
                title="Donation form powered by Zeffy"
                style={{
                  border: 0,
                  width: '100%',
                  height: '800px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
                src="https://www.zeffy.com/embed/ticketing/lantern-lounge-associate-membership"
                allowPaymentRequest
                allow="payment"
              />
            </div>
          )}
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 px-4 bg-dark-light">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white text-center mb-12">
            Why Choose The Lantern Lounge?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-dark p-6 rounded-lg hover:bg-dark-card transition-all"
              >
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  {benefit.icon} {benefit.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Visit Us Today
          </h2>
          <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
            Ready to become a member? Come visit us during operating hours and join Lexington's best-kept secret!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-card p-8 rounded-lg">
              <h3 className="text-xl font-display font-bold text-white mb-4">
                Location
              </h3>
              <p className="text-gray-300">
                The Lantern Lounge<br />
                Lexington, MA
              </p>
            </div>
            <div className="bg-dark-card p-8 rounded-lg">
              <h3 className="text-xl font-display font-bold text-white mb-4">
                Membership
              </h3>
              <p className="text-gray-300">
                Walk-in applications welcome<br />
                $20 annual membership fee
              </p>
            </div>
            <div className="bg-dark-card p-8 rounded-lg">
              <h3 className="text-xl font-display font-bold text-white mb-4">
                What to Expect
              </h3>
              <p className="text-gray-300">
                Friendly staff will help you<br />
                Simple application process<br />
                Immediate access upon approval
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinUs;
