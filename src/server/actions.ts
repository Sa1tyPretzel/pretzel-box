"use server";

import { and, eq, or } from "drizzle-orm";
import { db } from "./db";
import { files_table } from "./db/schema";
import { auth } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";

const utApi = new UTApi();

export async function deleteFile(fileId: number) {
  const session = await auth();
  const userId = session?.userId;

  const [file] = await db
    .select()
    .from(files_table)
    .where(
      and(
        eq(files_table.id, fileId),
        or(eq(files_table.ownerId, userId ?? ""), eq(files_table.ownerId, "0"))
      )
    );

  if (!file) {
    return { error: "File not found or unauthorized" };
  }

  const utapiResult = await utApi.deleteFiles([
    file.url.replace("https://utfs.io/f/", ""),
  ]);
  console.log(utapiResult);

  const dbDeleteResult = await db.delete(files_table).where(eq(files_table.id, fileId));
  console.log(dbDeleteResult);

  const c = await cookies();
  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}