import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.error("Profile error:", profileError);

      return NextResponse.json(
        { error: "Could not verify your subscription plan." },
        { status: 500 }
      );
    }

    const { count, error: countError } =
      await supabase
        .from("reviews")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

    if (countError) {
      console.error("Review count error:", countError);

      return NextResponse.json(
        { error: "Could not check your review usage." },
        { status: 500 }
      );
    }

    if (profile.plan === "free" && (count ?? 0) >= 3) {
      return NextResponse.json(
        {
          error:
            "You have reached the 3-review Free plan limit. Upgrade to Pro for unlimited reviews.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        {
          error:
            "Resume text and job description are required.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert ATS resume reviewer.

Analyze the resume against the job description.

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the JSON in backticks.

Use exactly this structure:

{
  "overallScore": 0,
  "atsScore": 0,
  "skillsMatch": 0,
  "experienceMatch": 0,
  "summary": "",
  "matchingSkills": [],
  "missingSkills": [],
  "recommendations": []
}

Rules:
- All scores must be numbers from 0 to 100.
- matchingSkills should contain skills present in both the resume and job description.
- missingSkills should contain important job-description skills missing from the resume.
- recommendations should contain practical suggestions for improving the resume.
- summary should briefly explain how well the resume matches the job.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

    const completion =
      await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      });

    const content =
      completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI did not return a response." },
        { status: 500 }
      );
    }

    const cleanedContent = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(cleanedContent);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI analysis error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze resume.",
      },
      { status: 500 }
    );
  }
}