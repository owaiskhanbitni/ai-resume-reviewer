export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b px-8 py-5">
        <h1 className="text-2xl font-bold">
          ResumeAI
        </h1>

        <div className="flex gap-4">
          <a
  href="/login"
  className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
>
  Login
</a>

          <a
  href="/signup"
  className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
>
  Get Started
</a>

        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="mb-6 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm">
          AI-Powered Resume Analysis
        </div>

        <h2 className="text-5xl font-bold tracking-tight">
          Get your resume ready
          <br />
          for your next job.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Upload your resume and a job description. ResumeAI analyzes your
          resume, identifies missing skills, and gives you actionable
          recommendations to improve your chances of getting hired.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a
  href="/signup"
  className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
>
  Get Started
</a>

          <button className="rounded-lg border px-6 py-3 font-medium hover:bg-gray-50">
            View Pricing
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-center text-3xl font-bold">
            Everything you need to improve your resume
          </h3>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-6">
              <h4 className="text-xl font-semibold">
                ATS Score
              </h4>
              <p className="mt-3 text-gray-600">
                See how well your resume matches the job description.
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h4 className="text-xl font-semibold">
                Missing Skills
              </h4>
              <p className="mt-3 text-gray-600">
                Discover important skills and keywords missing from your
                resume.
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h4 className="text-xl font-semibold">
                AI Recommendations
              </h4>
              <p className="mt-3 text-gray-600">
                Get practical suggestions to make your resume stronger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-center text-3xl font-bold">
            Simple pricing
          </h3>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-8">
              <h4 className="text-2xl font-bold">Free</h4>
              <p className="mt-2 text-gray-600">
                Get started with basic resume analysis.
              </p>

              <p className="mt-6 text-4xl font-bold">
                $0
              </p>

              <ul className="mt-6 space-y-3 text-gray-600">
                <li>✓ 3 resume reviews</li>
                <li>✓ Basic ATS score</li>
                <li>✓ Basic recommendations</li>
              </ul>

<a
  href="/signup"
  className="mt-8 block w-full rounded-lg border px-5 py-3 text-center font-medium"
>
  Start Free
</a>
            </div>

            <div className="rounded-xl border-2 border-black p-8">
              <h4 className="text-2xl font-bold">Pro</h4>
              <p className="mt-2 text-gray-600">
                Advanced analysis for serious job seekers.
              </p>

              <p className="mt-6 text-4xl font-bold">
                $9
                <span className="text-base font-normal text-gray-500">
                  /month
                </span>
              </p>

              <ul className="mt-6 space-y-3 text-gray-600">
                <li>✓ Unlimited resume reviews</li>
                <li>✓ Detailed ATS analysis</li>
                <li>✓ Missing keyword analysis</li>
                <li>✓ Personalized recommendations</li>
              </ul>

              <button className="mt-8 w-full rounded-lg bg-black px-5 py-3 font-medium text-white">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-8 text-center text-sm text-gray-500">
        © 2026 ResumeAI. Built for smarter job applications.
      </footer>
    </main>
  );
}