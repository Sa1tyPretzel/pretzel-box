import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <div className="relative mx-auto mb-6 h-24 w-24">
        <Image
          src="/logo.png"
          alt="Pretzel Box Logo"
          fill
          sizes="96px"
          className="object-contain"
          priority
        />
      </div>
      
      <h1 className="mb-4 bg-gradient-to-r from-neutral-200 to-neutral-400 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
        Pretzel Box
      </h1>
      <p className="mx-auto mb-8 max-w-md text-xl text-neutral-400 md:text-2xl">
        Fast and easy file storage with Personal Drive and Public Dropbox
      </p>

      <div className="flex gap-4 justify-center">
        <form
          action={async () => {
            "use server";

            const session = await auth();

            if (!session.userId) {
              return redirect("/sign-in");
            }

            return redirect("/drive");
          }}
        >
          <Button
            size="lg"
            type="submit"
            className="border border-neutral-700 bg-neutral-800 text-white transition-colors hover:bg-neutral-700"
          >
            Get Started
          </Button>
        </form>

        <form
          action={async () => {
            "use server";

            return redirect("/f/1125899906842628");
          }}
        >
          <Button
            size="lg"
            type="submit"
            className="border border-neutral-700 bg-neutral-800 text-white transition-colors hover:bg-neutral-700"
          >
            Go to Dropbox
          </Button>
        </form>
      </div>

      <footer className="mt-16 text-sm text-neutral-500">
        © {new Date().getFullYear()} Pretzel Box. All rights reserved.
      </footer>
    </>
  );
}
