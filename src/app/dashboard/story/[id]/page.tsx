import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Very small markdown renderer: headings + paragraphs is all our stories use. */
function renderStory(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (b.startsWith("## ")) return `<h2>${escapeHtml(b.slice(3))}</h2>`;
      if (b.startsWith("# ")) return `<h1>${escapeHtml(b.slice(2))}</h1>`;
      return `<p>${escapeHtml(b).replace(/\n/g, " ")}</p>`;
    })
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function StoryReaderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { first?: string };
}) {
  const session = await auth();
  const story = await prisma.story.findFirst({
    where: { id: params.id, child: { userId: session!.user.id } },
    include: { child: true, assets: true },
  });
  if (!story || !story.bodyMarkdown) notFound();

  const audio = story.assets.find((a) => a.type === "AUDIO");
  const images = story.assets
    .filter((a) => a.type === "IMAGE")
    .sort((a, b) => (a.sceneIndex ?? 0) - (b.sceneIndex ?? 0));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm text-night-500 hover:text-night-800"
      >
        ← Library
      </Link>

      {searchParams.first === "1" && (
        <div className="mt-4 rounded-xl bg-dawn-100 p-4 text-center text-night-700">
          🎉 Here&apos;s {story.child.name}&apos;s first story. Subscribe to get a
          new one every night.
        </div>
      )}

      <article className="mt-6 rounded-2xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm uppercase tracking-wide text-night-400">
          For {story.child.name} ·{" "}
          {new Date(story.forDate).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        {audio && (
          <div className="mt-4">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={audio.url} className="w-full">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0].url}
            alt=""
            className="mt-6 w-full rounded-xl"
          />
        )}

        <div
          className="prose-story mt-6"
          dangerouslySetInnerHTML={{ __html: renderStory(story.bodyMarkdown) }}
        />

        {images.length > 1 && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {images.slice(1).map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt="" className="rounded-xl" />
            ))}
          </div>
        )}
      </article>

      <p className="mt-6 text-center text-sm text-night-400">
        {story.wordCount} words · about {story.readMinutes} minutes · sweet dreams 🌙
      </p>
    </div>
  );
}
