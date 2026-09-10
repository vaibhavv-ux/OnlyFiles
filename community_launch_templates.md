# OnlyFiles — Community Launch & Backlink Kit

Use these tailored posts for each community to maximize engagement and get permanent, high-authority backlinks.

---

## 1. Reddit: r/SideProject (DR 91)

**Title**: I built a free file converter & compressor that runs 100% in your browser without uploading files to any server

**Post Body**:
```markdown
Hey everyone!

I got tired of having to upload private files (bank statements, IDs, tax returns, personal photos) to random converter websites just to compress a PDF or convert a PNG. Even when services claim they delete files after an hour, your sensitive data still passes through their servers.

So I built **[OnlyFiles](https://onlyfiles.in)**.

It's a collection of 19 tools that run entirely client-side using modern browser APIs (WebAssembly, Canvas, and Web Crypto):

- **Image Tools**: Compress JPG/PNG/WebP, batch compression, watermark, strip GPS/EXIF metadata, blur/redact sensitive regions, upscale photos.
- **PDF Tools**: Compress PDFs, merge multiple PDFs, reorder/delete pages, convert images to PDF.
- **Security**: Client-side AES-256-GCM file encryption with passwords derived via PBKDF2 (nothing is sent over the internet).
- **Video & Utilities**: Compress MP4/WebM, trim clips, grab frames, generate branded QR codes, batch renamer.

Because it runs on your own device, there are no upload queues, it works offline if you disconnect your Wi-Fi, and your files literally never leave your machine.

Six core tools are completely free forever with no signup or card needed.

Check it out here: https://onlyfiles.in

I’d love your brutal feedback on UI speed, UX, and any other tools you’d like to see added!
```

---

## 2. Reddit: r/privacy (DR 91)

**Title**: A browser-based alternative to iLovePDF and Smallpdf where zero file bytes are uploaded to cloud servers

**Post Body**:
```markdown
A recurring privacy problem with popular document and file tools (like Smallpdf, iLovePDF, TinyPNG, etc.) is that processing happens on third-party cloud infrastructure. Users unknowingly send passports, financial documents, and family photos across the public internet to be processed on someone else's disk.

I built **[OnlyFiles](https://onlyfiles.in)** to tackle this:

- **100% Client-Side**: All PDF merging/compressing, image processing, and video trimming execute in the browser using WebAssembly and Web Crypto.
- **Offline Capable**: You can load the page, turn on airplane mode, and process files.
- **Zero Telemetry on Files**: Check DevTools Network tab — there is zero file payload transmission.
- **On-Device EXIF Scrubber**: Inspect and scrub GPS coordinates, camera models, and timestamps from photos losslessly.
- **Client-Side AES-256 Vault**: Encrypt any sensitive file with AES-256-GCM using Web Crypto before emailing or backing it up.

Live site: https://onlyfiles.in

Feedback on security and client-side performance is welcome!
```

---

## 3. Product Hunt (DR 90) Launch Kit

* **Name**: OnlyFiles
* **Tagline**: 100% private browser file tools. Zero uploads, zero servers.
* **Pricing**: Free with $4.99 lifetime Pro ($2.49 with promo code PRODHUNT)
* **Website**: https://onlyfiles.in
* **Maker First Comment**:
```markdown
Hey Product Hunt! 👋

I'm thrilled to introduce **OnlyFiles**!

We all use file converters, but almost all of them make you upload your confidential documents and photos to remote servers. We wanted desktop-grade privacy without needing to download and install bloated software.

OnlyFiles is a suite of 19 tools for compressing, converting, editing, merging, and encrypting files that runs **100% in your browser tab**. 

Key highlights:
- 🚀 Instant processing with zero upload/download waiting
- 🔒 Files never touch a server (works even with Wi-Fi disconnected)
- 📄 Comprehensive PDF tools (Compress, Merge, Page toolkit, JPG to PDF)
- 🖼️ Photo & video studio (Batch compression, EXIF GPS scrubber, blur redaction, video trim)
- 🔐 On-device AES-256-GCM file encryption

To celebrate our PH launch, use promo code **PRODHUNT** for 50% off lifetime Pro Studio ($2.49 instead of $4.99).

Try it out live at https://onlyfiles.in — I'm here to answer any questions and hear your thoughts!
```

---

## 4. Indie Hackers (DR 85) Product Listing

* **Product Name**: OnlyFiles
* **Tagline**: The private, serverless file processing studio
* **Website**: https://onlyfiles.in
* **Revenue Model**: Freemium / One-time lifetime purchase ($4.99)
* **Description**: Built with vanilla HTML/JS and modern Web APIs, OnlyFiles turns your browser into a local file powerhouse that competes directly with server-heavy incumbents like Smallpdf and iLovePDF.
