import type * as PageTree from "fumadocs-core/page-tree";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { Sidebar } from "./sidebar";

interface NavLink {
  text: string;
  url: string;
  active?: "url" | "nested-url";
}

interface DocsLayoutProps {
  children: ReactNode;
  tree: PageTree.Root;
  nav?: {
    title?: ReactNode;
    links?: NavLink[];
    githubUrl?: string;
  };
}

export function DocsLayout({ children, tree, nav }: DocsLayoutProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader
        title={nav?.title ?? "Documentation"}
        links={nav?.links}
        githubUrl={nav?.githubUrl}
      />
      <div className="mx-auto max-w-7xl pt-14">
        <Sidebar tree={tree} />
        <main className="lg:ml-64 xl:mr-56">{children}</main>
      </div>
    </div>
  );
}
