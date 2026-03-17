import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

/**
 * About Page - Company story and perks
 * Converted from about.html
 */
const About = () => {
  const perks = [
    {
      icon: '🥃',
      title: 'Curated Spirits',
      description: 'A distinguished selection of premium whiskies, craft beers, and seasonal cocktails.'
    },
    {
      icon: '🎱',
      title: 'Social Recreation',
      description: 'Engage in friendly competition with our well-maintained pool table and classic games.'
    },
    {
      icon: '🃏',
      title: 'Cribbage Tradition',
      description: 'Join our storied cribbage nights, a cornerstone of our community for years.'
    },
    {
      icon: '🌿',
      title: 'The Garden Patio',
      description: 'Relax in our hidden outdoor sanctuary, perfect for cool Lexington evenings.'
    },
    {
      icon: '🎨',
      title: 'Community Arts',
      description: 'Regular painting nights and cultural events that celebrate local talent.'
    },
    {
      icon: '🥂',
      title: 'Elegant Gatherings',
      description: 'Host your most memorable milestones in our historic, intimate lounge.'
    }
  ];

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="container-custom relative z-10">
          <div className="max-w-4xl">
            <span className="text-accent-gold font-mono text-sm tracking-[0.3em] uppercase mb-6 block">Our Legacy</span>
            <h1 className="text-6xl md:text-8xl font-display font-black text-white mb-8 tracking-tight">
              A Lexington <br />
              <span className="text-primary italic">Best-Kept Secret</span>
            </h1>
            <p className="text-2xl text-gray-400 font-medium leading-relaxed max-w-2xl">
              Since our founding, The Lantern Lounge has served as a sanctuary for those seeking genuine connection and a quiet place to unwind.
            </p>
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 -z-10" />
      </section>

      {/* About Content Section - Asymmetrical Storytelling */}
      <section className="py-32 relative">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-32">
            {/* Text Content */}
            <div className="lg:w-1/2 order-2 lg:order-1">
              <h2 className="text-5xl font-display font-bold text-white mb-10 leading-tight">
                Our <span className="text-accent-gold italic">Story</span>
              </h2>
              <div className="space-y-8 text-gray-400 text-xl leading-relaxed">
                <p>
                  The Lantern Lounge isn't just a bar; it's a living history of Lexington community. For decades, these walls have witnessed friendships formed, celebrations shared, and the quiet comfort of a neighborhood home.
                </p>

                <p className="text-white font-medium border-l-4 border-primary pl-8 py-4 bg-white/5 italic">
                  "We believe that the best moments in life happen across a shared table, under the warm glow of a lantern."
                </p>

                <p>
                  For an annual membership of just $20, we invite you to step away from the noise of the modern world and rediscover the art of conversation in our cozy, historic setting.
                </p>

                <div className="pt-8">
                  <h3 className="text-2xl font-display font-bold text-white mb-4 uppercase tracking-widest text-sm">
                    The Community Spirit
                  </h3>
                  <p className="text-lg">
                    We are a private social club dedicated to our members. Our focus remains on quality over quantity, ensuring every visit feels personal and every member feels seen.
                  </p>
                </div>
              </div>
            </div>

            {/* Overlapping Image Composition */}
            <div className="lg:w-1/2 order-1 lg:order-2 relative">
              <div className="relative z-10 transform lg:-rotate-2">
                <img
                  src="/assets/main-bar.png"
                  alt="Lantern Lounge Interior"
                  className="w-full rounded-sm shadow-2xl border border-white/10"
                />
              </div>
              <div className="absolute -bottom-12 -left-12 w-2/3 hidden lg:block z-20 transform rotate-3">
                <img
                  src="/assets/interior.png"
                  alt="Lounge Seating"
                  className="w-full rounded-sm shadow-2xl border border-white/20"
                />
              </div>
              {/* Decorative Background Frame */}
              <div className="absolute -inset-8 border border-accent-gold/10 -z-10 hidden lg:block transform rotate-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Perks Section - Grid with Purpose */}
      <section className="py-32 bg-neutral-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain" />
        <div className="container-custom relative">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-neutral-dark mb-6">
              Membership <span className="text-primary italic">Perks</span>
            </h2>
            <p className="text-xl text-stone-600 leading-relaxed">
              Every detail of The Lantern Lounge is designed to enhance your social experience and provide a distinguished home away from home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {perks.map((perk, index) => (
              <div
                key={index}
                className="group bg-white p-10 shadow-xl border border-stone-100 hover:border-primary/20 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="text-5xl mb-8 transform group-hover:scale-110 transition-transform duration-500 origin-left">
                  {perk.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-neutral-dark mb-4 group-hover:text-primary transition-colors">
                  {perk.title}
                </h3>
                <p className="text-stone-600 leading-relaxed text-lg">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA Section - Bold Finish */}
      <section className="py-32 bg-dark">
        <div className="container-custom text-center">
          <div className="max-w-4xl mx-auto bg-neutral-dark p-16 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 relative z-10 leading-tight">
              Ready to claim your <br />
              <span className="text-accent-gold italic">seat at the bar?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
              Membership applications are always open to those who appreciate community and a classic atmosphere.
            </p>
            <div className="relative z-10">
              <Link to="/join-us">
                <Button variant="cta" className="!bg-primary !hover:bg-primary-hover shadow-2xl !px-12">
                  Learn More About Joining
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
