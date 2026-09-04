"use client";

import MediaImage from "@/components/media-image";
import EmptyState from "@/components/empty-state";
import SectionHeader from "@/components/section-header";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon, FavouriteIcon } from "@hugeicons/core-free-icons";

export interface RailPost {
  id?: string;
  title: string;
  image?: string;
  authorName?: string;
  authorAvatar?: string;
  likes?: number;
}

interface PostsRailProps {
  posts: RailPost[];
  href?: string;
  emptyDescription?: string;
}

/**
 * Community posts rail. Shared by both previews so a place and an event
 * present their social feed identically — including when there isn't one.
 */
export default function PostsRail({
  posts,
  href = "/",
  emptyDescription = "No posts have been shared here yet. Be the first to post about it.",
}: PostsRailProps) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Posts"
        badge={posts.length ? `${posts.length}` : undefined}
        href={posts.length ? href : undefined}
      />
      {posts.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Image02Icon} size={26} />}
          title="No posts yet"
          description={emptyDescription}
        />
      ) : (
        <div className="chip-rail -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {posts.map((post, i) => (
            <article
              key={post.id ?? i}
              className="flex w-[180px] shrink-0 flex-col gap-y-2"
            >
              <MediaImage
                src={post.image}
                alt={post.title}
                className="h-[200px] w-full rounded-2xl border border-background-light"
              />
              <p className="line-clamp-2 text-xs font-medium text-primary-text">
                {post.title}
              </p>
              <div className="flex items-center justify-between gap-x-2">
                <div className="flex min-w-0 items-center gap-x-1.5">
                  <MediaImage
                    src={post.authorAvatar}
                    alt={post.authorName ?? "Author"}
                    className="h-5 w-5 shrink-0 rounded-full"
                  />
                  <p className="truncate text-xxs text-secondary-text">
                    {post.authorName ?? "SpinStrip user"}
                  </p>
                </div>
                {typeof post.likes === "number" && (
                  <div className="flex shrink-0 items-center gap-x-1 text-primary">
                    <HugeiconsIcon
                      icon={FavouriteIcon}
                      size={14}
                      color="currentColor"
                    />
                    <p className="text-xxs">{post.likes}</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
