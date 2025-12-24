import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/stores/[id] - Get single store credential
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const store = await prisma.storeCredential.findUnique({
      where: { id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}

// PUT /api/stores/[id] - Update store credential
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, storeUrl, adminApiToken, storefrontToken, scopes, apiVersion, notes, isActive } = body;

    // If setting this store as active, deactivate all others first
    if (isActive) {
      await prisma.storeCredential.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (storeUrl !== undefined) {
      updateData.storeUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }
    if (adminApiToken !== undefined) updateData.adminApiToken = adminApiToken;
    if (storefrontToken !== undefined) updateData.storefrontToken = storefrontToken;
    if (scopes !== undefined) updateData.scopes = scopes;
    if (apiVersion !== undefined) updateData.apiVersion = apiVersion;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const store = await prisma.storeCredential.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error updating store:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id] - Delete store credential
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.storeCredential.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting store:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }
}
