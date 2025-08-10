import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { MUTATIONS, QUERIES } from "~/server/db/queries";

const f = createUploadthing();

const DROPBOX_FOLDER_ID = 1125899906842628;

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  driveUploader: f({
    blob: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "512MB",
      maxFileCount: 999,
    },
  })
    .input(
      z.object({
        folderId: z.number(),
      }),
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!user.userId) throw new UploadThingError("Unauthorized");

      const folder = await QUERIES.getFolderById(input.folderId);

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!folder) throw new UploadThingError("Folder not found");

      // Allow access if the owner is the current user or it's a public folder
      const isOwnerOrPublic = folder.ownerId === user.userId || folder.ownerId === "0";
      if (!isOwnerOrPublic) {
        throw new Error("Unauthorized");
      }

      if (folder.ownerId !== user.userId)
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, parentId: input.folderId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      await MUTATIONS.createFile({
        file: {
          name: file.name,
          size: file.size,
          url: file.url,
          parent: metadata.parentId,
        },
        userId: metadata.userId,
      });

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),

  // Dropbox Uploader (Public, No Auth)
  dropboxUploader: f({
    blob: {
      maxFileSize: "512MB",
      maxFileCount: 999,
    },
  })
    .input(
      z.object({
        folderId: z.number(),
      }),
    )
    .middleware(async ({ input }) => {
      if (input.folderId !== DROPBOX_FOLDER_ID) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("Invalid Dropbox Folder ID");
      }
      return { parentId: input.folderId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Public upload to Dropbox:", file.url);

      await MUTATIONS.createFile({
        file: {
          name: file.name,
          size: file.size,
          url: file.url,
          parent: metadata.parentId,
        },
        userId: "0",
      });

      return { uploadedBy: "Public" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;