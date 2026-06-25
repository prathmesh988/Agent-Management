import { NextRequest, NextResponse } from "next/server";
import { Client, Storage, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { DB_CONFIG } from "@/services/database/client";
import { auditLog, extractActorMeta } from "@/lib/audit-logger";

/**
 * POST /api/leave/upload
 * Accepts multipart form data with files and uploads them to the leave documents bucket.
 * Files are named using the scheme: leave_{leaveId}.{fileExtension}
 * 
 * Query parameters:
 * - leaveId (optional): The leave request ID to use in the file naming scheme
 *   If not provided, a unique ID is generated
 *
 * Returns an array of { fileId, fileName, mimeType, size } for each uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get("leaveId") || ID.unique();

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET!);

    const storage = new Storage(client);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 },
      );
    }

    const uploaded: {
      fileId: string;
      fileName: string;
      mimeType: string;
      size: number;
    }[] = [];

    let fileIndex = 0;
    for (const file of files) {
      // Validate file size (max 30 MB)
      if (file.size > 30 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 30 MB limit` },
          { status: 400 },
        );
      }

      // Get file extension from the original file name
      const fileExtension = file.name.split('.').pop() || 'bin';
      
      // Create file ID using naming scheme: leave_{leaveId}_{index}.{extension}
      // Use index to support multiple files per leave request
      const fileId = fileIndex === 0 
        ? `leave_${leaveId}.${fileExtension}`
        : `leave_${leaveId}_${fileIndex}.${fileExtension}`;

      // Convert File to Buffer for node-appwrite InputFile
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const inputFile = InputFile.fromBuffer(buffer, file.name);

      const result = await storage.createFile(
        DB_CONFIG.LEAVE_BUCKET_ID,
        fileId,
        inputFile,
      );

      uploaded.push({
        fileId: result.$id,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      fileIndex++;
    }

    // Audit log — leave document upload
    const actorId = request.headers.get('x-user-id');
    const { actor_ip, actor_user_agent } = extractActorMeta(request);
    auditLog({
      actor_id:        actorId ?? undefined,
      actor_ip,
      actor_user_agent,
      module:          'documents',
      action_type:     'create',
      result:          'success',
      target_id:       leaveId,
      description:     `Leave document uploaded — leaveId: ${leaveId}, ${uploaded.length} file(s)`,
    });

    return NextResponse.json({ 
      success: true, 
      files: uploaded,
      leaveId // Return the leaveId so client can use it when creating the leave
    });
  } catch (error) {
    console.error("Error uploading leave documents:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/leave/upload?fileId=xxx
 * Returns the download URL for a specific leave document.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId parameter required" },
        { status: 400 },
      );
    }

    // Build direct download URL using Appwrite's REST API
    const downloadUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${DB_CONFIG.LEAVE_BUCKET_ID}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    // Fetch the file server-side using API key and stream it to the client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET!);

    const storage = new Storage(client);
    const fileInfo = await storage.getFile(DB_CONFIG.LEAVE_BUCKET_ID, fileId);
    const fileData = await storage.getFileDownload(DB_CONFIG.LEAVE_BUCKET_ID, fileId);

    return new NextResponse(fileData, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileInfo.name}"`,
        "Content-Type": fileInfo.mimeType,
      },
    });
  } catch (error) {
    console.error("Error downloading leave document:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}
