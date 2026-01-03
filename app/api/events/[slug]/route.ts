import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event, { IEvent } from "@/database/event.model";

interface RouteParams {
  slug: string;
}

interface ErrorResponse {
  message: string;
  details?: string;
}

interface SuccessResponse {
  message: string;
  event: IEvent;
}

/**
 * GET /api/events/[slug]
 *
 * Fetch a single event by its slug.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    await connectDB();

    const { slug: rawSlug } = await context.params;

    // Basic validation: slug must be a non-empty string
    if (typeof rawSlug !== "string" || rawSlug.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "Invalid request", details: "Slug parameter is required" },
        { status: 400 }
      );
    }

    const slug = decodeURIComponent(rawSlug).trim().toLowerCase();

    // Optional: enforce a conservative slug pattern
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      return NextResponse.json<ErrorResponse>(
        {
          message: "Invalid slug format",
          details:
            "Slug may only contain lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    const event = await Event.findOne({ slug }).lean<IEvent>().exec();

    if (!event) {
      return NextResponse.json<ErrorResponse>(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<SuccessResponse>(
      {
        message: "Event fetched successfully",
        event,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Log full error server-side for debugging/monitoring
    console.error("[GET /api/events/[slug]] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json<ErrorResponse>(
      {
        message: "Failed to fetch event",
        details: message,
      },
      { status: 500 }
    );
  }
}
