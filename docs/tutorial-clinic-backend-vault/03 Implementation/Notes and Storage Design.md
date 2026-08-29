---
title: Notes and Storage Design
status: recommended
tags: [notes, storage, uploads]
---

# Notes and Storage design

## Storage model

Use a private bucket named `tutorial-notes`. Store metadata in Postgres and file bytes in Supabase Storage.

Recommended object path:

```text
<auth-user-uuid>/<note-uuid>/<file-uuid>-<sanitized-file-name>
```

The first folder segment lets the upload policy verify ownership. A random file UUID avoids collisions and guessed replacement paths.

## Allowed files

Default maximum: 25 MB per file.

Allow:

- PDF
- DOC/DOCX
- TXT
- JPEG/PNG
- PPT/PPTX
- XLS/XLSX

Block video and active web content. Validate extension, MIME type, and size in the browser for feedback and again through Storage/bucket configuration or trusted server processing. Client validation alone is bypassable.

## Upload workflow

1. Create a note draft and receive its database UUID.
2. Generate a random file UUID and safe path under the current user's folder.
3. Upload to the private bucket without `upsert`.
4. Insert the `note_files` metadata row.
5. Submit the note by changing Draft/Rejected to Pending.
6. If metadata insert fails, attempt cleanup and surface a recoverable error.
7. Use a maintenance task to delete orphaned objects older than a safe threshold.

Avoid upsert for shared note files. Upsert requires Storage `INSERT + SELECT + UPDATE` and can unintentionally replace an approved file. Supabase documents the required operations in [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Read authorization

A user may read/download when:

- they uploaded the note; or
- they are an admin; or
- the note is Approved and its target year levels include their profile year; or
- the product decision explicitly marks the note open to all years.

Keep the bucket private and rely on authenticated downloads or short-lived signed URLs from a trusted function. Never make the entire note bucket public.

## Moderation

`moderate_note(note_id, status, reason)` should:

- require an active admin;
- allow only Approved or Rejected;
- require a reason for rejection;
- record moderator and timestamp;
- award or reconcile note points in the same database transaction;
- create a notification;
- return the updated note.

The point trigger is state-based: the current ledger total for the note is reconciled to 60 when approved and 0 otherwise. Repeated approvals do not double-award.

## Preview safety

- Serve files as downloads where possible.
- Do not render arbitrary HTML.
- Use the browser's safe PDF/image preview for supported formats.
- Treat Office documents as downloads unless a trusted preview service is added.
- Never execute macros or embedded content.

## Download counts

Do not increment a mutable counter directly from the browser. Use an RPC that authorizes access and records a download event or atomically increments a counter. Apply rate limiting if the count affects ranking or incentives.
