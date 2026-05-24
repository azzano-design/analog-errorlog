# Azzano Design

Jekyll theme for [azzano.design](https://azzano.design).

## Development

Requires Ruby 3+ (via Homebrew: `brew install ruby`).

```bash
# Install dependencies (first time)
PATH="/opt/homebrew/opt/ruby/bin:$PATH" bundle install

# Serve locally with live reload
PATH="/opt/homebrew/opt/ruby/bin:$PATH" bundle exec jekyll serve

# Build for production
PATH="/opt/homebrew/opt/ruby/bin:$PATH" bundle exec jekyll build
```

The site is served at `http://localhost:4000`.

## Adding a project post

Create a file in `_posts/` named `YYYY-MM-DD-project-slug.md`:

```markdown
---
layout: post
title: "Project Name"
tag: "Launching for macOS"
year: "2025"
platform: "macOS"
role: "Design & Development"
description: "One-line description shown in the work list and as the post lead."
image: /assets/images/project-name.jpg
---

Your project write-up in Markdown goes here.

## Section heading

Body copy...
```

The `image` field is used both as the large hero on the post page and as the thumbnail in the work list on the home page. If omitted, a placeholder gradient is shown.

## Structure

```
_layouts/
  default.html   — HTML shell (head, nav, footer)
  home.html      — Homepage sections (extends default)
  post.html      — Project post page (extends default)
_includes/
  head.html      — <head> with meta, OG, structured data
  nav.html       — Fixed top navigation
  footer.html    — Site footer
_posts/          — Project posts (Markdown)
assets/
  css/style.css  — All styles
  js/index.js    — Three.js hero canvas (home only)
  fonts/         — ArgentCF display font
```
