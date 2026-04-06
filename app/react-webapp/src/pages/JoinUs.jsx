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
      icon: '🍷',
      title: 'Fine Selection',
      description: "A curated variety of beers, wines, and spirits to suit every palate."
    },
    {
      icon: '🤝',
      title: 'Genuine Connection',
      description: 'A sanctuary for meeting neighbors and building lasting local friendships.'
    },
    {
      icon: '🎯',
      title: 'Curated Events',
      description: 'Regular activities from whisky tastings to cribbage tournaments.'
    },
    {
      icon: '📜',
      title: 'Historic Value',
      description: "At just $20 per year, membership offers unparalleled access to a Lexington landmark."
    },
    {
      icon: '🌳',
      title: 'Garden Patio',
      description: 'Breathe in the fresh air on our newly opened outdoor seating area.'
    },
    {
      icon: '🥂',
      title: 'Private Rentals',
      description: 'The Lounge provides a distinguished setting for your private celebrations.'
    }
  ];

  const membershipFeatures = [
    'Full access to our complete bar selection',
    'Participation in all member-only events',
    'Weekly cribbage tournaments',
    'Access to our seasonal outdoor patio',
    'Specialized tasting nights',
    'Private event rental opportunities'
  ];

  const handleJoinClick = () => {
    setShowIframe(true);
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(178,34,34,0.05)_0%,transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <span className="text-accent-gold font-mono text-sm tracking-[0.3em] uppercase mb-6 block">Membership</span>
          <h1 className="text-6xl md:text-8xl font-display font-black text-white mb-6 tracking-tight">
            Join the <span className="text-primary italic">Lounge</span>
          </h1>
          <p className="text-2xl text-gray-400 font-medium max-w-3xl mx-auto leading-relaxed">
            Become a part of Lexington's most welcoming social community. <br className="hidden md:block" />
            Tradition, conversation, and a perfectly poured drink await.
          </p>
        </div>
      </section>

      {/* Membership Details Section */}
      <section className="py-24 relative">
        <div className="container-custom">
          {!showIframe ? (
            <div className="flex flex-col lg:flex-row gap-16 items-stretch">
              {/* Membership Card - Paper Style */}
              <div className="lg:w-1/2 bg-neutral-paper p-12 shadow-[30px_30px_0px_0px_rgba(178,34,34,0.1)] border border-stone-200 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12 border-b border-stone-200 pb-8">
                    <div>
                      <h2 className="text-4xl font-display font-bold text-neutral-dark mb-2">
                        Annual Associate
                      </h2>
                      <span className="text-stone-500 font-mono text-sm uppercase tracking-widest">Membership Tier</span>
                    </div>
                    <div className="text-right">
                      <div className="text-6xl font-display font-black text-primary">
                        $20
                      </div>
                      <div className="text-stone-500 font-bold uppercase text-xs tracking-tighter">Per Calendar Year</div>
                    </div>
                  </div>
                  
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {membershipFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start text-stone-700 group/item">
                        <span className="text-primary mr-3 text-lg font-bold leading-none">†</span>
                        <span className="text-base font-medium leading-tight group-hover/item:text-primary transition-colors">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-white/50 p-6 border border-stone-200 rounded-sm">
                    <p className="text-stone-600 italic text-sm text-center">
                      "A membership at The Lantern Lounge is more than access to a bar; it's an investment in your local community."
                    </p>
                  </div>
                </div>
              </div>

              {/* Join Action Section */}
              <div className="lg:w-1/2 flex flex-col justify-center">
                <div className="max-w-md">
                  <h3 className="text-4xl font-display font-bold text-white mb-6">
                    Ready to <span className="text-accent-gold italic">unwind?</span>
                  </h3>
                  <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    Simply walk in and apply for membership on the spot! Our staff is ready to welcome you into the fold.
                  </p>
                  <div className="space-y-6">
                    <Button
                      variant="cta"
                      fullWidth
                      onClick={handleJoinClick}
                      className="!bg-primary !hover:bg-primary-hover shadow-2xl !py-6 !text-lg"
                    >
                      Online Application
                    </Button>
                    <p className="text-gray-500 text-sm text-center">
                      Applications are processed securely via Zeffy. <br />
                      No processing fees for our members.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Zeffy Iframe */
            <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="bg-white rounded-sm p-1 shadow-2xl overflow-hidden border border-white/10">
                <iframe
                  title="Donation form powered by Zeffy"
                  style={{
                    border: 0,
                    width: '100%',
                    height: '800px',
                  }}
                  src="https://www.zeffy.com/embed/ticketing/lexington-knights-of-columbus-members-association-memberships--2025"
                  allowPaymentRequest
                  allow="payment"
                />
              </div>
              <button 
                onClick={() => setShowIframe(false)}
                className="mt-8 text-accent-gold hover:text-white transition-colors font-mono text-sm uppercase tracking-widest flex items-center gap-2"
              >
                ← Back to membership details
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Why Join Section - Dark Editorial */}
      <section className="py-32 bg-neutral-dark border-y border-white/5">
        <div className="container-custom">
          <h2 className="text-5xl md:text-6xl font-display font-bold text-white text-center mb-20 leading-tight">
            Why Choose the <span className="text-accent-gold italic">Lantern Lounge?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 border border-white/5 hover:border-primary/20 transition-all duration-500 hover:bg-white/[0.02]"
              >
                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500 origin-left">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-accent-gold transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit Us Section - Warm & Structured */}
      <section className="py-32 relative overflow-hidden bg-neutral-paper">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain" />
        <div className="container-custom relative">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-neutral-dark mb-6">
              Visit Us <span className="text-primary italic">Today</span>
            </h2>
            <p className="text-xl text-stone-600 leading-relaxed">
              Experience Lexington's best-kept secret in person. We're ready to welcome you into our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Our Home',
                content: 'The Lantern Lounge\n177 Bedford St,\nLexington, MA 02420',
                detail: 'Historic Social Club'
              },
              {
                title: 'Membership',
                content: 'Walk-in applications welcome',
                detail: '$20 Annual Dues'
              },
              {
                title: 'The Process',
                content: 'Apply in person for immediate access upon approval.',
                detail: 'Simple & Welcoming'
              }
            ].map((box, i) => (
              <div key={i} className="bg-white p-10 shadow-lg border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-accent-gold font-mono text-xs uppercase tracking-widest mb-6 block border-b border-stone-100 pb-2">{box.title}</span>
                  <p className="text-stone-700 text-lg leading-relaxed mb-8 whitespace-pre-line font-medium">
                    {box.content}
                  </p>
                </div>
                <div className="text-primary font-display italic font-bold text-sm">
                  {box.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinUs;
