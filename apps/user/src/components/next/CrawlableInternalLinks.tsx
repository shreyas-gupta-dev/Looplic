type InternalLink = {
  href: string;
  label: string;
};

type CrawlableInternalLinksProps = {
  title: string;
  links: InternalLink[];
};

export function CrawlableInternalLinks({ title, links }: CrawlableInternalLinksProps) {
  const visibleLinks = links.filter((link) => link.href && link.label);

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border bg-background py-8">
      <div className="container">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
        <nav aria-label={title} className="mt-4 flex flex-wrap gap-2">
          {visibleLinks.map((link, i) => (
            <a
              key={`${link.href}-${link.label}-${i}`}
              href={link.href}
              className="rounded-full border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
