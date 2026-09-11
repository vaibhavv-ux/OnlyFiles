# OnlyFiles — Private, Browser-Based File Processing Studio

[![Website](https://img.shields.io/badge/Website-onlyfiles.in-0d9488?style=for-the-badge)](https://onlyfiles.in)
[![Access](https://img.shields.io/badge/Access-100%25_Free-brightgreen?style=for-the-badge)](https://onlyfiles.in)
[![Account](https://img.shields.io/badge/Account-Not_Required-blue?style=for-the-badge)](https://onlyfiles.in)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_On--Device-5eead4?style=for-the-badge)](https://onlyfiles.in/privacy-policy)

> **[OnlyFiles](https://onlyfiles.in)** is an all-in-one, 100% free browser toolkit for compressing, converting, merging, and encrypting PDFs, images, and videos. Every tool runs **100% client-side** in your web browser — your files are never uploaded to any remote server.

---

## 🔒 Why OnlyFiles?

Most popular online converters (iLovePDF, Smallpdf, TinyPNG, CloudConvert) require uploading your personal documents, medical records, bank statements, and private photos to remote cloud servers. Even when services claim to delete files after an hour, your sensitive data leaves your control.

**OnlyFiles eliminates the upload step entirely:**
* **Zero Cloud Uploads**: Processing happens locally via your browser's native JavaScript, Canvas, Web Crypto, and WebAssembly engines.
* **Instant Processing**: No queue times, no network upload bottlenecks, and no waiting for cloud server rendering.
* **Works Offline**: Once loaded in your browser, you can disconnect your Wi-Fi and every tool still works.
* **Private by Design**: We cannot read, store, or sell your files because we literally never receive them.

Visit the live app: **[https://onlyfiles.in](https://onlyfiles.in)**

---

## 🛠️ Suite of 19 On-Device Tools

### 🖼️ Image Studio
* **[Image Compressor & Converter](https://onlyfiles.in)**: Compress JPG, PNG, and WebP files with live visual quality sliders and dimension controls.
* **Batch Image Compressor**: Process dozens of photos concurrently with unified compression presets.
* **Watermark Studio**: Add customizable, non-destructive text watermarks (opacity, color, positioning).
* **Privacy Metadata Scrubber**: Inspect and scrub embedded EXIF, GPS coordinates, and camera metadata losslessly before sharing.
* **Favicon & App Icon Generator**: Turn any square image into a complete favicon set (16x16, 32x32, 48x48, 180x180, 192x192, 512x512) and `site.webmanifest`.
* **Photo Effects & Filters**: Apply visual adjustments, monochromatic duotones, and vintage filters entirely on HTML5 Canvas.
* **Blur & Privacy Redaction**: Selectively blur faces, license plates, or credit card numbers, or pixelate sensitive document areas.
* **Image Upscaler**: 2× and 4× smart bicubic enlargement with edge-aware sharpening.

### 📄 PDF Studio
* **[PDF Compressor](https://onlyfiles.in)**: Compress large PDF scans and contracts right in your browser.
* **PDF Merge**: Combine multiple PDF files into one clean document with drag-and-drop page ordering.
* **PDF Page Toolkit**: Delete, rotate, extract, or rearrange individual PDF pages.
* **JPG to PDF**: Convert photos and scanned images into paginated PDF documents.

### 🎬 Video & Audio Tools
* **[Video Compressor](https://onlyfiles.in)**: Reduce MP4 and WebM video file sizes using hardware-accelerated MediaRecorder pipelines.
* **Video Trimmer**: Cut video clips down to exact timestamps without sending megabytes across the internet.
* **Video Frame Grabber**: Extract high-resolution still frames or interval sequences directly from video streams.

### 🔐 Security & Utilities
* **Security Vault (AES-256-GCM)**: Password-encrypt any file using 256-bit AES encryption with keys derived via PBKDF2 (250,000 rounds of SHA-256).
* **File Decryptor**: Unlock and restore encrypted files client-side.
* **Custom QR Code Generator**: Generate crisp vector QR codes with custom styling, colors, and embedded logos.
* **Batch File Renamer**: Batch-rename hundreds of files using prefix, suffix, numbering, and find-and-replace patterns.

---

## ⚡ Technical Architecture

OnlyFiles utilizes modern web standards to achieve desktop-grade processing speeds inside standard web browsers:

```
[User Device]
   │
   ├─► PDF Engine: pdf-lib (client-side binary parsing and page composition)
   ├─► Image Engine: Canvas 2D API + OffscreenCanvas (high-throughput multi-threaded pixel manipulation)
   ├─► Cryptography: Web Crypto API (SubtleCrypto: AES-256-GCM, PBKDF2 SHA-256)
   └─► Video Processing: MediaStreams & MediaRecorder APIs
```

No file bytes are transmitted over HTTP/HTTPS during conversion or compression.

---

## 🌐 Links & Resources

* **Website**: [https://onlyfiles.in](https://onlyfiles.in)
* **Pricing**: 100% Free — All 19 tools are unlocked and free to use with zero account or card required.
* **Terms & Conditions**: [https://onlyfiles.in/terms-and-conditions](https://onlyfiles.in/terms-and-conditions)
* **Privacy Policy**: [https://onlyfiles.in/privacy-policy](https://onlyfiles.in/privacy-policy)
* **Contact & Support**: [hello@onlyfiles.in](mailto:hello@onlyfiles.in)

---

## ⚖️ License

All client-side algorithms, styling, and branding are © OnlyFiles. Hosted at [onlyfiles.in](https://onlyfiles.in).
