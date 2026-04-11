import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'How do I become a member?',
    a: (
      <>
        Membership is open to anyone who loves good company and a classic atmosphere.
        Visit our{' '}
        <Link to="/join-us" className="text-accent-gold hover:text-white transition-colors">
          Join Us
        </Link>{' '}
        page to learn how to sign up — annual dues are just $20.
      </>
    ),
  },
  {
    q: 'How do I create a website account?',
    a: (
      <>
        Once you are a member, head to the{' '}
        <Link to="/register" className="text-accent-gold hover:text-white transition-colors">
          Register
        </Link>{' '}
        page to create your lanternlounge.org account. You can sign up with Google or
        with an email and password.
      </>
    ),
  },
  {
    q: 'I forgot my password. What do I do?',
    a: 'Use the "Forgot password?" link on the sign-in form on the home page. We\'ll email you a reset code. If you signed up with Google, use the "Continue with Google" button instead.',
  },
  {
    q: 'Where can I see upcoming events?',
    a: (
      <>
        All events are listed on the{' '}
        <Link to="/events" className="text-accent-gold hover:text-white transition-colors">
          Events
        </Link>{' '}
        page. Members can also see additional details when signed in.
      </>
    ),
  },
  {
    q: 'How does the digital membership card work?',
    a: "Once you're signed in, your membership card appears on your profile. It includes a QR code that staff can scan at the door. You can also add it to Google Wallet for easy access on your phone.",
  },
  {
    q: 'Where is The Lantern Lounge located?',
    a: 'We are at 177 Bedford Street, Lexington, MA. There is street parking nearby and we are a short walk from Lexington Center.',
  },
  {
    q: 'I have a problem not listed here. Who do I contact?',
    a: (
      <>
        Reach us by phone at{' '}
        <a href="tel:+17818628044" className="text-accent-gold hover:text-white transition-colors">
          781-862-8044
        </a>{' '}
        or by email at{' '}
        <a href="mailto:info@lanternlounge.org" className="text-accent-gold hover:text-white transition-colors">
          info@lanternlounge.org
        </a>
        . We aim to respond within one business day.
      </>
    ),
  },
];

const Help = () => {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(178,34,34,0.05)_0%,transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <span className="text-accent-gold font-mono text-sm tracking-[0.3em] uppercase mb-6 block">
            Support
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 tracking-tight">
            How Can We <span className="text-primary italic">Help?</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            Find answers below, or get in touch with us directly — we're always happy to hear from members and guests.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 border-b border-white/5">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a
              href="tel:+17818628044"
              className="group flex items-center gap-5 p-8 border border-white/10 hover:border-primary/40 bg-white/2 hover:bg-white/5 transition-all duration-300"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-accent-gold/30 group-hover:border-accent-gold/60 transition-colors shrink-0">
                <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-1">Phone</p>
                <p className="text-white font-semibold text-lg group-hover:text-accent-gold transition-colors">781-862-8044</p>
              </div>
            </a>

            <a
              href="mailto:info@lanternlounge.org"
              className="group flex items-center gap-5 p-8 border border-white/10 hover:border-primary/40 bg-white/2 hover:bg-white/5 transition-all duration-300"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-accent-gold/30 group-hover:border-accent-gold/60 transition-colors shrink-0">
                <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-1">Email</p>
                <p className="text-white font-semibold text-lg group-hover:text-accent-gold transition-colors">info@lanternlounge.org</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-white mb-12 text-center">
            Frequently Asked <span className="text-primary italic">Questions</span>
          </h2>

          <div className="space-y-px">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/8 p-8 hover:border-white/15 transition-colors">
                <h3 className="text-white font-semibold text-lg mb-3">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;
