import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import WalletCard from '../components/auth/WalletCard';

const Home = () => {
  const { user } = useAuth();
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
      description: 'Painting nights, whisky tastings, musical bingo, and cribbage nights!'
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
    <div className="min-h-screen bg-dark">
      {/* Hero Section - Asymmetrical & Bold */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-20 hidden lg:block" />

        <div className="container-custom relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Hero Content - 60% Width */}
            <div className="lg:w-3/5">
              <span className="inline-block px-4 py-1.5 bg-accent-gold/10 text-accent-gold text-sm font-bold tracking-widest uppercase mb-6 rounded-sm border border-accent-gold/20">
                Est. Lexington, MA
              </span>
              <h1 className="text-6xl md:text-8xl font-display font-black text-white leading-[1.1] mb-8 tracking-tight">
                Welcome to <br />
                <span className="text-primary italic">The Lantern Lounge</span>
              </h1>
              <p className="text-2xl text-gray-400 font-medium mb-10 leading-relaxed max-w-2xl">
                Lexington's <span className="text-white border-b-2 border-primary/40">coziest social club</span>. A place to unwind, connect, and enjoy the finer things with neighbors and friends.
              </p>
              
              {user ? (
                <div className="max-w-md">
                  <WalletCard />
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <Link to="/join-us">
                    <Button variant="cta" className="!bg-primary !hover:bg-primary-hover shadow-2xl">
                      Become a Member
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button variant="outline" className="!border-white/20 !text-white hover:!bg-white/10">
                      Our Story
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Hero Image - 40% Width with Overlap */}
            <div className="lg:w-2/5 relative">
              <div className="relative z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img
                  src="/assets/entrance.png"
                  alt="Lantern Lounge Interior"
                  className="w-full rounded-sm shadow-[30px_30px_0px_0px_rgba(178,34,34,0.1)] border border-white/10"
                />
              </div>
              {/* Decorative Frame */}
              <div className="absolute -inset-4 border border-accent-gold/20 rounded-sm -z-10 transform -rotate-1 hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Editorial Grid */}
      <section className="py-32 bg-neutral-dark/40 border-y border-white/5 relative overflow-hidden">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                Why Join Our <span className="text-accent-gold italic">Community?</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Beyond the bar, we offer a sanctuary for shared experiences and genuine connection.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-px bg-accent-gold/40 mb-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row gap-8 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="w-full md:w-1/2 aspect-[4/5] overflow-hidden rounded-sm group">
                  <img
                    src={feature.image}
                    alt={feature.alt}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <span className="text-accent-gold font-mono text-sm mb-4 block">0{index + 1}</span>
                  <h3 className="text-3xl font-display font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="h-0.5 w-12 bg-primary/40 group-hover:w-full transition-all duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Section - Warm & Paper Tone */}
      <section className="py-32 bg-neutral-paper relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain" />
        <div className="container-custom relative">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-5xl md:text-6xl font-display font-bold text-neutral-dark mb-8 leading-[1.1]">
                Membership is just <span className="text-primary italic">$20 per year.</span>
              </h2>
              <p className="text-xl text-stone-600 mb-10 leading-relaxed">
                Join our private social club and enjoy exclusive access to our community, events, and Lexington's most historic atmosphere.
              </p>
              <Link to="/join-us">
                <Button variant="cta" className="!bg-neutral-dark !text-white !px-12 !py-5 shadow-2xl">
                  Secure Your Membership
                </Button>
              </Link>
            </div>

            <div className="lg:w-1/2 bg-white p-12 shadow-[40px_40px_0px_0px_#B2222210] border border-stone-200 rounded-sm">
              <h4 className="text-2xl font-display font-bold text-neutral-dark mb-8 border-b border-stone-100 pb-4">
                Member Benefits
              </h4>
              <ul className="space-y-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start text-stone-700 group">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                      <span className="text-primary text-xs font-bold">✓</span>
                    </span>
                    <span className="text-lg font-medium group-hover:text-primary transition-colors cursor-default">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
