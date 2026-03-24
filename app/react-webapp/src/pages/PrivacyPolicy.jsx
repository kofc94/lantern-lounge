const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-dark">
      <section className="relative pt-32 pb-24 border-b border-white/5">
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <span className="text-accent-gold font-mono text-sm tracking-[0.3em] uppercase mb-6 block">Legal</span>
            <h1 className="text-6xl md:text-7xl font-display font-black text-white mb-8 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-lg">Last updated: March 2025</p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-custom">
          <div className="max-w-3xl space-y-12 text-gray-400 text-lg leading-relaxed">

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">Who we are</h2>
              <p>
                The Lantern Lounge is a private social club located at 177 Bedford St, Lexington, MA.
                This policy describes how we collect and use information when you use our website
                and membership services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">Information we collect</h2>
              <p className="mb-4">
                When you sign in with Google, we receive your name and email address from Google.
                We use this to identify you as a member and to communicate club news and event information.
              </p>
              <p>
                We also collect information you provide directly, such as when you submit a membership
                application or RSVP for an event.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">How we use your information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To manage your club membership and account</li>
                <li>To communicate event schedules and club announcements</li>
                <li>To process membership applications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">What we don't do</h2>
              <p>
                We do not sell, rent, or share your personal information with third parties for
                marketing purposes. We do not use your information for advertising.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">Data storage</h2>
              <p>
                Member data is stored securely in AWS infrastructure located in the United States.
                We retain your information for as long as your membership is active or as needed to
                operate the club.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">Contact</h2>
              <p>
                If you have questions about this policy or would like to request deletion of your data,
                please contact us at{' '}
                <a href="mailto:info@lanternlounge.org" className="text-primary hover:text-primary-hover underline transition-colors">
                  info@lanternlounge.org
                </a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
