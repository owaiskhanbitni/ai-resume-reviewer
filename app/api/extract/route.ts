import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const text = await new Promise<string>(
      (resolve, reject) => {
        const parser = new PDFParser();

        parser.on(
          "pdfParser_dataError",
          (error: any) => {
            reject(error.parserError);
          }
        );

        parser.on(
          "pdfParser_dataReady",
          (pdfData: any) => {
            let extractedText = "";

            for (const page of pdfData.Pages || []) {
              for (const textElement of page.Texts || []) {
                for (const run of textElement.R || []) {
                  if (run.T) {
                    extractedText +=
                      decodeURIComponent(run.T) + " ";
                  }
                }

                extractedText += "\n";
              }

              extractedText += "\n";
            }

            resolve(extractedText.trim());
          }
        );

        parser.parseBuffer(buffer);
      }
    );

    if (!text) {
      return NextResponse.json(
        {
          error:
            "No readable text was found in this PDF. Please upload a text-based resume PDF.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error(
      "PDF extraction error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract text from PDF.",
      },
      { status: 500 }
    );
  }
}