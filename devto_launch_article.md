---
title: Why I Built OnlyFiles: Stop Uploading Your Sensitive Documents to Converter Websites
published: true
description: Most online PDF and file converters upload your sensitive files to remote cloud servers. Here is how OnlyFiles processes everything 100% in the browser using Web Crypto, Canvas, and WebAssembly.
tags: webdev, privacy, javascript, showdev
canonical_url: https://onlyfiles.in
---

# Why I Built OnlyFiles: Stop Uploading Your Sensitive Documents to Converter Websites

How many times have you needed to compress a tax return PDF, convert a photo of your passport, or merge legal contracts, and typed into Google:

> *"compress PDF free"* or *"convert PNG to JPG online"*

You click the first result, drag your file onto the dotted upload box, wait for a progress bar to upload your file to some foreign cloud server, and then download the result.

Most people don't realize what actually happens behind the scenes: **your private files are uploaded to someone else's infrastructure**. Even if a site promises "files are deleted after 60 minutes", your data traversed the public internet, was saved to their disks, and was processed on their machines. Data breaches happen constantly, and server-side logs often retain sensitive file attachments indefinitely.

I wanted to fix this fundamental privacy flaw.

That's why I built **[OnlyFiles](https://onlyfiles.in)** — a free, browser-based suite of 19 tools where **every single operation runs 100% on your device**.

---

## The Philosophy: Zero Uploads, Zero Servers

With modern web browser APIs, there is virtually no reason a simple PDF merge or image compression needs to touch a cloud backend. 

Your laptop or smartphone already has a powerful multi-core CPU and GPU. [OnlyFiles](https://onlyfiles.in) uses your browser's native capabilities instead of renting cloud servers:

* **Canvas 2D & OffscreenCanvas**: Handles image decoding, pixel resizing, format conversion (WebP, JPG, PNG), and watermarking directly in memory.
* **Web Crypto API (`window.crypto.subtle`)**: Military-grade AES-256-GCM encryption with PBKDF2 key derivation (250,000 iterations of SHA-256). The encryption and decryption happen strictly in your browser tab.
* **Client-Side PDF Parsing (`pdf-lib`)**: Reads raw binary PDF streams, extracts objects, reorders pages, merges documents, and recompresses structural streams without sending a single byte over the wire.
* **Lossless EXIF/GPS Scrubbing**: Parses raw JPEG/TIFF binary headers (`APP1` markers), extracts the EXIF metadata to display to the user, and strips GPS location coordinates cleanly before the file ever leaves your computer.

---

## 3 Big Advantages of On-Device Processing

### 1. True Privacy
You can disconnect your Wi-Fi after opening [OnlyFiles](https://onlyfiles.in), and every tool continues to work. If you open your browser's Network tab, you will see zero outbound POST requests containing your file bytes.

### 2. Zero Upload Bottlenecks
Have you ever tried uploading a 200 MB 4K video or a 50-page scanned legal PDF on a slow connection? Server-based converters make you wait for the upload to complete, wait in a server queue, and then wait for the download. 
With [OnlyFiles](https://onlyfiles.in), operations happen at the speed of your local memory and SSD.

### 3. No File Size Arbitrary Paywalls
Most converter websites artificially restrict you to 25 MB unless you buy a $15/month subscription. Because OnlyFiles uses your device's memory, we don't bear server compute or bandwidth costs, allowing us to keep the core tools free.

---

## What Tools Are Included?

The studio includes 19 dedicated utilities across four studios:

1. **PDF Studio**: [PDF Compressor](https://onlyfiles.in), PDF Merge, Page Reorder/Split/Rotate, and JPG-to-PDF.
2. **Image Studio**: [Image Compressor & Converter](https://onlyfiles.in), Batch Photo Compression, Metadata Scrubber, Blur & Privacy Redaction, Watermarking, and Favicon Generator.
3. **Security Vault**: Client-side AES-256-GCM file encryption and decryption.
4. **Media & Utilities**: Video compression, video trimming, frame grabber, custom QR code generator, and bulk renamer.

---

## Check It Out

I’d love for developers and privacy-conscious users to test it out:

👉 **Try it here**: [https://onlyfiles.in](https://onlyfiles.in)

If you have feedback on performance, edge cases with complex PDFs, or ideas for new client-side tools you'd love to see added, let me know in the comments below!
