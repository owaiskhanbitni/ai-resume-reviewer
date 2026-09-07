"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Analysis = {
  overallScore: number;
  atsScore: number;
  skillsMatch: number;
  experienceMatch: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
};

type Review = {
  id: string;
  user_id: string;
  resume_name: string | null;
  job_description: string;
  overall_score: number | null;
  ats_score: number | null;
  skills_match: number | null;
  experience_match: number | null;
  summary: string | null;
  matching_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  created_at: string;
};

type Profile = {
  plan: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    await Promise.all([
      loadReviews(),
      loadProfile(),
    ]);
  }

  async function loadProfile() {
    setProfileLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfileLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Load profile error:", error);
      setProfileLoading(false);
      return;
    }

    setProfile(data as Profile);
    setProfileLoading(false);
  }

  async function loadReviews() {
    setHistoryLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setHistoryLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load reviews error:", error);
      setHistoryLoading(false);
      return;
    }

    setReviews((data as Review[]) || []);
    setHistoryLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleUpgrade() {
    try {
      setUpgradeLoading(true);
      setMessage("");

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start checkout."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start Stripe checkout."
      );
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!resume) {
      setMessage("Please upload your resume PDF.");
      return;
    }

    if (resume.type !== "application/pdf") {
      setMessage("Please upload a PDF file.");
      return;
    }

    if (!jobDescription.trim()) {
      setMessage("Please enter the job description.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setAnalysis(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Check user's current plan
      const { data: currentProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error("Profile error:", profileError);

        throw new Error(
          "Could not check your subscription plan."
        );
      }

      // Count user's reviews
      const { count, error: countError } = await supabase
        .from("reviews")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (countError) {
        console.error(
          "Review count error:",
          countError
        );

        throw new Error(
          "Could not check your review usage."
        );
      }

      // Free plan limit
      if (
        currentProfile.plan === "free" &&
        (count ?? 0) >= 3
      ) {
        setMessage(
          "You have reached the 3-review Free plan limit. Upgrade to Pro for unlimited reviews."
        );

        return;
      }

      // STEP 1: Extract resume text
      const formData = new FormData();
      formData.append("file", resume);

      const extractResponse = await fetch(
        "/api/extract",
        {
          method: "POST",
          body: formData,
        }
      );

      const extractData =
        await extractResponse.json();

      if (!extractResponse.ok) {
        throw new Error(
          extractData.error ||
            "Failed to extract resume text."
        );
      }

      if (!extractData.text) {
        throw new Error(
          "Could not extract text from the resume."
        );
      }

      // STEP 2: Analyze with AI
      const analyzeResponse = await fetch(
        "/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText: extractData.text,
            jobDescription: jobDescription,
          }),
        }
      );

      const analyzeData =
        await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(
          analyzeData.error ||
            "Failed to analyze resume."
        );
      }

      // STEP 3: Save analysis
      const { error: saveError } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          resume_name: resume.name,
          job_description: jobDescription,
          overall_score:
            analyzeData.overallScore,
          ats_score:
            analyzeData.atsScore,
          skills_match:
            analyzeData.skillsMatch,
          experience_match:
            analyzeData.experienceMatch,
          summary:
            analyzeData.summary,
          matching_skills:
            analyzeData.matchingSkills,
          missing_skills:
            analyzeData.missingSkills,
          recommendations:
            analyzeData.recommendations,
        });

      if (saveError) {
        console.error(
          "Save review error:",
          saveError
        );

        throw new Error(
          "AI analysis completed, but it could not be saved."
        );
      }

      // STEP 4: Show result
      setAnalysis(analyzeData);

      setMessage(
        "Resume analysis completed and saved successfully."
      );

      // STEP 5: Refresh history
      await loadReviews();
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteReview(
    id: string
  ) {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Delete review error:",
        error
      );

      setMessage(
        "Failed to delete review."
      );

      return;
    }

    setReviews((currentReviews) =>
      currentReviews.filter(
        (review) => review.id !== id
      )
    );

    setMessage(
      "Review deleted successfully."
    );
  }

  const isPro = profile?.plan === "pro";
  const reviewLimitReached =
    !isPro && reviews.length >= 3;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-2xl font-bold">
          ResumeAI
        </h1>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Logout
        </button>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold">
            Resume Dashboard
          </h2>

          {/* Plan */}
          <div className="mt-4 flex flex-wrap items-center gap-3">

            {profileLoading ? (
              <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
                Loading plan...
              </div>
            ) : isPro ? (
              <div className="rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                Pro Plan — Unlimited reviews
              </div>
            ) : (
              <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                Free Plan — {reviews.length} / 3 reviews used
              </div>
            )}

            {!isPro && (
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {upgradeLoading
                  ? "Opening checkout..."
                  : "Upgrade to Pro — $9/month"}
              </button>
            )}

            {isPro && (
              <button
                onClick={() =>
                  (window.location.href =
                    "/billing")
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
              >
                Manage Billing
              </button>
            )}
          </div>

          <p className="mt-3 text-gray-600">
            Upload your resume and job description
            to get an AI-powered analysis.
          </p>
        </div>

        {/* Upgrade Message */}
        {reviewLimitReached && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="font-semibold text-blue-900">
              You've used all 3 free reviews
            </h3>

            <p className="mt-1 text-sm text-blue-700">
              Upgrade to Pro to unlock unlimited
              resume reviews and detailed analysis.
            </p>

            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {upgradeLoading
                ? "Opening checkout..."
                : "Upgrade to Pro"}
            </button>
          </div>
        )}

        {/* Upload + Job Description */}
        <div className="mt-10 grid gap-8 md:grid-cols-2">

          {/* Resume Upload */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-xl font-semibold">
              Upload Resume
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Upload your resume in PDF format.
            </p>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-10 text-center hover:bg-gray-50">

              <span className="text-4xl">
                📄
              </span>

              <span className="mt-3 font-medium">
                {resume
                  ? resume.name
                  : "Choose PDF"}
              </span>

              <span className="mt-1 text-sm text-gray-500">
                Click to browse your files
              </span>

              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file =
                    e.target.files?.[0] ||
                    null;

                  setResume(file);
                  setMessage("");
                  setAnalysis(null);
                }}
              />
            </label>
          </div>

          {/* Job Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-xl font-semibold">
              Job Description
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Paste the job description you're
              applying for.
            </p>

            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(
                  e.target.value
                );
                setMessage("");
              }}
              placeholder="Paste the job description here..."
              className="mt-6 h-48 w-full resize-none rounded-xl border border-slate-300 p-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Analyze Button */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <button
            onClick={handleAnalyze}
            disabled={
              loading ||
              profileLoading ||
              reviewLimitReached
            }
            className="w-full rounded-lg bg-black px-6 py-4 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Analyzing Resume..."
              : reviewLimitReached
              ? "Free Review Limit Reached"
              : "Analyze My Resume"}
          </button>

          {message && (
            <p className="mt-4 rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
              {message}
            </p>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-10 space-y-6">

            <h3 className="text-2xl font-bold">
              AI Analysis Results
            </h3>

            {/* Scores */}
            <div className="grid gap-4 md:grid-cols-4">

              <ScoreCard
                title="Overall Score"
                score={
                  analysis.overallScore
                }
              />

              <ScoreCard
                title="ATS Score"
                score={
                  analysis.atsScore
                }
              />

              <ScoreCard
                title="Skills Match"
                score={
                  analysis.skillsMatch
                }
              />

              <ScoreCard
                title="Experience Match"
                score={
                  analysis.experienceMatch
                }
              />
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h4 className="text-xl font-semibold">
                AI Summary
              </h4>

              <p className="mt-3 leading-7 text-gray-600">
                {analysis.summary}
              </p>
            </div>

            {/* Matching Skills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h4 className="text-xl font-semibold">
                Matching Skills
              </h4>

              <div className="mt-4 flex flex-wrap gap-2">

                {analysis.matchingSkills?.map(
                  (skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h4 className="text-xl font-semibold">
                Missing Skills
              </h4>

              <div className="mt-4 flex flex-wrap gap-2">

                {analysis.missingSkills?.map(
                  (skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h4 className="text-xl font-semibold">
                Recommendations
              </h4>

              <ul className="mt-4 space-y-3">

                {analysis.recommendations?.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <li
                      key={index}
                      className="rounded-lg bg-gray-50 p-4 text-gray-700"
                    >
                      {recommendation}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Review History */}
        <div className="mt-12">

          <h3 className="text-2xl font-bold">
            Review History
          </h3>

          {historyLoading ? (
            <div className="mt-4 rounded-2xl border bg-white p-8 text-center">

              <p className="text-gray-500">
                Loading your reviews...
              </p>

            </div>
          ) : reviews.length === 0 ? (

            <div className="mt-4 rounded-2xl border bg-white p-8 text-center">

              <p className="text-gray-500">
                Your previous resume reviews
                will appear here.
              </p>

            </div>
          ) : (

            <div className="mt-4 space-y-4">

              {reviews.map((review) => (

                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h4 className="font-semibold">
                        {review.resume_name ||
                          "Resume Review"}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(
                          review.created_at
                        ).toLocaleString()}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteReview(
                          review.id
                        )
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Delete
                    </button>

                  </div>

                  {/* History Scores */}
                  <div className="mt-5 grid gap-3 md:grid-cols-4">

                    <MiniScore
                      label="Overall"
                      score={
                        review.overall_score
                      }
                    />

                    <MiniScore
                      label="ATS"
                      score={
                        review.ats_score
                      }
                    />

                    <MiniScore
                      label="Skills"
                      score={
                        review.skills_match
                      }
                    />

                    <MiniScore
                      label="Experience"
                      score={
                        review.experience_match
                      }
                    />

                  </div>

                  {/* History Summary */}
                  {review.summary && (
                    <p className="mt-5 text-sm leading-6 text-gray-600">
                      {review.summary}
                    </p>
                  )}

                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ScoreCard({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-4xl font-bold">
        {score}
      </p>

      <p className="text-sm text-gray-500">
        / 100
      </p>

    </div>
  );
}

function MiniScore({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-center">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {score ?? "-"}
      </p>

    </div>
  );
}